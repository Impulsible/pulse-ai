/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/ai/service.ts

import { openai, AI_CONFIG, buildSystemPrompt, getValidModelName, sanitizeAIError, rateLimiter, estimateTokens, type PersonalityMode } from './config'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface AIMessage {
  role: MessageRole
  content: string
  name?: string
  toolCallId?: string
}

export interface AIUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface AIResponse {
  content: string
  usage?: AIUsage
  model?: string
  finishReason?: string
  durationMs?: number
  cached?: boolean
}

export interface AIServiceOptions {
  systemPrompt?: string
  personality?: PersonalityMode
  model?: string
  temperature?: number
  maxTokens?: number
  userName?: string
  memoryContext?: string
  customInstructions?: string
  maxHistoryLength?: number
  autoTruncate?: boolean
}

export interface GenerateOptions {
  temperature?: number
  maxTokens?: number
  model?: string
  signal?: AbortSignal
  metadata?: Record<string, unknown>
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ERROR CLASS
   ═══════════════════════════════════════════════════════════════════════════════ */

export class AIError extends Error {
  public readonly statusCode?: number
  public readonly originalError?: unknown
  public readonly retryable: boolean
  public readonly code?: string

  constructor(
    message: string,
    options: {
      originalError?: unknown
      statusCode?: number
      code?: string
    } = {}
  ) {
    super(message)
    this.name = 'AIError'
    this.originalError = options.originalError
    this.statusCode = options.statusCode
    this.code = options.code
    this.retryable = this.isRetryable()
  }

  private isRetryable(): boolean {
    if (!this.statusCode) return true
    return this.statusCode >= 500 || this.statusCode === 429 || this.statusCode === 408
  }

  isRateLimit(): boolean {
    return this.statusCode === 429 || /rate.?limit|too.?many.?requests/i.test(this.message)
  }

  isAuthError(): boolean {
    return this.statusCode === 401 || /api.?key|authentication|unauthorized/i.test(this.message)
  }

  isModelError(): boolean {
    return /model|decommissioned|not.?found/i.test(this.message)
  }

  isNetworkError(): boolean {
    return /network|fetch|timeout|econnrefused/i.test(this.message)
  }

  isContextTooLong(): boolean {
    return /context.?length|too.?many.?tokens|maximum.?context/i.test(this.message)
  }

  /** User-friendly message (safe for UI display) */
  toUserMessage(): string {
    return sanitizeAIError(this)
  }

  /** Convert to plain object for logging */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      retryable: this.retryable,
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   AI SERVICE — production-grade with retries, cancellation, memory integration
   ═══════════════════════════════════════════════════════════════════════════════ */

export class AIService {
  private history: ChatCompletionMessageParam[] = []
  private model: string
  private temperature: number
  private maxTokens: number
  private personality: PersonalityMode
  private userName?: string
  private memoryContext?: string
  private customInstructions?: string
  private maxHistoryLength: number
  private autoTruncate: boolean

  constructor(options: AIServiceOptions = {}) {
    this.personality = options.personality ?? 'default'
    this.userName = options.userName
    this.memoryContext = options.memoryContext
    this.customInstructions = options.customInstructions
    this.model = getValidModelName(options.model)
    this.temperature = options.temperature ?? AI_CONFIG.temperature
    this.maxTokens = options.maxTokens ?? AI_CONFIG.maxTokens
    this.maxHistoryLength = options.maxHistoryLength ?? 40
    this.autoTruncate = options.autoTruncate ?? true

    const systemPrompt = options.systemPrompt ?? this.buildSystemPromptDynamic()
    this.history = [{ role: 'system', content: systemPrompt }]
  }

  /* ─── System prompt (rebuilt on demand) ────────────────────────────── */
  private buildSystemPromptDynamic(): string {
    return buildSystemPrompt({
      personality: this.personality,
      memoryContext: this.memoryContext,
      userName: this.userName,
      customInstructions: this.customInstructions,
    })
  }

  /** Update personality/memory/user without resetting history */
  updateSystemContext(updates: Partial<Pick<AIServiceOptions,
    'personality' | 'userName' | 'memoryContext' | 'customInstructions'
  >>): void {
    if (updates.personality) this.personality = updates.personality
    if (updates.userName !== undefined) this.userName = updates.userName
    if (updates.memoryContext !== undefined) this.memoryContext = updates.memoryContext
    if (updates.customInstructions !== undefined) this.customInstructions = updates.customInstructions

    // Refresh system prompt (always at index 0)
    const newPrompt = this.buildSystemPromptDynamic()
    if (this.history[0]?.role === 'system') {
      this.history[0] = { role: 'system', content: newPrompt }
    } else {
      this.history.unshift({ role: 'system', content: newPrompt })
    }
  }

  /* ─── Non-streaming generation with retries ────────────────────────── */
  async generate(
    userMessage: string,
    options: GenerateOptions = {}
  ): Promise<AIResponse> {
    if (!userMessage?.trim()) {
      throw new AIError('Message content is required')
    }

    // Add user message
    this.history.push({ role: 'user', content: userMessage })

    // Auto-truncate if needed
    if (this.autoTruncate) this.truncateHistory()

    const start = performance.now()
    const modelToUse = options.model ?? this.model

    try {
      const completion = await this.callWithRetry(
        () => openai.chat.completions.create({
          model: modelToUse,
          messages: this.history,
          temperature: options.temperature ?? this.temperature,
          max_tokens: options.maxTokens ?? this.maxTokens,
          presence_penalty: AI_CONFIG.presencePenalty,
          frequency_penalty: AI_CONFIG.frequencyPenalty,
          top_p: AI_CONFIG.topP,
          stream: false,
        }, { signal: options.signal }),
        3
      )

      const durationMs = Math.round(performance.now() - start)
      const choice = completion.choices[0]
      const content = choice?.message?.content ?? ''

      // Add assistant response
      this.history.push({ role: 'assistant', content })

      // Track rate limits
      rateLimiter.recordRequest(completion.usage?.total_tokens ?? 0)

      return {
        content,
        model: modelToUse,
        finishReason: choice?.finish_reason ?? undefined,
        durationMs,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
      }
    } catch (error) {
      // Remove the user message on failure so retry doesn't duplicate
      const lastIdx = this.history.length - 1
      if (this.history[lastIdx]?.role === 'user') {
        this.history.pop()
      }
      throw this.wrapError(error)
    }
  }

  /* ─── Streaming generation ─────────────────────────────────────────── */
  async *generateStream(
    userMessage: string,
    options: GenerateOptions = {}
  ): AsyncGenerator<string, AIResponse, unknown> {
    if (!userMessage?.trim()) {
      throw new AIError('Message content is required')
    }

    this.history.push({ role: 'user', content: userMessage })
    if (this.autoTruncate) this.truncateHistory()

    const start = performance.now()
    const modelToUse = options.model ?? this.model
    let fullContent = ''
    let finishReason: string | undefined
    let usage: AIUsage | undefined

    try {
      const stream = await openai.chat.completions.create({
        model: modelToUse,
        messages: this.history,
        temperature: options.temperature ?? this.temperature,
        max_tokens: options.maxTokens ?? this.maxTokens,
        presence_penalty: AI_CONFIG.presencePenalty,
        frequency_penalty: AI_CONFIG.frequencyPenalty,
        top_p: AI_CONFIG.topP,
        stream: true,
        stream_options: { include_usage: true },
      }, { signal: options.signal })

      for await (const chunk of stream) {
        // Check for cancellation
        if (options.signal?.aborted) {
          throw new AIError('Stream aborted', { code: 'ABORTED' })
        }

        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (delta) {
          fullContent += delta
          yield delta
        }

        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason
        }
        if (chunk.usage) {
          usage = {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          }
        }
      }

      const durationMs = Math.round(performance.now() - start)
      this.history.push({ role: 'assistant', content: fullContent })
      rateLimiter.recordRequest(usage?.totalTokens ?? estimateTokens(fullContent))

      return {
        content: fullContent,
        model: modelToUse,
        finishReason,
        durationMs,
        usage,
      }
    } catch (error) {
      // Roll back the user message so retries don't stack
      const lastIdx = this.history.length - 1
      if (this.history[lastIdx]?.role === 'user') {
        this.history.pop()
      }
      throw this.wrapError(error)
    }
  }

  /* ─── Convenience: generate with memory context on-the-fly ─────────── */
  async generateWithMemory(
    userMessage: string,
    memoryContext: string,
    options: GenerateOptions = {}
  ): Promise<AIResponse> {
    // Temporarily inject memory as a system-role message before the user turn
    if (memoryContext) {
      this.history.push({
        role: 'system',
        content: `[Relevant memory context]\n${memoryContext}`,
      })
    }
    try {
      return await this.generate(userMessage, options)
    } finally {
      // Clean up the injected context message (keep history tidy)
      // Find and remove the injected marker
      const idx = this.history.findIndex(
        (m) => m.role === 'system' && typeof m.content === 'string' && m.content.startsWith('[Relevant memory context]')
      )
      if (idx > 0) this.history.splice(idx, 1)
    }
  }

  /* ─── Retry wrapper with exponential backoff ───────────────────────── */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        const wrapped = this.wrapError(error)

        // Don't retry non-retryable errors
        if (!wrapped.retryable || wrapped.isAuthError()) {
          throw wrapped
        }

        // Exponential backoff: 500ms, 1000ms, 2000ms
        if (attempt < maxAttempts - 1) {
          const delay = Math.min(500 * Math.pow(2, attempt), 4000)
          await new Promise((r) => setTimeout(r, delay))
        }
      }
    }

    throw this.wrapError(lastError)
  }

  /* ─── Error normalization ──────────────────────────────────────────── */
  private wrapError(error: unknown): AIError {
    if (error instanceof AIError) return error

    if (error instanceof Error) {
      // OpenAI SDK errors expose status
      const status = (error as any).status ?? (error as any).statusCode
      const code = (error as any).code
      return new AIError(error.message, {
        originalError: error,
        statusCode: status,
        code,
      })
    }

    return new AIError('Unknown AI error', { originalError: error })
  }

  /* ─── History management ───────────────────────────────────────────── */
  clearHistory(): void {
    const systemMsg = this.history.find((m) => m.role === 'system')
    this.history = systemMsg ? [systemMsg] : []
  }

  getHistory(): ChatCompletionMessageParam[] {
    return [...this.history]
  }

  setHistory(history: ChatCompletionMessageParam[]): void {
    // Ensure a system message exists at index 0
    const systemMsg = history.find((m) => m.role === 'system')
    if (!systemMsg) {
      this.history = [
        { role: 'system', content: this.buildSystemPromptDynamic() },
        ...history,
      ]
    } else {
      this.history = [...history]
    }
  }

  /**
   * Truncate history to prevent context overflow.
   * Preserves the system message + N most recent messages.
   */
  truncateHistory(maxMessages: number = this.maxHistoryLength): void {
    if (this.history.length <= maxMessages) return
    const systemMsg = this.history[0]?.role === 'system' ? this.history[0] : null
    const recent = this.history.slice(-(maxMessages - (systemMsg ? 1 : 0)))
    this.history = systemMsg ? [systemMsg, ...recent] : recent
  }

  /* ─── Introspection ────────────────────────────────────────────────── */
  getModel(): string {
    return this.model
  }

  setModel(model: string): void {
    this.model = getValidModelName(model)
  }

  getConversationLength(): number {
    return this.history.length
  }

  /** Estimated token count of current conversation */
  getEstimatedTokens(): number {
    return this.history.reduce((sum, msg) => {
      const content = typeof msg.content === 'string' ? msg.content : ''
      return sum + estimateTokens(content)
    }, 0)
  }

  isReady(): boolean {
    return !!process.env.GROQ_API_KEY
  }

  /** Get service stats */
  getStats() {
    return {
      model: this.model,
      messageCount: this.history.length,
      estimatedTokens: this.getEstimatedTokens(),
      personality: this.personality,
      hasMemoryContext: !!this.memoryContext,
      hasCustomInstructions: !!this.customInstructions,
      rateLimit: rateLimiter.getUsage(this.model),
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SINGLETON
   ═══════════════════════════════════════════════════════════════════════════════ */

export const aiService = new AIService()

/* ═══════════════════════════════════════════════════════════════════════════════
   CONVENIENCE FACTORY
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Create a new AI service configured for a specific user context.
 * Use this per-user or per-conversation for isolated state.
 */
export function createAIService(options: AIServiceOptions = {}): AIService {
  return new AIService(options)
}