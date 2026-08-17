// src/lib/ai/config.ts
import { OpenAI } from 'openai'

/* ═══════════════════════════════════════════════════════════════════════════════
   ENVIRONMENT VALIDATION — fail fast, log clearly
   ═══════════════════════════════════════════════════════════════════════════════ */

const ENV = {
  apiKey:      process.env.GROQ_API_KEY,
  model:       process.env.GROQ_MODEL,
  maxTokens:   process.env.GROQ_MAX_TOKENS,
  temperature: process.env.GROQ_TEMPERATURE,
  baseUrl:     process.env.GROQ_BASE_URL,
} as const

const isServer = typeof window === 'undefined'
const hasApiKey = !!ENV.apiKey

/* ═══════════════════════════════════════════════════════════════════════════════
   MODEL REGISTRY — every model with metadata for smart routing
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface ModelInfo {
  id: string
  displayName: string
  tier: 'fast' | 'balanced' | 'premium' | 'creative' | 'reasoning'
  contextWindow: number
  maxOutput: number
  rpd: number   // Requests per day (rate limit)
  tpd: number   // Tokens per day
  supportsStreaming: boolean
  supportsVision: boolean
  costLabel: 'free' | 'low' | 'medium' | 'high'
  description: string
  bestFor: string[]
}

export const MODELS: Record<string, ModelInfo> = {
  'llama-3.1-8b-instant': {
    id: 'llama-3.1-8b-instant',
    displayName: 'Pulse Instant',
    tier: 'fast',
    contextWindow: 131_072,
    maxOutput: 8_192,
    rpd: 14_400,
    tpd: 500_000,
    supportsStreaming: true,
    supportsVision: false,
    costLabel: 'free',
    description: 'Lightning-fast responses for everyday questions',
    bestFor: ['quick answers', 'chat', 'summaries', 'translations'],
  },
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    displayName: 'Pulse Pro',
    tier: 'balanced',
    contextWindow: 131_072,
    maxOutput: 32_768,
    rpd: 1_000,
    tpd: 100_000,
    supportsStreaming: true,
    supportsVision: false,
    costLabel: 'low',
    description: 'Balanced power for complex reasoning and coding',
    bestFor: ['coding', 'analysis', 'reasoning', 'writing'],
  },
  'llama-4-scout-17b-16e-instruct': {
    id: 'llama-4-scout-17b-16e-instruct',
    displayName: 'Pulse Scout',
    tier: 'balanced',
    contextWindow: 131_072,
    maxOutput: 16_384,
    rpd: 1_000,
    tpd: 500_000,
    supportsStreaming: true,
    supportsVision: false,
    costLabel: 'low',
    description: 'Extended context for long documents and codebases',
    bestFor: ['long docs', 'code review', 'multi-file analysis'],
  },
  'openai/gpt-oss-120b': {
    id: 'openai/gpt-oss-120b',
    displayName: 'Pulse Ultra',
    tier: 'premium',
    contextWindow: 131_072,
    maxOutput: 32_768,
    rpd: 1_000,
    tpd: 200_000,
    supportsStreaming: true,
    supportsVision: false,
    costLabel: 'medium',
    description: 'Premium reasoning for the most complex tasks',
    bestFor: ['research', 'complex reasoning', 'creative writing'],
  },
  'whisper-large-v3-turbo': {
    id: 'whisper-large-v3-turbo',
    displayName: 'Pulse Voice',
    tier: 'fast',
    contextWindow: 0,
    maxOutput: 0,
    rpd: 7_200,
    tpd: 0,
    supportsStreaming: false,
    supportsVision: false,
    costLabel: 'free',
    description: 'Fast speech-to-text transcription',
    bestFor: ['transcription', 'voice input'],
  },
}

export type ModelId = keyof typeof MODELS
export type ModelTier = ModelInfo['tier']

/* ═══════════════════════════════════════════════════════════════════════════════
   CONFIG — with runtime overrides and validation
   ═══════════════════════════════════════════════════════════════════════════════ */

const DEFAULT_MODEL: ModelId = 'llama-3.1-8b-instant'
const BASE_URL = ENV.baseUrl || 'https://api.groq.com/openai/v1'

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseFloatSafe(value: string | undefined, fallback: number, min = 0, max = 2): number {
  if (!value) return fallback
  const parsed = parseFloat(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

export const AI_CONFIG = {
  model:            (ENV.model as ModelId) || DEFAULT_MODEL,
  temperature:      parseFloatSafe(ENV.temperature, 0.7, 0, 2),
  maxTokens:        parseNumber(ENV.maxTokens, 4096),
  presencePenalty:  0.1,
  frequencyPenalty: 0.1,
  topP:             0.95,
  stream:           true,
  seed:             undefined as number | undefined,
} as const

export type AIConfig = typeof AI_CONFIG

/* ═══════════════════════════════════════════════════════════════════════════════
   STARTUP LOGGING — pretty console output (server-only)
   ═══════════════════════════════════════════════════════════════════════════════ */

if (isServer) {
  if (!hasApiKey) {
    console.warn('\n⚠️  \x1b[33m[Pulse AI]\x1b[0m No API key configured')
    console.warn('   Add \x1b[36mGROQ_API_KEY\x1b[0m to your \x1b[36m.env.local\x1b[0m')
    console.warn('   AI features will be disabled until configured.\n')
  } else {
    const info = MODELS[AI_CONFIG.model]
    console.log('\n✅ \x1b[32m[Pulse AI]\x1b[0m Ready')
    console.log(`   Model:       \x1b[36m${info?.displayName ?? AI_CONFIG.model}\x1b[0m`)
    console.log(`   Provider:    Groq (${AI_CONFIG.model})`)
    console.log(`   Context:     ${(info?.contextWindow ?? 0).toLocaleString()} tokens`)
    console.log(`   Temperature: ${AI_CONFIG.temperature}`)
    console.log(`   Streaming:   ${AI_CONFIG.stream ? 'enabled' : 'disabled'}\n`)
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   OPENAI CLIENT — with retry and timeout
   ═══════════════════════════════════════════════════════════════════════════════ */

export const openai = new OpenAI({
  apiKey:  ENV.apiKey || 'placeholder-key-not-configured',
  baseURL: BASE_URL,
  timeout: 60_000,       // 60s timeout
  maxRetries: 2,         // Auto-retry on transient errors
  defaultHeaders: {
    'X-Pulse-Client': 'pulse-ai-web',
  },
})

/* ═══════════════════════════════════════════════════════════════════════════════
   SYSTEM PROMPTS — multiple personalities + dynamic memory injection
   ═══════════════════════════════════════════════════════════════════════════════ */

export type PersonalityMode = 'default' | 'concise' | 'creative' | 'technical' | 'friendly'

const PERSONALITY_TRAITS: Record<PersonalityMode, string> = {
  default: `You are helpful, knowledgeable, and engaging. You balance depth with clarity.`,
  concise: `You give short, direct answers. No fluff, no unnecessary preamble. Get straight to the point.`,
  creative: `You are imaginative, playful, and creative. Use vivid language, analogies, and unexpected connections.`,
  technical: `You are a precise technical expert. Use accurate terminology, cite specifics, prefer code and examples.`,
  friendly: `You are warm, encouraging, and conversational. Use natural language and make the user feel supported.`,
}

const CURRENT_DATE = () => new Date().toISOString().split('T')[0]

/**
 * Build the full system prompt, optionally injecting memory context
 */
export function buildSystemPrompt(options: {
  personality?: PersonalityMode
  memoryContext?: string
  userName?: string
  customInstructions?: string
} = {}): string {
  const {
    personality = 'default',
    memoryContext,
    userName,
    customInstructions,
  } = options

  const identity = `You are Pulse, an intelligent AI assistant designed to help users think, create, and solve problems.

## Personality
${PERSONALITY_TRAITS[personality]}
${userName ? `\nThe user's name is **${userName}** — address them naturally when appropriate.\n` : ''}

## Core capabilities
- Coding across all major languages (with syntax-highlighted markdown blocks)
- Writing, editing, and analysis
- Reasoning through complex problems step-by-step
- Creative brainstorming and ideation
- Explaining concepts at any level of depth

## Response guidelines
- Use **markdown** for structure (headers, lists, code blocks)
- Always specify the language in code fences (\`\`\`typescript, \`\`\`python)
- Break long responses into digestible sections
- Ask clarifying questions when the request is ambiguous
- Admit uncertainty rather than fabricate — say "I'm not sure" when you don't know
- Provide examples for abstract concepts
- Match the user's technical level

## Boundaries
- Prioritize user privacy — never ask for or store sensitive info
- Decline harmful, deceptive, or unethical requests politely
- Be honest about being an AI when directly asked

## Context
- Current date: ${CURRENT_DATE()}
- Environment: Pulse AI web app`

  const memory = memoryContext
    ? `\n\n---\n\n${memoryContext}\n\n---\n\nUse the above information naturally — don't announce "I remember that…" unless the user explicitly asks what you know about them.`
    : ''

  const custom = customInstructions
    ? `\n\n## Custom instructions\n${customInstructions}`
    : ''

  return identity + memory + custom
}

/** Legacy export for backward compatibility */
export const SYSTEM_PROMPT = buildSystemPrompt()

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS — public API
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Check if AI is properly configured */
export function isAIConfigured(): boolean {
  return hasApiKey
}

/** Get provider info (for debug endpoints / status UIs) */
export function getAIProviderInfo() {
  const info = MODELS[AI_CONFIG.model]
  return {
    provider:         'Pulse AI',              // ← Always shown to users
    internalProvider: 'Groq',                  // ← Backend truth (dev debug only)
    model:            info?.displayName ?? AI_CONFIG.model,
    modelId:          AI_CONFIG.model,
    tier:             info?.tier,
    contextWindow:    info?.contextWindow,
    apiKeyConfigured: hasApiKey,
    baseURL:          BASE_URL,
    streaming:        AI_CONFIG.stream,
    temperature:      AI_CONFIG.temperature,
    maxTokens:        AI_CONFIG.maxTokens,
  }
}

/** Validate and normalize a model ID */
export function getValidModelName(modelName?: string): ModelId {
  const requested = modelName || AI_CONFIG.model
  if (requested in MODELS) return requested as ModelId

  console.warn(`⚠️  Model "${requested}" not recognized. Falling back to ${AI_CONFIG.model}`)
  return AI_CONFIG.model
}

/** Get full metadata for a model */
export function getModelInfo(modelId?: string): ModelInfo | null {
  const id = modelId || AI_CONFIG.model
  return MODELS[id] ?? null
}

/** Get user-facing display name for a model (never exposes "Groq") */
export function getModelDisplayName(modelId?: string): string {
  const info = getModelInfo(modelId)
  return info?.displayName ?? 'Pulse AI'
}

/** List all available models (for a model picker UI) */
export function getAvailableModels(filters?: {
  tier?: ModelTier
  supportsStreaming?: boolean
  supportsVision?: boolean
}): ModelInfo[] {
  let list = Object.values(MODELS)

  if (filters?.tier) {
    list = list.filter((m) => m.tier === filters.tier)
  }
  if (filters?.supportsStreaming !== undefined) {
    list = list.filter((m) => m.supportsStreaming === filters.supportsStreaming)
  }
  if (filters?.supportsVision !== undefined) {
    list = list.filter((m) => m.supportsVision === filters.supportsVision)
  }

  return list
}

/**
 * Smart model selection based on task type + context length
 * Automatically picks the best model for the job
 */
export function selectModelForTask(options: {
  taskType?: 'chat' | 'code' | 'reasoning' | 'creative' | 'long-context'
  estimatedTokens?: number
  preferSpeed?: boolean
}): ModelId {
  const { taskType = 'chat', estimatedTokens = 0, preferSpeed = false } = options

  // Long context → Scout
  if (estimatedTokens > 20_000) return 'llama-4-scout-17b-16e-instruct'

  // Speed priority → Instant
  if (preferSpeed) return 'llama-3.1-8b-instant'

  // Task-based routing
  switch (taskType) {
    case 'code':
    case 'reasoning':
      return 'llama-3.3-70b-versatile'

    case 'creative':
      return 'openai/gpt-oss-120b'

    case 'long-context':
      return 'llama-4-scout-17b-16e-instruct'

    case 'chat':
    default:
      return 'llama-3.1-8b-instant'
  }
}

/**
 * Estimate token count for a string (rough: ~4 chars per token)
 * Used for budget planning before API calls
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check if a message will fit within a model's context window
 */
export function willFitInContext(
  text: string,
  modelId?: string,
  reserveForResponse = 1000,
): boolean {
  const info = getModelInfo(modelId)
  if (!info) return false
  return estimateTokens(text) + reserveForResponse <= info.contextWindow
}

/**
 * Truncate text to fit in a model's context, preserving the end
 * (useful for keeping recent conversation intact)
 */
export function truncateToContext(
  text: string,
  modelId?: string,
  reserveForResponse = 1000,
): string {
  const info = getModelInfo(modelId)
  if (!info) return text

  const maxTokens = info.contextWindow - reserveForResponse
  const maxChars = maxTokens * 4

  if (text.length <= maxChars) return text
  return '…[truncated]…\n\n' + text.slice(-maxChars)
}

/**
 * Sanitize error messages for user display (hide provider internals)
 */
export function sanitizeAIError(error: unknown): string {
  if (!error) return 'Unknown error occurred'

  const msg = error instanceof Error ? error.message : String(error)

  // Map internal errors to friendly messages
  if (/rate.?limit|429/i.test(msg)) {
    return 'You are sending requests too fast. Please wait a moment and try again.'
  }
  if (/context.?length|too.?many.?tokens/i.test(msg)) {
    return 'This conversation is too long. Please start a new chat or summarize.'
  }
  if (/401|unauthorized|invalid.?api.?key/i.test(msg)) {
    return 'AI service authentication error. Please contact support.'
  }
  if (/timeout|network|fetch/i.test(msg)) {
    return 'Connection issue with AI service. Please try again.'
  }
  if (/503|502|500/i.test(msg)) {
    return 'AI service is temporarily unavailable. Please try again shortly.'
  }

  // Strip provider names from generic errors
  return msg
    .replace(/groq/gi,   'Pulse AI')
    .replace(/openai/gi, 'Pulse AI')
    .replace(/llama[-_]?[\d.]+[-_]?[a-z]*/gi, 'Pulse AI')
}

/* ═══════════════════════════════════════════════════════════════════════════════
   RATE LIMITING — client-side tracking to prevent quota exhaustion
   ═══════════════════════════════════════════════════════════════════════════════ */

class RateLimitTracker {
  private requests: number[] = []
  private tokens: { count: number; timestamp: number }[] = []

  recordRequest(tokenCount = 0): void {
    const now = Date.now()
    this.requests.push(now)
    if (tokenCount > 0) this.tokens.push({ count: tokenCount, timestamp: now })
    this.prune()
  }

  private prune(): void {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000
    this.requests = this.requests.filter((t) => t > dayAgo)
    this.tokens = this.tokens.filter((t) => t.timestamp > dayAgo)
  }

  getUsage(modelId?: string): {
    requestsToday: number
    tokensToday: number
    requestLimit: number
    tokenLimit: number
    requestUsagePercent: number
    tokenUsagePercent: number
    approachingLimit: boolean
  } {
    this.prune()
    const info = getModelInfo(modelId)
    const requestsToday = this.requests.length
    const tokensToday = this.tokens.reduce((sum, t) => sum + t.count, 0)
    const requestLimit = info?.rpd ?? 14_400
    const tokenLimit = info?.tpd ?? 500_000

    const requestUsagePercent = (requestsToday / requestLimit) * 100
    const tokenUsagePercent = (tokensToday / tokenLimit) * 100

    return {
      requestsToday,
      tokensToday,
      requestLimit,
      tokenLimit,
      requestUsagePercent,
      tokenUsagePercent,
      approachingLimit: requestUsagePercent > 80 || tokenUsagePercent > 80,
    }
  }

  reset(): void {
    this.requests = []
    this.tokens = []
  }
}

export const rateLimiter = new RateLimitTracker()

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPLETE EXPORT
   ═══════════════════════════════════════════════════════════════════════════════ */

export const AI = {
  client:        openai,
  config:        AI_CONFIG,
  models:        MODELS,
  isConfigured:  isAIConfigured,
  getInfo:       getAIProviderInfo,
  buildPrompt:   buildSystemPrompt,
  selectModel:   selectModelForTask,
  validateModel: getValidModelName,
  getModel:      getModelInfo,
  displayName:   getModelDisplayName,
  listModels:    getAvailableModels,
  estimate:      estimateTokens,
  willFit:       willFitInContext,
  truncate:      truncateToContext,
  sanitizeError: sanitizeAIError,
  rateLimiter,
} as const