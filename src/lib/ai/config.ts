// src/lib/ai/config.ts
import { OpenAI } from 'openai'

// Check for Groq API key
const groqApiKey = process.env.GROQ_API_KEY
const useGroq = !!groqApiKey

// Warning if no API key is set
if (!groqApiKey) {
  console.warn('GROQ_API_KEY is not set. AI features will not work.')
  console.warn('Please add GROQ_API_KEY to your .env.local file.')
} else {
  console.log('✅ Groq API configured successfully')
  console.log(`📤 Using model: ${process.env.GROQ_MODEL || 'llama-3.1-8b-instant'}`)
}

// Initialize OpenAI client with Groq's base URL
export const openai = new OpenAI({
  apiKey: groqApiKey || 'dummy-key',
  baseURL: useGroq ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1',
})

// AI Configuration
export const AI_CONFIG = {
  // Model selection (Groq models)
  model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  
  // Available Groq models:
  // - llama-3.1-8b-instant (Fastest, 14,400 RPD, 500,000 TPD)
  // - llama-3.3-70b-versatile (Complex logic, 1,000 RPD, 100,000 TPD)
  // - llama-4-scout-17b-16e-instruct (Large context, 1,000 RPD, 500,000 TPD)
  // - openai/gpt-oss-120b (Premium, 1,000 RPD, 200,000 TPD)
  
  temperature: 0.7,
  maxTokens: 4096,
  presencePenalty: 0.1,
  frequencyPenalty: 0.1,
  stream: true,
} as const

// System prompt for Pulse AI
export const SYSTEM_PROMPT = `You are Pulse AI, an intelligent and friendly AI assistant. Your purpose is to help users with their questions, tasks, and creative projects.

Key characteristics:
- You are helpful, knowledgeable, and engaging
- You provide accurate and thoughtful responses
- You can assist with coding, writing, analysis, and more
- You maintain context throughout conversations
- You are honest about your limitations
- You prioritize user privacy and security

Response guidelines:
- Be concise but comprehensive
- Use markdown formatting when appropriate
- Include code blocks with language specification when sharing code
- Ask clarifying questions when needed
- Provide examples to illustrate complex concepts
- Acknowledge when you're unsure about something
- Stay focused on the user's needs
- Be proactive in offering relevant suggestions

Remember: You are Pulse AI, representing the future of intelligent assistance.`

// Helper function to check if AI is configured
export function isAIConfigured(): boolean {
  return !!groqApiKey
}

// Helper function to get AI provider info
export function getAIProviderInfo() {
  return {
    provider: useGroq ? 'Groq' : 'None',
    model: AI_CONFIG.model,
    apiKeyConfigured: !!groqApiKey,
    baseURL: useGroq ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1',
  }
}

// Helper function to validate model name
export function getValidModelName(modelName?: string): string {
  const validModels = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'llama-4-scout-17b-16e-instruct',
    'openai/gpt-oss-120b',
    'whisper-large-v3-turbo',
  ]
  
  const model = modelName || AI_CONFIG.model
  if (validModels.includes(model)) {
    return model
  }
  
  console.warn(`⚠️ Model "${model}" may not be available. Using default: ${AI_CONFIG.model}`)
  return AI_CONFIG.model
}