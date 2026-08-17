/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Chat/AIMessage.tsx
'use client'

import { memo, useState, useCallback, useEffect, useRef } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { PulseRobot } from '@/components/Pulse/PulseRobot'
import { cn } from '@/utils/cn'

// ─── Types ───────────────────────────────────────────────────────────────────────
interface AIMessageProps {
  content: string
  model?: string
  timestamp?: string
  isStreaming?: boolean
  isError?: boolean
  isLatest?: boolean
  onRegenerate?: () => void
  onCopy?: () => void
  onFeedback?: (rating: 'up' | 'down') => void
  className?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────
function normalizeModelName(model?: string): string {
  if (!model || model.toLowerCase() === 'groq') return 'Pulse AI'
  return model
}

function formatTimestamp(ts?: string): string {
  if (!ts) return ''
  try {
    const date = new Date(ts)
    if (isNaN(date.getTime())) return ts
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

// ─── Strip Markdown for TTS ──────────────────────────────────────────────────────
function stripMarkdownForTTS(text: string): string {
  let cleaned = text
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1')
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1')
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1')
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
  cleaned = cleaned.replace(/^>\s+/gm, '')
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '')
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '')
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '')
  cleaned = cleaned.replace(/<[^>]*>/g, '')
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.replace(/\n/g, ' ')
  cleaned = cleaned.replace(/\s{2,}/g, ' ')
  return cleaned.trim()
}

// ─── Icons ───────────────────────────────────────────────────────────────────────
const I = {
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Regenerate: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  ThumbUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  ThumbDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  ),
  Alert: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Pause: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  Stop: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
}

// ─── TTS Button ──────────────────────────────────────────────────────────────────
function TTSButton({ text }: { text: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const cleanText = stripMarkdownForTTS(text)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    } else {
      setIsSupported(false)
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  const handlePlay = useCallback(() => {
    if (!synthRef.current || !cleanText) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.includes('Google')
    ) || voices.find((v) => v.lang.startsWith('en')) || voices[0]
    if (preferredVoice) utterance.voice = preferredVoice
    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false) }
    utterance.onpause = () => setIsPaused(true)
    utterance.onresume = () => setIsPaused(false)
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false) }
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false) }
    synthRef.current.speak(utterance)
  }, [cleanText])

  const handlePause = useCallback(() => {
    if (synthRef.current && synthRef.current.speaking) {
      if (isPaused) {
        synthRef.current.resume()
        setIsPaused(false)
      } else {
        synthRef.current.pause()
        setIsPaused(true)
      }
    }
  }, [isPaused])

  const handleStop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsPlaying(false)
      setIsPaused(false)
    }
  }, [])

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.getVoices()
      const handleVoicesChanged = () => {}
      synthRef.current.addEventListener('voiceschanged', handleVoicesChanged)
      return () => {
        if (synthRef.current) {
          synthRef.current.removeEventListener('voiceschanged', handleVoicesChanged)
        }
      }
    }
  }, [])

  if (!isSupported || !cleanText) return null

  return (
    <div className="flex items-center gap-0.5">
      {!isPlaying ? (
        <button
          onClick={handlePlay}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/70 transition-colors"
          aria-label="Play audio"
          title="Listen to this message"
        >
          <I.Play />
        </button>
      ) : (
        <>
          <button
            onClick={handlePause}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#6366f1] hover:text-[#818cf8] transition-colors"
            aria-label={isPaused ? 'Resume audio' : 'Pause audio'}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <I.Play /> : <I.Pause />}
          </button>
          <button
            onClick={handleStop}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-red-400/60 hover:text-red-400 transition-colors"
            aria-label="Stop audio"
            title="Stop"
          >
            <I.Stop />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Code Block ──────────────────────────────────────────────────────────────────
function CodeBlock({ language = 'text', code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }, [code])

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-white/[0.06] bg-[#0a0a0f]">
      <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.02] px-3 py-2">
        <span className="text-[11px] font-mono text-white/45">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="text-emerald-400 flex items-center gap-1.5"
              >
                <I.Check />
                <span>Copied</span>
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <I.Copy />
                <span>Copy</span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={tomorrow as any}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '0.875rem 1rem',
          background: 'transparent',
          fontSize: '0.85rem',
          lineHeight: '1.6',
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

// ─── Markdown Components ─────────────────────────────────────────────────────────
const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-4 leading-7 text-white/85 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-indigo-400 underline decoration-indigo-400/40 underline-offset-2 hover:text-indigo-300 hover:decoration-indigo-300"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 space-y-1.5 pl-6 [&>li]:list-disc marker:text-white/40">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 space-y-1.5 pl-6 [&>li]:list-decimal marker:text-white/40">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7 text-white/85">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-2xl font-semibold text-white first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 text-xl font-semibold text-white first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold text-white first:mt-0">{children}</h3>
  ),
  hr: () => <hr className="my-6 border-white/[0.08]" />,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-white/[0.15] pl-4 italic text-white/70">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-white/[0.08]">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-white/[0.08] bg-white/[0.02]">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/50">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-sm text-white/75">{children}</td>
  ),
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const raw = String(children).replace(/\n$/, '')
    const match = /language-([\w-]+)/.exec(className || '')
    const isBlock = Boolean(match) || raw.includes('\n')
    if (isBlock) {
      return <CodeBlock language={match?.[1] ?? 'text'} code={raw} />
    }
    return (
      <code className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.875em] text-indigo-300">
        {children}
      </code>
    )
  },
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════
export const AIMessage = memo(function AIMessage({
  content,
  model,
  timestamp,
  isStreaming = false,
  isError = false,
  isLatest = false,
  onRegenerate,
  onCopy,
  onFeedback,
  className,
}: AIMessageProps) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null)

  const displayModel = normalizeModelName(model)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [content, onCopy])

  const handleReaction = useCallback((r: 'up' | 'down') => {
    const newReaction = reaction === r ? null : r
    setReaction(newReaction)
    if (newReaction) onFeedback?.(newReaction)
  }, [reaction, onFeedback])

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className={cn('relative group/msg', className)}
    >
      {/* ─── Glow Effect ────────────────────────────────────── */}
      {isLatest && !isError && (
        <>
          <div className="absolute -inset-x-4 -inset-y-2 pointer-events-none opacity-40">
            <div 
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-[400px] h-[150px] rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(99,102,241,0.08), transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <div 
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[300px] h-[100px] rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(139,92,246,0.06), transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
          </div>
          {/* Left accent line */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full bg-gradient-to-b from-[#6366f1]/50 via-[#8b5cf6]/40 to-transparent origin-top"
          />
        </>
      )}

      <div className="flex gap-4 px-4 py-5 sm:px-6">
        {/* ── Avatar ────────────────────────────────────────── */}
        <div className="flex-shrink-0 pt-0.5">
          <div className={cn(
            'relative flex h-7 w-7 items-center justify-center rounded-full border',
            isError
              ? 'border-red-500/25 bg-red-500/10'
              : 'border-indigo-500/20 bg-gradient-to-br from-indigo-500/15 to-violet-500/15'
          )}>
            {isStreaming && !isError && (
              <motion.div
                className="absolute -inset-0.5 rounded-full border border-indigo-400/40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <div className="scale-[0.5]">
              <PulseRobot size="sm" />
            </div>
          </div>
        </div>

        {/* ─── Content Column ────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-sm font-semibold text-white/90">
              {displayModel}
            </span>
            {isStreaming && !isError && (
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                </span>
                <span className="text-indigo-400/70">Generating…</span>
              </span>
            )}
            {isError && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                <I.Alert />
                Error
              </span>
            )}
          </div>

          {/* Body */}
          <div className="text-[15px]">
            {isError ? (
              <p className="text-red-300/85 leading-7">{content}</p>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
              </ReactMarkdown>
            )}
          </div>

          {/* ─── Action Bar ────────────────────────────────────── */}
          {!isStreaming && !isError && content.length > 0 && (
            <div className="mt-3 flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleCopy}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
                aria-label={copied ? 'Copied' : 'Copy message'}
                title={copied ? 'Copied' : 'Copy'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="text-emerald-400"
                    >
                      <I.Check />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                    >
                      <I.Copy />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
                  aria-label="Regenerate response"
                  title="Regenerate"
                >
                  <I.Regenerate />
                </button>
              )}

              <button
                onClick={() => handleReaction('up')}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  reaction === 'up'
                    ? 'text-emerald-400 bg-emerald-400/10'
                    : 'text-white/40 hover:bg-white/[0.06] hover:text-white/80'
                )}
                aria-label="Good response"
                title="Good response"
              >
                <I.ThumbUp />
              </button>

              <button
                onClick={() => handleReaction('down')}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  reaction === 'down'
                    ? 'text-red-400 bg-red-400/10'
                    : 'text-white/40 hover:bg-white/[0.06] hover:text-white/80'
                )}
                aria-label="Bad response"
                title="Bad response"
              >
                <I.ThumbDown />
              </button>

              {/* TTS Button */}
              {content.length > 20 && (
                <>
                  <span className="w-px h-4 bg-white/[0.06] mx-0.5" />
                  <TTSButton text={content} />
                </>
              )}

              {timestamp && (
                <>
                  <span className="w-px h-4 bg-white/[0.06] mx-0.5" />
                  <span className="text-[11px] text-white/25">
                    {formatTimestamp(timestamp)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
})