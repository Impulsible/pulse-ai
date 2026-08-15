/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/ai/service.ts
import { openai, AI_CONFIG, SYSTEM_PROMPT, getValidModelName } from "./config";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export interface AIServiceOptions {
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private conversationHistory: ChatCompletionMessageParam[] = [];
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(options: AIServiceOptions = {}) {
    const systemPrompt = options.systemPrompt || SYSTEM_PROMPT;
    this.model = getValidModelName(options.model);
    this.temperature = options.temperature || AI_CONFIG.temperature;
    this.maxTokens = options.maxTokens || AI_CONFIG.maxTokens;

    this.conversationHistory = [{ role: "system", content: systemPrompt }];
  }

  /**
   * Generate a response from the AI
   */
  async generateResponse(
    userMessage: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    },
  ): Promise<AIResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: this.conversationHistory,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        presence_penalty: AI_CONFIG.presencePenalty,
        frequency_penalty: AI_CONFIG.frequencyPenalty,
        stream: false,
      });

      const responseContent = completion.choices[0]?.message?.content || "";

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: responseContent,
      });

      return {
        content: responseContent,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
        model: this.model,
      };
    } catch (error) {
      console.error("AI generation error:", error);
      throw new AIError("Failed to generate response", error);
    }
  }

  /**
   * Generate a streaming response
   */
  async *generateStreamResponse(
    userMessage: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      const stream = await openai.chat.completions.create({
        model: this.model,
        messages: this.conversationHistory,
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        presence_penalty: AI_CONFIG.presencePenalty,
        frequency_penalty: AI_CONFIG.frequencyPenalty,
        stream: true,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          yield content;
        }
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      });
    } catch (error) {
      console.error("AI streaming error:", error);
      throw new AIError("Failed to stream response", error);
    }
  }

  /**
   * Generate a response with memory context
   */
  async generateResponseWithMemory(
    userMessage: string,
    context: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<AIResponse> {
    // Add context to the conversation
    if (context) {
      this.conversationHistory.push({
        role: "system",
        content: `Context: ${context}`,
      });
    }

    return this.generateResponse(userMessage, options);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    const systemPromptMessage = this.conversationHistory.find(
      (message) => message.role === "system",
    );
    const systemPrompt =
      typeof systemPromptMessage?.content === "string"
        ? systemPromptMessage.content
        : SYSTEM_PROMPT;

    this.conversationHistory = [{ role: "system", content: systemPrompt }];
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatCompletionMessageParam[] {
    return [...this.conversationHistory];
  }

  /**
   * Set conversation history
   */
  setHistory(history: ChatCompletionMessageParam[]): void {
    this.conversationHistory = history;
  }

  /**
   * Get the current model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Set the model
   */
  setModel(model: string): void {
    this.model = getValidModelName(model);
  }

  /**
   * Get conversation length
   */
  getConversationLength(): number {
    return this.conversationHistory.length;
  }

  /**
   * Get total tokens used (approximate)
   */
  getEstimatedTokens(): number {
    // Rough estimation: ~4 characters per token
    return this.conversationHistory.reduce((total, msg) => {
      return total + Math.ceil((msg.content?.length || 0) / 4);
    }, 0);
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return !!process.env.GROQ_API_KEY;
  }

  /**
   * Truncate history to prevent token limit issues
   */
  truncateHistory(maxMessages: number = 20): void {
    if (this.conversationHistory.length > maxMessages) {
      const systemMessage = this.conversationHistory[0];
      const recentMessages = this.conversationHistory.slice(-maxMessages + 1);
      this.conversationHistory = [systemMessage, ...recentMessages];
    }
  }
}

/**
 * AI Error class
 */
export class AIError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "AIError";
  }

  /**
   * Check if this error is a rate limit error
   */
  isRateLimit(): boolean {
    return (
      this.statusCode === 429 ||
      this.message.includes("rate limit") ||
      this.message.includes("too many requests")
    );
  }

  /**
   * Check if this error is an authentication error
   */
  isAuthError(): boolean {
    return (
      this.statusCode === 401 ||
      this.message.includes("API key") ||
      this.message.includes("authentication")
    );
  }

  /**
   * Check if this error is a model error
   */
  isModelError(): boolean {
    return (
      this.message.includes("model") || this.message.includes("decommissioned")
    );
  }
}

// Export a singleton instance
export const aiService = new AIService();
