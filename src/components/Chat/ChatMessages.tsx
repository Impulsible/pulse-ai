/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Chat/ChatMessages.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { PulseRobot } from '../Pulse/PulseRobot'

// ─── Types ───────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: number
  model?: string
}

interface ChatMessagesProps {
  messages: Message[]
  isTyping?: boolean
  onSuggestionClick?: (prompt: string) => void
  className?: string
}

// ─── Suggestions ─────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    label: 'Brainstorm',
    title: 'Generate ideas',
    prompt: 'Help me brainstorm ideas for a new SaaS product in the developer tools space',
    accent: '99,102,241',
    color: '#6366f1',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    label: 'Code',
    title: 'Write & debug code',
    prompt: 'Write a custom React hook for infinite scroll with TypeScript',
    accent: '34,211,238',
    color: '#22d3ee',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    label: 'Write',
    title: 'Draft content',
    prompt: 'Write a compelling product launch announcement for a developer tool',
    accent: '167,139,250',
    color: '#a78bfa',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    label: 'Research',
    title: 'Analyse & summarise',
    prompt: 'What are the key differences between RSC and traditional SSR in Next.js?',
    accent: '52,211,153',
    color: '#34d399',
  },
]

// ─── Scroll to bottom button ─────────────────────────────────────────────────────
function ScrollToBottomBtn({ onClick, unreadCount = 0 }: { onClick: () => void; unreadCount?: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 8 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      className="absolute bottom-4 right-4 z-20 group flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#0e0e18]/90 border border-white/[0.1] hover:border-indigo-500/30 text-white/45 hover:text-white/85 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-200"
      aria-label="Scroll to latest message"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="8" y1="2" x2="8" y2="12" />
        <polyline points="4 9 8 13 12 9" />
      </svg>
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-[10px] font-mono font-bold text-indigo-400"
        >
          {unreadCount} new
        </motion.span>
      )}
    </motion.button>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────────
function EmptyState({ onSuggestion }: { onSuggestion?: (prompt: string) => void }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center min-h-[55vh] px-4"
    >
      {/* Robot + rings */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center gap-6 mb-10"
      >
        <div className="relative flex items-center justify-center">
          {[24, 16].map((m, i) => (
            <motion.div
              key={i}
              animate={{ rotate: i === 0 ? 360 : -360 }}
              transition={{ duration: i === 0 ? 28 : 18, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full border border-dashed"
              style={{
                inset: `-${m}px`,
                borderColor: `rgba(${i === 0 ? '99,102,241' : '139,92,246'},0.1)`,
              }}
            />
          ))}
          <div className="absolute inset-0 -m-8 rounded-full bg-indigo-500/[0.06] blur-2xl" />
          <div className="relative z-10">
            <PulseRobot size="lg" state="idle" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-2xl sm:text-3xl font-bold text-white/80 tracking-tight"
          >
            How can I help you today?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="text-sm text-white/30 font-mono"
          >
            Ask me anything — or pick a starting point below.
          </motion.p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.07, duration: 0.35 }}
            onClick={() => onSuggestion?.(s.prompt)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex items-start gap-3 p-4 rounded-2xl text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/40"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(circle at 30% 50%, rgba(${s.accent},0.06), transparent 70%)` }}
            />
            <div
              className="relative w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200"
              style={{
                background: `rgba(${s.accent},0.08)`,
                border: `1px solid rgba(${s.accent},0.15)`,
                color: s.color,
              }}
            >
              {s.icon}
            </div>
            <div className="relative min-w-0">
              <p
                className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] mb-0.5 transition-colors duration-200"
                style={{ color: `rgba(${s.accent},0.6)` }}
              >
                {s.label}
              </p>
              <p className="text-xs font-semibold text-white/50 group-hover:text-white/70 transition-colors duration-200 leading-snug">
                {s.title}
              </p>
              <p className="text-[10px] text-white/20 group-hover:text-white/30 transition-colors mt-0.5 leading-snug line-clamp-2">
                {s.prompt}
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" />
              </svg>
            </motion.div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Date separator ──────────────────────────────────────────────────────────────
function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-white/[0.05]" />
      <span className="text-[10px] font-mono text-white/25 px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/[0.04]">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  )
}

function getDateLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = (today.getTime() - d.getTime()) / 86_400_000

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════
export function ChatMessages({
  messages,
  isTyping = false,
  onSuggestionClick,
  className,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const isAtBottomRef = useRef(true)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distFromBottom < 80
    setShowScrollBtn(distFromBottom > 200)
  }, [])

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollBtn(false)
  }, [])

  type RenderItem =
    | { type: 'separator'; label: string; key: string }
    | { type: 'message'; message: Message }

  const renderItems: RenderItem[] = []
  let lastLabel = ''

  messages.forEach((msg) => {
    const label = getDateLabel(msg.timestamp)
    if (label !== lastLabel) {
      renderItems.push({ type: 'separator', label, key: `sep-${label}` })
      lastLabel = label
    }
    renderItems.push({ type: 'message', message: msg })
  })

  const isEmpty = messages.length === 0 && !isTyping

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]"
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <EmptyState key="empty" onSuggestion={onSuggestionClick} />
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                <AnimatePresence initial={false}>
                  {renderItems.map((item) =>
                    item.type === 'separator' ? (
                      <DateSeparator key={item.key} label={item.label} />
                    ) : (
                      <MessageBubble key={item.message.id} message={item.message} />
                    )
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.25 }}
                    >
                      <TypingIndicator />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} className="h-px" />
        </div>
      </div>

      <AnimatePresence>
        {showScrollBtn && <ScrollToBottomBtn key="scroll-btn" onClick={scrollToBottom} />}
      </AnimatePresence>
    </div>
  )
}