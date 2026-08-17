/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/ai/setup.ts

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
  availableModels?: string[]
  latencyMs?: number
}

export interface ConfigStatus {
  ready: boolean
  provider: string        // User-facing (always "Pulse AI")
  internalProvider: string // Dev only
  model: string
  displayModel: string
  hasApiKey: boolean
  hasOpenAIFallback: boolean
  environment: 'development' | 'production' | 'test'
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ENV HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */

const ENV = {
  apiKey:     () => process.env.GROQ_API_KEY,
  model:      () => process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  openaiKey:  () => process.env.OPENAI_API_KEY,
  baseUrl:    () => process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  environment: () => (process.env.NODE_ENV as ConfigStatus['environment']) || 'development',
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MODEL DISPLAY MAPPING — never leak internal names to users
   ═══════════════════════════════════════════════════════════════════════════════ */

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'llama-3.1-8b-instant':          'Pulse Instant',
  'llama-3.3-70b-versatile':       'Pulse Pro',
  'llama-4-scout-17b-16e-instruct': 'Pulse Scout',
  'openai/gpt-oss-120b':            'Pulse Ultra',
  'whisper-large-v3-turbo':         'Pulse Voice',
}

function getDisplayName(modelId: string): string {
  return MODEL_DISPLAY_NAMES[modelId] ?? 'Pulse AI'
}

/* ═══════════════════════════════════════════════════════════════════════════════
   VALIDATION — comprehensive with warnings + performance check
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Validate AI configuration and test upstream API connectivity.
 * Returns detailed diagnostics for debugging + status pages.
 */
export async function validateAIConfiguration(options: {
  timeoutMs?: number
  skipRemoteCheck?: boolean
} = {}): Promise<ValidationResult> {
  const { timeoutMs = 5000, skipRemoteCheck = false } = options
  const errors: string[] = []
  const warnings: string[] = []
  const info: string[] = []

  const apiKey = ENV.apiKey()
  const model = ENV.model()
  const baseUrl = ENV.baseUrl()

  // ─── Required: API key ─────────────────────────────────────────────
  if (!apiKey) {
    errors.push('AI service API key is missing. Set GROQ_API_KEY in .env.local')
    return { isValid: false, errors, warnings, info }
  }

  // Basic API key format sanity check
  if (apiKey.length < 20) {
    warnings.push('API key looks unusually short — verify it is correct')
  }

  info.push(`Configured model: ${getDisplayName(model)} (${model})`)

  // ─── Optional: OpenAI fallback ─────────────────────────────────────
  if (ENV.openaiKey()) {
    info.push('OpenAI fallback key detected (currently unused)')
  }

  // Skip remote check if requested (for offline/local dev)
  if (skipRemoteCheck) {
    return { isValid: errors.length === 0, errors, warnings, info }
  }

  // ─── Remote connectivity test ──────────────────────────────────────
  const start = performance.now()
  let latencyMs = 0

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Pulse-Client': 'pulse-ai-setup',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)

    latencyMs = Math.round(performance.now() - start)

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      if (response.status === 401) {
        errors.push('AI service authentication failed — verify your API key')
      } else if (response.status === 429) {
        warnings.push('AI service rate limit hit during validation — key may still work')
      } else if (response.status >= 500) {
        warnings.push(`AI service temporarily unavailable (${response.status}) — will retry on first request`)
      } else {
        errors.push(`AI service returned ${response.status}: ${text.slice(0, 200)}`)
      }
      return { isValid: errors.length === 0, errors, warnings, info, latencyMs }
    }

    const data = await response.json()
    const availableModels: string[] = data.data?.map((m: any) => m.id) ?? []

    info.push(`✅ Connected in ${latencyMs}ms`)
    info.push(`${availableModels.length} models available`)

    // Latency warnings
    if (latencyMs > 2000) {
      warnings.push(`High API latency detected (${latencyMs}ms)`)
    }

    // Model availability check
    if (!availableModels.includes(model)) {
      errors.push(
        `Configured model "${model}" is not available. ` +
        `Available: ${availableModels.slice(0, 5).join(', ')}${availableModels.length > 5 ? '…' : ''}`
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      availableModels,
      latencyMs,
    }
  } catch (error) {
    const err = error as Error
    if (err.name === 'AbortError') {
      errors.push(`AI service connectivity check timed out after ${timeoutMs}ms`)
    } else if (/fetch|network/i.test(err.message)) {
      errors.push('Cannot reach AI service — check network connectivity')
    } else {
      errors.push(`Validation failed: ${err.message}`)
    }
    return { isValid: false, errors, warnings, info, latencyMs }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STATUS QUERIES
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Get current AI configuration snapshot.
 * Safe to expose via public API endpoints (uses branded names).
 */
export function getAIConfigStatus(): ConfigStatus {
  const apiKey = ENV.apiKey()
  const model = ENV.model()

  return {
    ready: !!apiKey,
    provider: 'Pulse AI',           // ← public-safe
    internalProvider: 'Groq',        // ← for dev/debug only
    model,
    displayModel: getDisplayName(model),
    hasApiKey: !!apiKey,
    hasOpenAIFallback: !!ENV.openaiKey(),
    environment: ENV.environment(),
  }
}

/**
 * Quick readiness check — synchronous.
 */
export function isAIReady(): boolean {
  return !!ENV.apiKey()
}

/**
 * Get sanitized status for public endpoints (strips internal details).
 */
export function getPublicStatus(): {
  status: 'ready' | 'unconfigured' | 'error'
  provider: string
  model: string
} {
  const status = getAIConfigStatus()
  return {
    status: status.ready ? 'ready' : 'unconfigured',
    provider: status.provider,
    model: status.displayModel,
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STARTUP RUNNER — call this in server bootstrap for pretty logs
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Run a full startup check with colored console output.
 * Ideal for `instrumentation.ts` or server-side init.
 */
export async function runStartupCheck(options: {
  skipRemoteCheck?: boolean
  logResult?: boolean
} = {}): Promise<ValidationResult> {
  const { skipRemoteCheck = false, logResult = true } = options
  const result = await validateAIConfiguration({ skipRemoteCheck })

  if (!logResult) return result

  const c = {
    green:  '\x1b[32m',
    red:    '\x1b[31m',
    yellow: '\x1b[33m',
    cyan:   '\x1b[36m',
    gray:   '\x1b[90m',
    bold:   '\x1b[1m',
    reset:  '\x1b[0m',
  }

  console.log(`\n${c.bold}${c.cyan}━━━ Pulse AI Startup Check ━━━${c.reset}`)

  if (result.info.length > 0) {
    result.info.forEach((line) => console.log(`  ${c.gray}ℹ${c.reset}  ${line}`))
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach((line) => console.log(`  ${c.yellow}⚠${c.reset}  ${line}`))
  }

  if (result.errors.length > 0) {
    result.errors.forEach((line) => console.log(`  ${c.red}✗${c.reset}  ${line}`))
  }

  const status = result.isValid
    ? `${c.green}✓ READY${c.reset}`
    : `${c.red}✗ CONFIGURATION ERRORS${c.reset}`

  console.log(`\n  Status: ${status}\n`)

  return result
}