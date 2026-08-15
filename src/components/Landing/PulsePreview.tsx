/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Landing/PulsePreview.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { PulseRobot } from '@/components/Pulse/PulseRobot'

// ─── Types ───────────────────────────────────────────────────────────────────────
type MessageRole = 'user' | 'assistant'
type AssistantState = 'idle' | 'thinking' | 'typing' | 'listening'

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  tokens?: number
  model?: string
  codeBlock?: { lang: string; code: string }
}

interface ScenarioMessage {
  role: MessageRole
  content: string
  tokens?: number
  model?: string
  codeBlock?: { lang: string; code: string }
}

interface Scenario {
  id: string
  label: string
  icon: React.ReactNode
  tag: string
  color: string
  accentRgb: string
  messages: ScenarioMessage[]
}

// ─── Icons ───────────────────────────────────────────────────────────────────────
const Icons = {
  Send: () => (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Code: () => (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Brain: () => (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04" />
    </svg>
  ),
  Write: () => (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Search: () => (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Mic: () => (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    >
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  Copy: () => (
    <svg
      width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg
      width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Refresh: () => (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  Zap: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
}

// ─── Scenario Data ────────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  {
    id: 'code',
    label: 'code_gen',
    icon: <Icons.Code />,
    tag: 'TypeScript',
    color: '#22d3ee',
    accentRgb: '34,211,238',
    messages: [
      {
        role: 'user',
        content: 'Write a custom React hook for debounced search with TypeScript',
        tokens: 18,
      },
      {
        role: 'assistant',
        content: "Here's a production-ready debounced search hook:",
        tokens: 142,
        model: 'GPT-4o',
        codeBlock: {
          lang: 'typescript',
          code: `import { useState, useEffect } from 'react'

interface UseDebounceSearchOptions {
  delay?: number
  minLength?: number
}

export function useDebounceSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  options: UseDebounceSearchOptions = {}
) {
  const { delay = 300, minLength = 2 } = options
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (query.length < minLength) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchFn(query)
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'))
      } finally {
        setLoading(false)
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [query, delay, minLength, searchFn])

  return { query, setQuery, results, loading, error }
}`,
        },
      },
      {
        role: 'user',
        content: 'Add abort controller support to cancel in-flight requests',
        tokens: 14,
      },
      {
        role: 'assistant',
        content: "Great idea — here's the updated version with request cancellation:",
        tokens: 98,
        model: 'GPT-4o',
        codeBlock: {
          lang: 'typescript',
          code: `useEffect(() => {
  if (query.length < minLength) return
  const controller = new AbortController()
  const timer = setTimeout(async () => {
    setLoading(true)
    try {
      const data = await searchFn(query, controller.signal)
      setResults(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err : new Error('Search failed'))
    } finally {
      setLoading(false)
    }
  }, delay)
  return () => {
    clearTimeout(timer)
    controller.abort()
  }
}, [query, delay, minLength, searchFn])`,
        },
      },
    ],
  },
  {
    id: 'reason',
    label: 'reasoning',
    icon: <Icons.Brain />,
    tag: 'Analysis',
    color: '#a78bfa',
    accentRgb: '167,139,250',
    messages: [
      {
        role: 'user',
        content:
          'Should I use a monorepo or separate repos for a SaaS product with a web app, mobile app, and shared API?',
        tokens: 28,
      },
      {
        role: 'assistant',
        content: `**Recommendation: Monorepo with Turborepo or Nx**

Here's my reasoning broken down:

**For a SaaS with shared infrastructure, monorepos win because:**

① **Shared types & validation** — Your API contracts, Zod schemas, and TypeScript types live once and are consumed by web, mobile, and backend without duplication or version drift.

② **Atomic commits** — A breaking API change and its client fixes ship together. No "waiting for package publish" cycles.

③ **Unified CI/CD** — Affected-only builds mean your pipeline only rebuilds what changed. Turborepo's remote caching makes this fast.

**When separate repos make sense:**
- Teams are completely siloed with no shared code
- Different deployment cadences that cause constant merge conflicts
- Security requirements mandate strict separation

**My specific setup recommendation:**
\`\`\`
apps/web     → Next.js
apps/mobile  → Expo
apps/api     → Node/Fastify
packages/ui  → Shared components
packages/db  → Prisma schema + client
packages/types → Shared TypeScript types
\`\`\`

Start monorepo. You can always split later — the reverse is painful.`,
        tokens: 287,
        model: 'GPT-4o',
      },
    ],
  },
  {
    id: 'write',
    label: 'content',
    icon: <Icons.Write />,
    tag: 'Copywriting',
    color: '#f472b6',
    accentRgb: '244,114,182',
    messages: [
      {
        role: 'user',
        content:
          'Write a product launch email for an AI coding assistant. Make it punchy, developer-focused, no fluff.',
        tokens: 22,
      },
      {
        role: 'assistant',
        content: `**Subject:** Your codebase just got a second brain

Hey {first_name},

You've spent enough time on Stack Overflow at 2am.

**Introducing CodePulse** — an AI pair programmer that:
- Reviews your PRs before your teammates do
- Catches bugs before they hit production
- Explains legacy code in plain English
- Generates tests for the functions you keep skipping

It's already inside your editor. No new tab. No context switching.

**Try it free for 14 days →**

No credit card. No onboarding call. Just ship faster.

— The CodePulse team

P.S. Our users average 40% fewer production incidents in the first month. Just saying. 🚀`,
        tokens: 134,
        model: 'GPT-4o',
      },
      {
        role: 'user',
        content: 'Give me 3 alternative subject lines, A/B test ready',
        tokens: 13,
      },
      {
        role: 'assistant',
        content: `**3 subject lines ranked by predicted open rate:**

**① High curiosity (recommended)**
> "We reviewed 1,000 PRs so you don't have to"

**② Pain-point hook**
> "Your 2am Stack Overflow habit ends here"

**③ Social proof**
> "40% fewer bugs. 10,000 devs switched this week."

**Tip:** Test ① vs ③ first — curiosity vs. proof-point is the highest-signal split for dev audiences. Run for 4h minimum with 20% of list.`,
        tokens: 89,
        model: 'GPT-4o',
      },
    ],
  },
  {
    id: 'research',
    label: 'research',
    icon: <Icons.Search />,
    tag: 'Analysis',
    color: '#34d399',
    accentRgb: '52,211,153',
    messages: [
      {
        role: 'user',
        content:
          'Compare LLM inference costs for GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro for a high-volume production app',
        tokens: 31,
      },
      {
        role: 'assistant',
        content: `**LLM Cost Comparison — Production Scale**

| Model | Input | Output | Context |
|---|---|---|---|
| GPT-4o | $2.50/1M | $10.00/1M | 128k |
| Claude 3.5 Sonnet | $3.00/1M | $15.00/1M | 200k |
| Gemini 1.5 Pro | $1.25/1M | $5.00/1M | 1M |

**At 10M input tokens/month:**
- Gemini 1.5 Pro → **$12,500**
- GPT-4o → **$25,000**
- Claude 3.5 Sonnet → **$30,000**

**My recommendation depends on your use case:**

🟢 **Cost-sensitive + long context** → Gemini 1.5 Pro (2x cheaper, 1M context is unmatched)

🔵 **Quality-critical + ecosystem** → GPT-4o (best function calling, widest tooling support)

🟣 **Complex reasoning + long output** → Claude 3.5 Sonnet (best for nuanced multi-step tasks)

**Hybrid approach:** Use Gemini for retrieval/classification (high volume, cheaper), GPT-4o for generation (lower volume, higher quality). Can cut costs by 60-70%.`,
        tokens: 312,
        model: 'GPT-4o',
      },
    ],
  },
]

// ─── Code Block ───────────────────────────────────────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }, [code])

  const lines = code.split('\n')

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.07] bg-[#060609]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['bg-red-500/40', 'bg-amber-500/40', 'bg-emerald-500/40'].map((c, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${c}`} />
            ))}
          </div>
          <span className="text-[10px] font-mono text-white/20 ml-2">{lang}</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/30 hover:text-white/60 hover:bg-white/[0.07] transition-all duration-200 text-[10px] font-mono"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-emerald-400"
              >
                <Icons.Check />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Icons.Copy />
              </motion.span>
            )}
          </AnimatePresence>
          {copied ? 'copied' : 'copy'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="p-4 flex gap-4 min-w-0">
          <div className="flex flex-col items-end flex-shrink-0 select-none">
            {lines.map((_, i) => (
              <span key={i} className="text-[10px] font-mono text-white/10 leading-[1.7]">
                {String(i + 1).padStart(2, '0')}
              </span>
            ))}
          </div>
          <pre className="flex-1 text-[11px] font-mono text-white/60 leading-[1.7] overflow-x-auto whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────────
function renderContent(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white/90 font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ─── Message Bubble ───────────────────────────────────────────────────────────────
function MessageBubble({
  message,
  accentColor,
  accentRgb,
  index,
}: {
  message: Message
  accentColor: string
  accentRgb: string
  index: number
}) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        ease: [0.23, 1, 0.32, 1],
        delay: index * 0.04,
      }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center border"
            style={{
              background: `linear-gradient(135deg, rgba(${accentRgb},0.15), rgba(${accentRgb},0.05))`,
              borderColor: `rgba(${accentRgb},0.2)`,
            }}
          >
            <div className="scale-[0.6]">
              <PulseRobot size="sm" />
            </div>
          </div>
        </div>
      )}

      <div
        className={`flex flex-col gap-1 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}
      >
        <span className="text-[9px] font-mono text-white/20 px-1">
          {isUser
            ? 'you'
            : `pulse_ai${message.model ? ` · ${message.model}` : ''}`}
        </span>

        <div
          className={`relative px-4 py-3 rounded-2xl text-xs leading-relaxed ${
            isUser ? 'rounded-tr-sm font-mono' : 'rounded-tl-sm'
          }`}
          style={
            isUser
              ? {
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.18), rgba(${accentRgb},0.08))`,
                  border: `1px solid rgba(${accentRgb},0.2)`,
                  color: 'rgba(255,255,255,0.8)',
                }
              : {
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.6)',
                }
          }
        >
          {!isUser && (
            <div
              className="absolute top-0 left-0 bottom-0 w-0.5 rounded-full"
              style={{ background: `rgba(${accentRgb},0.4)` }}
            />
          )}

          <div className={!isUser ? 'pl-2' : ''}>
            <p className="whitespace-pre-wrap">{renderContent(message.content)}</p>
            {message.codeBlock && (
              <CodeBlock
                lang={message.codeBlock.lang}
                code={message.codeBlock.code}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          {!isUser && message.tokens && (
            <>
              <span style={{ color: `rgba(${accentRgb},0.5)` }}>
                <Icons.Zap />
              </span>
              <span className="text-[9px] font-mono text-white/15">
                {message.tokens} tokens
              </span>
            </>
          )}
          <span className="text-[9px] font-mono text-white/10">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Typing Indicator - STABILIZED ─────────────────────────────────────────────────
function TypingIndicator({
  state,
  accentRgb,
}: {
  state: AssistantState
  accentRgb: string
}) {
  const labels: Record<AssistantState, string> = {
    idle: 'idle',
    thinking: 'reasoning...',
    typing: 'generating...',
    listening: 'listening...',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3"
    >
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center border flex-shrink-0"
        style={{
          background: `rgba(${accentRgb},0.1)`,
          borderColor: `rgba(${accentRgb},0.2)`,
        }}
      >
        <div className="scale-[0.6]">
          <PulseRobot size="sm" />
        </div>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl rounded-tl-sm border"
        style={{
          background: 'rgba(255,255,255,0.025)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        {/* Stabilized animated bars */}
        <div 
          className="flex items-center gap-[3px] h-4 min-w-[16px]"
          style={{ willChange: 'transform' }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                scaleY: [0.3, 0.9, 0.3],
              }}
              transition={{
                duration: 0.5 + (i * 0.05),
                repeat: Infinity,
                delay: i * 0.08,
                ease: "easeInOut",
              }}
              className="w-[2px] rounded-full origin-bottom"
              style={{
                height: '100%',
                background: `rgba(${accentRgb},0.6)`,
                willChange: 'transform',
              }}
            />
          ))}
        </div>
        <span
          className="text-[10px] font-mono"
          style={{ color: `rgba(${accentRgb},0.6)` }}
        >
          {labels[state]}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Scenario Tab ─────────────────────────────────────────────────────────────────
function ScenarioTab({
  scenario,
  isActive,
  onClick,
}: {
  scenario: Scenario
  isActive: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-200 whitespace-nowrap ${
        isActive
          ? 'text-white'
          : 'text-white/25 hover:text-white/60 hover:bg-white/[0.03]'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="scenarioActivePill"
          className="absolute inset-0 rounded-xl border"
          style={{
            background: `rgba(${scenario.accentRgb},0.08)`,
            borderColor: `rgba(${scenario.accentRgb},0.2)`,
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}

      <span
        className="relative z-10 transition-colors"
        style={{ color: isActive ? scenario.color : undefined }}
      >
        {scenario.icon}
      </span>
      <span className="relative z-10">{scenario.label}</span>

      {isActive && (
        <span
          className="relative z-10 text-[8px] px-1.5 py-0.5 rounded-full border font-bold tracking-wider"
          style={{
            color: scenario.color,
            background: `rgba(${scenario.accentRgb},0.1)`,
            borderColor: `rgba(${scenario.accentRgb},0.25)`,
          }}
        >
          {scenario.tag}
        </span>
      )}
    </motion.button>
  )
}

// ─── Input Area ───────────────────────────────────────────────────────────────────
function InputArea({
  onSend,
  disabled,
  accentRgb,
  accentColor,
}: {
  onSend: (msg: string) => void
  disabled: boolean
  accentRgb: string
  accentColor: string
}) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      className="relative rounded-2xl transition-all duration-300"
      style={{
        boxShadow: focused
          ? `0 0 0 1px rgba(${accentRgb},0.25), 0 0 30px rgba(${accentRgb},0.08)`
          : 'none',
      }}
    >
      <div
        className="absolute -inset-px rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb},0.2), transparent, rgba(${accentRgb},0.1))`,
          opacity: focused ? 1 : 0,
        }}
      />

      <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.07] overflow-hidden">
        <div
          className="absolute top-0 left-[20%] right-[20%] h-px transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.4), transparent)`,
            opacity: focused ? 1 : 0,
          }}
        />

        <form onSubmit={handleSubmit} className="flex items-end gap-3 p-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="$ pulse --ask 'anything...'"
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-xs font-mono text-white/70 placeholder:text-white/15 outline-none resize-none leading-relaxed caret-indigo-400 disabled:opacity-50 py-1.5"
            style={{ maxHeight: '120px' }}
          />

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-200"
            >
              <Icons.Mic />
            </button>

            <button
              type="submit"
              disabled={!canSend}
              className="group relative overflow-hidden w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: canSend
                  ? `linear-gradient(135deg, rgba(${accentRgb},0.6), rgba(${accentRgb},0.3))`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(${accentRgb},${canSend ? '0.4' : '0.1'})`,
              }}
            >
              <div
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                }}
              />
              <span
                className="relative z-10 transition-colors"
                style={{ color: canSend ? accentColor : 'rgba(255,255,255,0.2)' }}
              >
                <Icons.Send />
              </span>
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 text-[9px] font-mono text-white/15">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[8px]">
                ↵
              </kbd>
              send
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[8px]">
                ⇧↵
              </kbd>
              newline
            </span>
          </div>
          <span
            className="text-[9px] font-mono"
            style={{ color: `rgba(${accentRgb},0.4)` }}
          >
            GPT-4o · 128k ctx
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Live Stats HUD ───────────────────────────────────────────────────────────────
function LiveStatsHUD({
  totalTokens,
  messageCount,
  accentRgb,
}: {
  totalTokens: number
  messageCount: number
  accentRgb: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-4 text-[9px] font-mono text-white/20"
    >
      <span className="flex items-center gap-1">
        <span style={{ color: `rgba(${accentRgb},0.5)` }}>
          <Icons.Zap />
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={totalTokens}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 6, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {totalTokens}
          </motion.span>
        </AnimatePresence>
        {' '}tokens
      </span>

      <span className="w-px h-3 bg-white/[0.06]" />
      <span>{messageCount} messages</span>
      <span className="w-px h-3 bg-white/[0.06]" />

      <span className="flex items-center gap-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        live session
      </span>
    </motion.div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────────
function EmptyState({
  activeScenario,
  onScenarioSelect,
}: {
  activeScenario: Scenario
  onScenarioSelect: (s: Scenario) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col items-center justify-center gap-6"
    >
      <div className="relative">
        <div
          className="absolute inset-0 -m-6 rounded-full blur-3xl"
          style={{ background: `rgba(${activeScenario.accentRgb},0.08)` }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 -m-4 rounded-full border border-dashed"
          style={{ borderColor: `rgba(${activeScenario.accentRgb},0.12)` }}
        />
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center border"
          style={{
            background: `rgba(${activeScenario.accentRgb},0.08)`,
            borderColor: `rgba(${activeScenario.accentRgb},0.15)`,
          }}
        >
          <PulseRobot size="md" state="idle" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm font-mono font-bold text-white/50">PULSE_AI — READY</p>
        <p className="text-xs font-mono text-white/20 max-w-xs">
          Select a scenario above or type your own message below to start
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {SCENARIOS.map((scenario) => (
          <motion.button
            key={scenario.id}
            onClick={() => onScenarioSelect(scenario)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200 border"
            style={{
              background: `rgba(${scenario.accentRgb},0.06)`,
              borderColor: `rgba(${scenario.accentRgb},0.15)`,
              color: scenario.color,
            }}
          >
            {scenario.icon}
            <span className="text-white/40">{scenario.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────────
function SectionHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="text-center mb-14 max-w-3xl mx-auto"
    >
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.06] mb-6">
        <div className="flex gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.12,
                ease: 'easeInOut',
              }}
              className="w-[2px] h-3 bg-indigo-400 rounded-full origin-bottom"
              style={{ willChange: 'transform' }}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/30">
          Interactive Demo
        </span>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
      </div>

      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05] mb-5">
        Talk to Pulse.
        <br />
        <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          Right now.
        </span>
      </h2>

      <p className="text-sm sm:text-base text-white/35 max-w-xl mx-auto leading-relaxed font-mono">
        No signup. No credit card. Four real scenarios — or type your own
        question and watch Pulse think.
      </p>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────────
export function PulsePreview() {
  const sectionRef   = useRef<HTMLElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timeoutsRef  = useRef<ReturnType<typeof setTimeout>[]>([])

  const [activeScenario,  setActiveScenario]  = useState<Scenario>(SCENARIOS[0])
  const [messages,        setMessages]        = useState<Message[]>([])
  const [assistantState,  setAssistantState]  = useState<AssistantState>('idle')
  const [isRunning,       setIsRunning]       = useState(false)
  const [hasStarted,      setHasStarted]      = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-3%', '3%'])

  const totalTokens = messages.reduce((sum, m) => sum + (m.tokens ?? 0), 0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, assistantState])

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const pushTimeout = useCallback(
    (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay)
      timeoutsRef.current.push(id)
      return id
    },
    []
  )

  const runScenario = useCallback(
    (scenario: Scenario) => {
      clearAllTimeouts()
      setMessages([])
      setIsRunning(true)
      setHasStarted(true)
      setAssistantState('idle')

      const runId = `${scenario.id}-${Date.now()}`
      let delay = 400

      scenario.messages.forEach((msg, i) => {
        if (msg.role === 'assistant') {
          const t1 = delay
          pushTimeout(() => setAssistantState('thinking'), t1)
          delay += 800

          const t2 = delay
          pushTimeout(() => setAssistantState('typing'), t2)
          delay += 600
        }

        const msgDelay = delay
        pushTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              ...msg,
              id: `${runId}-${i}`,
              timestamp: new Date(),
            },
          ])
          if (msg.role === 'assistant') setAssistantState('idle')
        }, msgDelay)

        delay += msg.role === 'user' ? 600 : 1400
      })

      pushTimeout(() => {
        setIsRunning(false)
        setAssistantState('idle')
      }, delay + 400)
    },
    [clearAllTimeouts, pushTimeout]
  )

  const handleScenarioChange = useCallback(
    (scenario: Scenario) => {
      setActiveScenario(scenario)
      runScenario(scenario)
    },
    [runScenario]
  )

  const handleUserMessage = useCallback(
    (content: string) => {
      if (isRunning) return

      const ts = Date.now()

      const userMsg: Message = {
        id: `user-${ts}`,
        role: 'user',
        content,
        timestamp: new Date(),
        tokens: Math.ceil(content.split(/\s+/).length * 1.3),
      }

      setMessages((prev) => [...prev, userMsg])
      setAssistantState('thinking')
      setIsRunning(true)

      pushTimeout(() => setAssistantState('typing'), 900)

      pushTimeout(() => {
        const aiMsg: Message = {
          id: `ai-${ts}`,
          role: 'assistant',
          content:
            "I'm processing your request in this demo. In the full version, I'd give you a complete, thoughtful response. Ready to try the real thing?",
          timestamp: new Date(),
          tokens: 38,
          model: 'GPT-4o',
        }
        setMessages((prev) => [...prev, aiMsg])
        setAssistantState('idle')
        setIsRunning(false)
      }, 2400)
    },
    [isRunning, pushTimeout]
  )

  const handleReset = useCallback(() => {
    clearAllTimeouts()
    setMessages([])
    setAssistantState('idle')
    setIsRunning(false)
    setHasStarted(false)
  }, [clearAllTimeouts])

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="relative py-24 sm:py-32 overflow-hidden bg-[#050508]"
      aria-label="Pulse AI Interactive Demo"
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: bgY }}
      >
        <div
          className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.05), transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.04), transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 20%, #050508 80%)',
          }}
        />
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="relative"
        >
          <div
            className="absolute -inset-px rounded-3xl blur-sm pointer-events-none transition-all duration-500"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, rgba(${activeScenario.accentRgb},0.12), transparent 60%)`,
            }}
          />

          <div className="relative rounded-3xl border border-white/[0.08] bg-[#080810]/95 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/50">
            <div
              className="absolute top-0 left-[15%] right-[15%] h-px transition-all duration-500"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(${activeScenario.accentRgb},0.4), transparent)`,
              }}
            />

            {[
              'top-3 left-3',
              'top-3 right-3 rotate-90',
              'bottom-3 right-3 rotate-180',
              'bottom-3 left-3 -rotate-90',
            ].map((pos, i) => (
              <div key={i} className={`absolute ${pos} pointer-events-none`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M0 5V1.5C0 0.67 0.67 0 1.5 0H5"
                    stroke={`rgba(${activeScenario.accentRgb},0.2)`}
                    strokeWidth="0.8"
                  />
                </svg>
              </div>
            ))}

            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.01]">
              <div className="flex items-center gap-1.5">
                {['bg-red-500/40', 'bg-amber-500/40', 'bg-emerald-500/40'].map(
                  (c, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${c} hover:opacity-100 transition-opacity`}
                    />
                  )
                )}
              </div>

              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono text-white/20">
                    pulse-ai.dev/chat
                  </span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-200 text-[10px] font-mono"
              >
                <Icons.Refresh />
                reset
              </button>
            </div>

            <div className="flex items-center gap-1 px-4 py-2.5 border-b border-white/[0.04] overflow-x-auto no-scrollbar">
              <span className="text-[9px] font-mono text-white/15 mr-1 flex-shrink-0">
                scenarios:
              </span>
              {SCENARIOS.map((scenario) => (
                <ScenarioTab
                  key={scenario.id}
                  scenario={scenario}
                  isActive={activeScenario.id === scenario.id}
                  onClick={() => handleScenarioChange(scenario)}
                />
              ))}
            </div>

            <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.04] bg-white/[0.005]">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center border"
                    style={{
                      background: `rgba(${activeScenario.accentRgb},0.1)`,
                      borderColor: `rgba(${activeScenario.accentRgb},0.15)`,
                    }}
                  >
                    <div className="scale-[0.65]">
                      <PulseRobot size="sm" />
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-50" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-white/60 leading-none">
                    PULSE_AI
                  </p>
                  <p
                    className="text-[8px] font-mono leading-none mt-0.5"
                    style={{ color: `rgba(${activeScenario.accentRgb},0.6)` }}
                  >
                    {assistantState === 'idle' ? 'ready' : assistantState}
                  </p>
                </div>
              </div>

              <LiveStatsHUD
                totalTokens={totalTokens}
                messageCount={messages.length}
                accentRgb={activeScenario.accentRgb}
              />
            </div>

            <div className="h-[420px] sm:h-[500px] overflow-y-auto p-5 space-y-5 scroll-smooth">
              <AnimatePresence>
                {!hasStarted && messages.length === 0 && (
                  <EmptyState
                    activeScenario={activeScenario}
                    onScenarioSelect={handleScenarioChange}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    accentColor={activeScenario.color}
                    accentRgb={activeScenario.accentRgb}
                    index={index}
                  />
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {assistantState !== 'idle' && (
                  <TypingIndicator
                    state={assistantState}
                    accentRgb={activeScenario.accentRgb}
                  />
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 pb-4 pt-2 border-t border-white/[0.04]">
              <InputArea
                onSend={handleUserMessage}
                disabled={isRunning}
                accentRgb={activeScenario.accentRgb}
                accentColor={activeScenario.color}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-10"
        >
          <p className="text-xs font-mono text-white/25">
            This is a{' '}
            <span className="text-white/45">sandboxed preview</span> — the
            real Pulse is much more capable.
          </p>
          <a
            href="/signup"
            className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-mono font-bold text-xs shadow-[0_0_24px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.45)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]"
          >
            <span>unlock full access</span>
            <svg
              width="12" height="12" viewBox="0 0 16 16" fill="none"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <path
                d="M3 8H13M13 8L9 4M13 8L9 12"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}