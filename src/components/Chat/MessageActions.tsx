// src/components/Chat/MessageActions.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface MessageActionsProps {
  message: Message
  onRegenerate?: (id: string) => void
  onFeedback?: (id: string, kind: 'up' | 'down') => void
}

// ─── Icons ───────────────────────────────────────────────────────────────────────
function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function ThumbUpIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function ThumbDownIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  )
}

// ─── Inline tooltip ───────────────────────────────────────────────────────────────
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enter = () => { timer.current = setTimeout(() => setShow(true), 450) }
  const leave = () => {
    if (timer.current) clearTimeout(timer.current)
    setShow(false)
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <div
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          >
            <div className="px-2 py-1 rounded-lg bg-[#111118] border border-white/[0.08] shadow-xl shadow-black/50">
              <p className="text-[10px] font-mono text-white/50 whitespace-nowrap">{label}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Single action button ─────────────────────────────────────────────────────────
interface ActionBtnProps {
  onClick: () => void
  tooltip: string
  children: React.ReactNode
  active?: boolean
  activeColor?: string        // tailwind text colour when active
  spinning?: boolean
  destructive?: boolean
}

function ActionBtn({
  onClick,
  tooltip,
  children,
  active = false,
  activeColor = 'text-indigo-400',
  spinning = false,
  destructive = false,
}: ActionBtnProps) {
  return (
    <Tip label={tooltip}>
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        className={[
          'relative w-7 h-7 rounded-lg flex items-center justify-center',
          'transition-colors duration-150',
          active
            ? `${activeColor} bg-white/[0.06]`
            : destructive
            ? 'text-white/25 hover:text-red-400 hover:bg-red-500/[0.1]'
            : 'text-white/25 hover:text-white/70 hover:bg-white/[0.06]',
        ].join(' ')}
      >
        <motion.span
          animate={spinning ? { rotate: 360 } : { rotate: 0 }}
          transition={
            spinning
              ? { duration: 0.7, repeat: Infinity, ease: 'linear' }
              : { duration: 0.2 }
          }
          className="flex items-center justify-center"
        >
          {children}
        </motion.span>
      </motion.button>
    </Tip>
  )
}

// ─── Feedback state ───────────────────────────────────────────────────────────────
type FeedbackKind = 'up' | 'down' | null

// ─── Toast (self-contained, no external dep) ──────────────────────────────────────
interface ToastMsg {
  id: number
  text: string
  kind: 'success' | 'error' | 'info'
}

function MiniToast({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            className={[
              'px-4 py-2 rounded-xl border shadow-xl shadow-black/40 backdrop-blur-xl',
              'text-xs font-mono font-medium',
              t.kind === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : t.kind === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
            ].join(' ')}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────────
export function MessageActions({
  message,
  onRegenerate,
  onFeedback,
}: MessageActionsProps) {
  const [copied,       setCopied]       = useState(false)
  const [feedback,     setFeedback]     = useState<FeedbackKind>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [toasts,       setToasts]       = useState<ToastMsg[]>([])

  const copyTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current)  clearTimeout(copyTimerRef.current)
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current)
    }
  }, [])

  // ── Mini toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback(
    (text: string, kind: ToastMsg['kind'] = 'info', duration = 2200) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, text, kind }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
    },
    []
  )

  // ── Copy ──────────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      showToast('Copied to clipboard', 'success')
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Failed to copy', 'error')
    }
  }, [message.content, showToast])

  // ── Regenerate ────────────────────────────────────────────────────────────────
  const handleRegenerate = useCallback(() => {
    if (regenerating) return
    setRegenerating(true)
    showToast('Regenerating response…', 'info')
    onRegenerate?.(message.id)
    if (regenTimerRef.current) clearTimeout(regenTimerRef.current)
    regenTimerRef.current = setTimeout(() => setRegenerating(false), 2000)
  }, [regenerating, message.id, onRegenerate, showToast])

  // ── Feedback ──────────────────────────────────────────────────────────────────
  const handleFeedback = useCallback(
    (kind: 'up' | 'down') => {
      // Toggle off if same button pressed again
      const next = feedback === kind ? null : kind
      setFeedback(next)
      if (next !== null) {
        onFeedback?.(message.id, next)
        showToast(
          next === 'up' ? 'Thanks for the feedback!' : 'Got it — we\'ll improve.',
          next === 'up' ? 'success' : 'info'
        )
      }
    },
    [feedback, message.id, onFeedback, showToast]
  )

  const isAssistant = message.role === 'assistant'

  return (
    <>
      {/* Action pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 4 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="
          absolute -top-4 right-0 z-20
          flex items-center gap-0.5 px-1 py-1
          rounded-xl
          bg-[#0e0e16]/90 backdrop-blur-xl
          border border-white/[0.08]
          shadow-xl shadow-black/50
        "
        // Prevent click propagating to message bubble
        onClick={(e) => e.stopPropagation()}
      >
        {/* Copy */}
        <ActionBtn
          onClick={handleCopy}
          tooltip={copied ? 'Copied!' : 'Copy'}
          active={copied}
          activeColor="text-emerald-400"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
                className="text-emerald-400"
              >
                <CheckIcon />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CopyIcon />
              </motion.span>
            )}
          </AnimatePresence>
        </ActionBtn>

        {/* Separator */}
        <div className="w-px h-4 bg-white/[0.07] mx-0.5" />

        {/* Regenerate — assistant only */}
        {isAssistant && (
          <ActionBtn
            onClick={handleRegenerate}
            tooltip={regenerating ? 'Regenerating…' : 'Regenerate'}
            active={regenerating}
            activeColor="text-indigo-400"
            spinning={regenerating}
          >
            <RefreshIcon />
          </ActionBtn>
        )}

        {/* Thumbs — assistant only */}
        {isAssistant && (
          <>
            <ActionBtn
              onClick={() => handleFeedback('up')}
              tooltip="Good response"
              active={feedback === 'up'}
              activeColor="text-emerald-400"
            >
              <ThumbUpIcon filled={feedback === 'up'} />
            </ActionBtn>

            <ActionBtn
              onClick={() => handleFeedback('down')}
              tooltip="Bad response"
              active={feedback === 'down'}
              activeColor="text-red-400"
            >
              <ThumbDownIcon filled={feedback === 'down'} />
            </ActionBtn>
          </>
        )}
      </motion.div>

      {/* Self-contained toast stack */}
      <MiniToast toasts={toasts} />
    </>
  )
}