/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/ai/tools.ts

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES — OpenAI-compatible tool/function calling format
   ═══════════════════════════════════════════════════════════════════════════════ */

export type ToolCategory =
  | 'math'
  | 'text'
  | 'time'
  | 'code'
  | 'web'
  | 'utility'
  | 'memory'
  | 'custom'

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required?: boolean
  enum?: string[]
  default?: unknown
  items?: { type: string }
}

export interface AITool<TInput = any, TOutput = any> {
  name: string
  description: string
  category?: ToolCategory
  icon?: string
  parameters?: {
    type: 'object'
    properties: Record<string, ToolParameter>
    required?: string[]
  }
  /** Structured execute — receives parsed args object */
  execute: (args: TInput, ctx?: ToolContext) => Promise<TOutput> | TOutput
  /** Optional: prevent execution based on user/session state */
  guard?: (ctx?: ToolContext) => boolean | Promise<boolean>
  /** How long results should be cached (ms). 0 = no cache */
  cacheTTL?: number
  /** Whether tool has side effects (e.g. sends email) */
  hasSideEffects?: boolean
}

export interface ToolContext {
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
  signal?: AbortSignal
}

export interface ToolResult<T = any> {
  success: boolean
  toolName: string
  data?: T
  error?: string
  durationMs?: number
  cached?: boolean
  timestamp: Date
}

export interface ToolExecutionRecord {
  id: string
  toolName: string
  args: any
  result: ToolResult
  timestamp: Date
  durationMs: number
  userId?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
   BUILT-IN TOOLS
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Calculator (safe math evaluator, no eval) ─────────────────────────── */
export const calculatorTool: AITool<{ expression: string }, string> = {
  name: 'calculator',
  description: 'Evaluate mathematical expressions safely. Supports +, -, *, /, %, parentheses, and common math functions (sqrt, pow, abs, round, floor, ceil, sin, cos, tan, log, exp, PI, E).',
  category: 'math',
  icon: '🧮',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Math expression, e.g. "2 * (5 + 3)" or "sqrt(144) + PI"',
      },
    },
    required: ['expression'],
  },
  cacheTTL: 60_000, // cache for 1 minute
  execute: async ({ expression }) => {
    if (!expression || typeof expression !== 'string') {
      throw new Error('Expression is required and must be a string')
    }

    // Whitelist: only allow safe tokens
    const allowed = /^[0-9+\-*/%().\s,a-zA-Z_]+$/
    if (!allowed.test(expression)) {
      throw new Error('Expression contains invalid characters')
    }

    // Whitelist function/constant names
    const allowedIdentifiers = new Set([
      'sqrt', 'pow', 'abs', 'round', 'floor', 'ceil',
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
      'log', 'log10', 'log2', 'exp', 'min', 'max',
      'PI', 'E',
    ])

    const identifiers = expression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? []
    for (const id of identifiers) {
      if (!allowedIdentifiers.has(id)) {
        throw new Error(`Unknown identifier: "${id}"`)
      }
    }

    // Build safe scope
    const scope: Record<string, any> = {
      sqrt: Math.sqrt, pow: Math.pow, abs: Math.abs,
      round: Math.round, floor: Math.floor, ceil: Math.ceil,
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      asin: Math.asin, acos: Math.acos, atan: Math.atan,
      log: Math.log, log10: Math.log10, log2: Math.log2,
      exp: Math.exp, min: Math.min, max: Math.max,
      PI: Math.PI, E: Math.E,
    }

    const fn = new Function(...Object.keys(scope), `"use strict"; return (${expression});`)
    const result = fn(...Object.values(scope))

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      throw new Error('Expression did not evaluate to a finite number')
    }

    return String(result)
  },
}

/* ─── Text processor ────────────────────────────────────────────────────── */
export const textProcessorTool: AITool<
  { action: 'word_count' | 'char_count' | 'summarize' | 'uppercase' | 'lowercase' | 'reverse' | 'slug' | 'word_frequency'; text: string; limit?: number },
  string
> = {
  name: 'text_processor',
  description: 'Process text with various operations: count words/chars, summarize, transform case, reverse, slugify, or extract word frequencies.',
  category: 'text',
  icon: '📝',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Operation to perform',
        enum: ['word_count', 'char_count', 'summarize', 'uppercase', 'lowercase', 'reverse', 'slug', 'word_frequency'],
      },
      text: { type: 'string', description: 'Input text' },
      limit: { type: 'number', description: 'Optional limit (for summary length, top N words, etc.)' },
    },
    required: ['action', 'text'],
  },
  execute: async ({ action, text, limit = 100 }) => {
    if (!text) throw new Error('No text provided')

    switch (action) {
      case 'word_count':
        return `${text.trim().split(/\s+/).filter(Boolean).length} words`

      case 'char_count':
        return `${text.length} characters (${[...text].filter((c) => c.trim()).length} non-whitespace)`

      case 'summarize': {
        const cleaned = text.replace(/\s+/g, ' ').trim()
        return cleaned.length > limit ? cleaned.slice(0, limit).trim() + '…' : cleaned
      }

      case 'uppercase':
        return text.toUpperCase()

      case 'lowercase':
        return text.toLowerCase()

      case 'reverse':
        return [...text].reverse().join('')

      case 'slug':
        return text.toLowerCase().trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')

      case 'word_frequency': {
        const words = text.toLowerCase().match(/\b[\w']+\b/g) ?? []
        const freq: Record<string, number> = {}
        words.forEach((w) => { freq[w] = (freq[w] || 0) + 1 })
        const sorted = Object.entries(freq)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([word, count]) => `${word}: ${count}`)
          .join('\n')
        return sorted || 'No words found'
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  },
}

/* ─── Date/Time tool ────────────────────────────────────────────────────── */
export const dateTimeTool: AITool<
  { action: 'now' | 'iso' | 'timezone' | 'diff' | 'add' | 'format'; timezone?: string; date?: string; date2?: string; amount?: number; unit?: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'y'; format?: 'short' | 'long' | 'iso' | 'relative' },
  string
> = {
  name: 'date_time',
  description: 'Work with dates and times: get current time, convert timezones, calculate differences, add/subtract time, format dates.',
  category: 'time',
  icon: '🕐',
  parameters: {
    type: 'object',
    properties: {
      action:   { type: 'string', description: 'Operation', enum: ['now', 'iso', 'timezone', 'diff', 'add', 'format'] },
      timezone: { type: 'string', description: 'IANA timezone (e.g. "America/New_York")' },
      date:     { type: 'string', description: 'ISO date string' },
      date2:    { type: 'string', description: 'Second ISO date (for diff)' },
      amount:   { type: 'number', description: 'Amount to add/subtract' },
      unit:     { type: 'string', description: 'Time unit', enum: ['ms', 's', 'min', 'h', 'd', 'w', 'y'] },
      format:   { type: 'string', description: 'Format style', enum: ['short', 'long', 'iso', 'relative'] },
    },
    required: ['action'],
  },
  cacheTTL: 0, // never cache — time-sensitive
  execute: async ({ action, timezone, date, date2, amount = 0, unit = 'd', format = 'long' }) => {
    const now = date ? new Date(date) : new Date()
    if (isNaN(now.getTime())) throw new Error('Invalid date')

    switch (action) {
      case 'now':
        return now.toLocaleString('en-US', timezone ? { timeZone: timezone } : {})

      case 'iso':
        return now.toISOString()

      case 'timezone': {
        if (!timezone) throw new Error('Timezone required')
        return `Time in ${timezone}: ${now.toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'long' })}`
      }

      case 'diff': {
        if (!date2) throw new Error('Second date required for diff')
        const d2 = new Date(date2)
        const diffMs = Math.abs(d2.getTime() - now.getTime())
        const days = Math.floor(diffMs / 86_400_000)
        const hours = Math.floor((diffMs % 86_400_000) / 3_600_000)
        const mins = Math.floor((diffMs % 3_600_000) / 60_000)
        return `${days}d ${hours}h ${mins}m (${diffMs.toLocaleString()} ms)`
      }

      case 'add': {
        const multipliers: Record<string, number> = {
          ms: 1, s: 1000, min: 60_000, h: 3_600_000,
          d: 86_400_000, w: 604_800_000, y: 31_536_000_000,
        }
        const result = new Date(now.getTime() + amount * multipliers[unit])
        return result.toISOString()
      }

      case 'format': {
        if (format === 'iso') return now.toISOString()
        if (format === 'relative') {
          const diff = (Date.now() - now.getTime()) / 1000
          const abs = Math.abs(diff)
          const dir = diff > 0 ? 'ago' : 'from now'
          if (abs < 60)     return `${Math.floor(abs)}s ${dir}`
          if (abs < 3600)   return `${Math.floor(abs / 60)}m ${dir}`
          if (abs < 86400)  return `${Math.floor(abs / 3600)}h ${dir}`
          return `${Math.floor(abs / 86400)}d ${dir}`
        }
        return format === 'short'
          ? now.toLocaleDateString()
          : now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  },
}

/* ─── Code formatter ────────────────────────────────────────────────────── */
export const codeFormatterTool: AITool<{ language: string; code: string }, string> = {
  name: 'code_formatter',
  description: 'Format code as a markdown code block with syntax highlighting.',
  category: 'code',
  icon: '💻',
  parameters: {
    type: 'object',
    properties: {
      language: { type: 'string', description: 'Language identifier (typescript, python, rust, etc.)' },
      code:     { type: 'string', description: 'Code to format' },
    },
    required: ['language', 'code'],
  },
  execute: async ({ language, code }) => {
    if (!code) throw new Error('No code provided')
    return `\`\`\`${language || 'text'}\n${code}\n\`\`\``
  },
}

/* ─── JSON utility ──────────────────────────────────────────────────────── */
export const jsonTool: AITool<
  { action: 'parse' | 'stringify' | 'validate' | 'minify' | 'pretty'; input: string; indent?: number },
  string
> = {
  name: 'json',
  description: 'Parse, validate, minify, or prettify JSON data.',
  category: 'utility',
  icon: '{ }',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', description: 'Operation', enum: ['parse', 'stringify', 'validate', 'minify', 'pretty'] },
      input:  { type: 'string', description: 'JSON string or value' },
      indent: { type: 'number', description: 'Indentation spaces (default 2)' },
    },
    required: ['action', 'input'],
  },
  execute: async ({ action, input, indent = 2 }) => {
    switch (action) {
      case 'parse':
      case 'validate': {
        try {
          const parsed = JSON.parse(input)
          return action === 'validate'
            ? '✅ Valid JSON'
            : JSON.stringify(parsed, null, indent)
        } catch (e) {
          throw new Error(`Invalid JSON: ${(e as Error).message}`)
        }
      }
      case 'minify':
        return JSON.stringify(JSON.parse(input))

      case 'pretty':
        return JSON.stringify(JSON.parse(input), null, indent)

      case 'stringify':
        return JSON.stringify(input, null, indent)

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  },
}

/* ─── URL utility ───────────────────────────────────────────────────────── */
export const urlTool: AITool<
  { action: 'encode' | 'decode' | 'parse'; input: string },
  string
> = {
  name: 'url',
  description: 'Encode/decode URIs or parse URL components.',
  category: 'utility',
  icon: '🔗',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', description: 'Operation', enum: ['encode', 'decode', 'parse'] },
      input:  { type: 'string', description: 'URL or string' },
    },
    required: ['action', 'input'],
  },
  execute: async ({ action, input }) => {
    switch (action) {
      case 'encode': return encodeURIComponent(input)
      case 'decode': return decodeURIComponent(input)
      case 'parse': {
        try {
          const url = new URL(input)
          return JSON.stringify({
            protocol: url.protocol,
            host: url.host,
            pathname: url.pathname,
            search: url.search,
            searchParams: Object.fromEntries(url.searchParams),
            hash: url.hash,
          }, null, 2)
        } catch {
          throw new Error('Invalid URL')
        }
      }
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  },
}

/* ─── Random / UUID generator ───────────────────────────────────────────── */
export const randomTool: AITool<
  { action: 'uuid' | 'number' | 'string' | 'pick'; min?: number; max?: number; length?: number; choices?: string[] },
  string
> = {
  name: 'random',
  description: 'Generate random UUIDs, numbers, strings, or pick from choices.',
  category: 'utility',
  icon: '🎲',
  parameters: {
    type: 'object',
    properties: {
      action:  { type: 'string', description: 'What to generate', enum: ['uuid', 'number', 'string', 'pick'] },
      min:     { type: 'number', description: 'Min value (for number)' },
      max:     { type: 'number', description: 'Max value (for number)' },
      length:  { type: 'number', description: 'String length' },
      choices: { type: 'array', description: 'Options to pick from', items: { type: 'string' } },
    },
    required: ['action'],
  },
  cacheTTL: 0,
  execute: async ({ action, min = 0, max = 100, length = 16, choices }) => {
    switch (action) {
      case 'uuid':
        return typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`

      case 'number':
        return String(Math.floor(Math.random() * (max - min + 1)) + min)

      case 'string': {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      }

      case 'pick': {
        if (!choices?.length) throw new Error('Choices required')
        return choices[Math.floor(Math.random() * choices.length)]
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  },
}

/* ─── Web search (placeholder — swap for real API) ─────────────────────── */
export const webSearchTool: AITool<{ query: string; limit?: number }, string> = {
  name: 'web_search',
  description: 'Search the web for current information (requires API integration).',
  category: 'web',
  icon: '🔍',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', description: 'Max results (default 5)' },
    },
    required: ['query'],
  },
  hasSideEffects: false,
  execute: async ({ query, limit = 5 }, ctx) => {
    // Placeholder — integrate SerpAPI, Brave Search, Tavily, etc.
    // Example:
    // const res = await fetch(`https://api.tavily.com/search?q=${query}&count=${limit}`, {
    //   headers: { Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
    //   signal: ctx?.signal,
    // })
    return `Web search is not configured. To enable, add TAVILY_API_KEY (or similar) and update webSearchTool.execute.`
  },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TOOL MANAGER — orchestration with caching, guards, hooks
   ═══════════════════════════════════════════════════════════════════════════════ */

interface CacheEntry {
  value: any
  expiresAt: number
}

export type ToolHookEvent =
  | { type: 'before'; toolName: string; args: any }
  | { type: 'after'; toolName: string; result: ToolResult }
  | { type: 'error'; toolName: string; error: Error }

export class ToolManager {
  private tools: Map<string, AITool> = new Map()
  private history: ToolExecutionRecord[] = []
  private cache: Map<string, CacheEntry> = new Map()
  private hooks: Set<(event: ToolHookEvent) => void> = new Set()
  private maxHistorySize: number

  constructor(options: { maxHistorySize?: number } = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 100

    // Register built-in tools
    this.register(calculatorTool)
    this.register(textProcessorTool)
    this.register(dateTimeTool)
    this.register(codeFormatterTool)
    this.register(jsonTool)
    this.register(urlTool)
    this.register(randomTool)
    this.register(webSearchTool)
  }

  /* ─── Registration ─────────────────────────────────────────────────── */
  register(tool: AITool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[Tools] Overwriting existing tool: ${tool.name}`)
    }
    this.tools.set(tool.name, tool)
  }

  unregister(name: string): boolean {
    return this.tools.delete(name)
  }

  /* ─── Introspection ────────────────────────────────────────────────── */
  get(name: string): AITool | undefined {
    return this.tools.get(name)
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }

  list(category?: ToolCategory): AITool[] {
    const all = Array.from(this.tools.values())
    return category ? all.filter((t) => t.category === category) : all
  }

  /* ─── Execution ────────────────────────────────────────────────────── */
  async execute<T = any>(
    name: string,
    args: any,
    ctx?: ToolContext
  ): Promise<ToolResult<T>> {
    const start = performance.now()
    const timestamp = new Date()

    const tool = this.tools.get(name)
    if (!tool) {
      const result: ToolResult = {
        success: false,
        toolName: name,
        error: `Tool '${name}' not found`,
        timestamp,
      }
      this.emit({ type: 'error', toolName: name, error: new Error(result.error!) })
      return result
    }

    // Guard check
    if (tool.guard) {
      const allowed = await tool.guard(ctx)
      if (!allowed) {
        return {
          success: false,
          toolName: name,
          error: 'Tool execution not permitted in this context',
          timestamp,
        }
      }
    }

    // Cache lookup
    const cacheKey = this.buildCacheKey(name, args)
    if (tool.cacheTTL && tool.cacheTTL > 0) {
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return {
          success: true,
          toolName: name,
          data: cached.value,
          cached: true,
          durationMs: 0,
          timestamp,
        }
      }
    }

    // Execute
    this.emit({ type: 'before', toolName: name, args })

    try {
      const data = await tool.execute(args, ctx)
      const durationMs = performance.now() - start

      const result: ToolResult<T> = {
        success: true,
        toolName: name,
        data,
        durationMs,
        cached: false,
        timestamp,
      }

      // Store in cache
      if (tool.cacheTTL && tool.cacheTTL > 0) {
        this.cache.set(cacheKey, {
          value: data,
          expiresAt: Date.now() + tool.cacheTTL,
        })
      }

      // Record history
      this.recordHistory({
        id: this.generateId(),
        toolName: name,
        args,
        result,
        timestamp,
        durationMs,
        userId: ctx?.userId,
      })

      this.emit({ type: 'after', toolName: name, result })
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      const durationMs = performance.now() - start

      const result: ToolResult<T> = {
        success: false,
        toolName: name,
        error: errorObj.message,
        durationMs,
        timestamp,
      }

      this.recordHistory({
        id: this.generateId(),
        toolName: name,
        args,
        result,
        timestamp,
        durationMs,
        userId: ctx?.userId,
      })

      this.emit({ type: 'error', toolName: name, error: errorObj })
      return result
    }
  }

  /* ─── Batch execution ──────────────────────────────────────────────── */
  async executeMany(
    calls: Array<{ name: string; args: any }>,
    ctx?: ToolContext
  ): Promise<ToolResult[]> {
    return Promise.all(calls.map((c) => this.execute(c.name, c.args, ctx)))
  }

  /* ─── Hooks / observability ────────────────────────────────────────── */
  onEvent(handler: (event: ToolHookEvent) => void): () => void {
    this.hooks.add(handler)
    return () => this.hooks.delete(handler)
  }

  private emit(event: ToolHookEvent): void {
    this.hooks.forEach((h) => {
      try { h(event) } catch (e) { console.error('[Tools] Hook error:', e) }
    })
  }

  /* ─── AI Integration — get tools in OpenAI format ─────────────────── */
  toOpenAIFunctions(): Array<{
    type: 'function'
    function: { name: string; description: string; parameters: any }
  }> {
    return this.list().map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters ?? { type: 'object', properties: {} },
      },
    }))
  }

  /** For system prompts */
  toPromptDescription(): string {
    return this.list()
      .map((tool) => {
        const params = tool.parameters?.properties
          ? Object.entries(tool.parameters.properties)
              .map(([k, v]) => {
                const req = tool.parameters?.required?.includes(k) ? ' *required*' : ''
                const enums = v.enum ? ` (one of: ${v.enum.join(', ')})` : ''
                return `    • ${k}${req}: ${v.description}${enums}`
              })
              .join('\n')
          : ''
        return `${tool.icon ?? '🔧'} **${tool.name}** [${tool.category ?? 'general'}]\n   ${tool.description}${params ? `\n   Parameters:\n${params}` : ''}`
      })
      .join('\n\n')
  }

  /* ─── History & stats ──────────────────────────────────────────────── */
  private recordHistory(record: ToolExecutionRecord): void {
    this.history.push(record)
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize)
    }
  }

  getHistory(limit = 10): ToolExecutionRecord[] {
    return this.history.slice(-limit).reverse()
  }

  clearHistory(): void {
    this.history = []
  }

  getStats(): {
    totalExecutions: number
    successRate: number
    avgDurationMs: number
    toolUsage: Record<string, number>
    cacheHits: number
    errors: number
  } {
    const total = this.history.length
    const successes = this.history.filter((r) => r.result.success).length
    const errors = total - successes
    const cacheHits = this.history.filter((r) => r.result.cached).length
    const avgDuration = total > 0
      ? this.history.reduce((sum, r) => sum + r.durationMs, 0) / total
      : 0
    const toolUsage: Record<string, number> = {}
    for (const r of this.history) {
      toolUsage[r.toolName] = (toolUsage[r.toolName] || 0) + 1
    }

    return {
      totalExecutions: total,
      successRate: total > 0 ? successes / total : 0,
      avgDurationMs: avgDuration,
      toolUsage,
      cacheHits,
      errors,
    }
  }

  /* ─── Cache management ─────────────────────────────────────────────── */
  clearCache(): void {
    this.cache.clear()
  }

  pruneCache(): number {
    const now = Date.now()
    let removed = 0
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
        removed++
      }
    })
    return removed
  }

  /* ─── Private helpers ──────────────────────────────────────────────── */
  private buildCacheKey(name: string, args: any): string {
    return `${name}:${JSON.stringify(args)}`
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SINGLETON
   ═══════════════════════════════════════════════════════════════════════════════ */

export const toolManager = new ToolManager()

// Auto-prune cache every 5 minutes (client-side)
if (typeof window !== 'undefined') {
  setInterval(() => toolManager.pruneCache(), 5 * 60 * 1000)
}