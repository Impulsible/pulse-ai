/* eslint-disable react-hooks/refs */
// src/components/Chat/MessageActions.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

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
  onEdit?: (id: string) => void
  onShare?: (id: string) => void
  onDelete?: (id: string) => void
}

// ─── Icons ───────────────────────────────────────────────────────────────────────
const I = {
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  ThumbUp: ({ filled }: { filled: boolean }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  ThumbDown: ({ filled }: { filled: boolean }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Share: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  Volume: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  ),
  More: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────────
function Tip({ label, shortcut, children }: {
  label: string; shortcut?: string; children: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enter = () => { timer.current = setTimeout(() => setShow(true), 400) }
  const leave = () => { if (timer.current) clearTimeout(timer.current); setShow(false) }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] pointer-events-none"
          >
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#13131d] border border-white/[0.1] shadow-xl shadow-black/60 whitespace-nowrap">
              <span className="text-[10px] font-mono text-white/60">{label}</span>
              {shortcut && (
                <kbd className="text-[8px] font-mono text-white/25 px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
                  {shortcut}
                </kbd>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#13131d] border-r border-b border-white/[0.1] -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Action Button ───────────────────────────────────────────────────────────────
interface ActionBtnProps {
  onClick: () => void
  tooltip: string
  shortcut?: string
  children: React.ReactNode
  active?: boolean
  activeColor?: 'indigo' | 'emerald' | 'violet' | 'amber' | 'red'
  spinning?: boolean
  destructive?: boolean
  disabled?: boolean
}

function ActionBtn({
  onClick, tooltip, shortcut, children, active = false,
  activeColor = 'indigo', spinning = false, destructive = false, disabled = false,
}: ActionBtnProps) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
    red: 'text-red-400 bg-red-500/10 border-red-500/15',
  }

  return (
    <Tip label={tooltip} shortcut={shortcut}>
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.08 }}
        whileTap={disabled ? {} : { scale: 0.88 }}
        className={cn(
          'relative w-7 h-7 rounded-lg flex items-center justify-center',
          'transition-all duration-150 border border-transparent',
          disabled && 'opacity-30 cursor-not-allowed',
          active
            ? colorMap[activeColor]
            : destructive
              ? 'text-white/25 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/15'
              : 'text-white/30 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.08]'
        )}
      >
        <motion.span
          animate={spinning ? { rotate: 360 } : { rotate: 0 }}
          transition={spinning ? { duration: 0.7, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {children}
        </motion.span>

        {/* Active dot indicator */}
        {active && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full',
              activeColor === 'emerald' && 'bg-emerald-400',
              activeColor === 'indigo' && 'bg-indigo-400',
              activeColor === 'violet' && 'bg-violet-400',
              activeColor === 'amber' && 'bg-amber-400',
              activeColor === 'red' && 'bg-red-400',
            )}
          />
        )}
      </motion.button>
    </Tip>
  )
}

// ─── Overflow Menu ───────────────────────────────────────────────────────────────
interface MenuItemDef {
  icon: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
  shortcut?: string
}

function OverflowMenu({ items, onClose }: { items: MenuItemDef[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', h), 50)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', h) }
  }, [onClose])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -2 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="absolute right-0 top-full mt-2 z-[70] min-w-[170px]"
      style={{ transformOrigin: 'top right' }}
    >
      {/* Glow */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 blur-md pointer-events-none" />

      <div className="relative rounded-2xl bg-[#0c0c16]/95 border border-white/[0.09] shadow-2xl shadow-black/60 backdrop-blur-2xl overflow-hidden p-1">
        {items.map((item, i) => (
          <motion.button
            key={item.label}
            onClick={() => { item.onClick(); onClose() }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.15 }}
            whileHover={{ x: 2 }}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all duration-150 group',
              item.destructive
                ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08]'
                : 'text-white/45 hover:text-white/85 hover:bg-white/[0.05]'
            )}
          >
            <span className={cn(
              'flex-shrink-0 transition-colors',
              item.destructive
                ? 'text-red-400/50 group-hover:text-red-400'
                : 'text-white/25 group-hover:text-white/65'
            )}>
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <kbd className="text-[8px] font-mono text-white/15 px-1 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                {item.shortcut}
              </kbd>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Mini Toast ──────────────────────────────────────────────────────────────────
interface ToastMsg {
  id: number
  text: string
  kind: 'success' | 'error' | 'info'
}

function MiniToast({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-xl shadow-black/40 backdrop-blur-xl',
              'text-[11px] font-mono font-medium',
              t.kind === 'success' && 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
              t.kind === 'error' && 'bg-red-500/15 border-red-500/25 text-red-300',
              t.kind === 'info' && 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300'
            )}
          >
            {/* Icon */}
            <span className={cn(
              'flex items-center justify-center',
              t.kind === 'success' && 'text-emerald-400',
              t.kind === 'error' && 'text-red-400',
              t.kind === 'info' && 'text-indigo-400'
            )}>
              {t.kind === 'success' && <I.Check />}
              {t.kind === 'error' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              {t.kind === 'info' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </span>
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════
export function MessageActions({
  message,
  onRegenerate,
  onFeedback,
  onEdit,
  onShare,
  onDelete,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Cleanup
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // ── Toast helper ──────────────────────────────
  const showToast = useCallback(
    (text: string, kind: ToastMsg['kind'] = 'info', duration = 2200) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, text, kind }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
    },
    []
  )

  // ── Copy ──────────────────────────────────────
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

  // ── Regenerate ────────────────────────────────
  const handleRegenerate = useCallback(() => {
    if (regenerating) return
    setRegenerating(true)
    showToast('Regenerating response…', 'info')
    onRegenerate?.(message.id)
    if (regenTimerRef.current) clearTimeout(regenTimerRef.current)
    regenTimerRef.current = setTimeout(() => setRegenerating(false), 2000)
  }, [regenerating, message.id, onRegenerate, showToast])

  // ── Feedback ──────────────────────────────────
  const handleFeedback = useCallback(
    (kind: 'up' | 'down') => {
      const next = feedback === kind ? null : kind
      setFeedback(next)
      if (next !== null) {
        onFeedback?.(message.id, next)
        showToast(
          next === 'up' ? 'Thanks for the feedback!' : "Got it — we'll improve.",
          next === 'up' ? 'success' : 'info'
        )
      }
    },
    [feedback, message.id, onFeedback, showToast]
  )

  // ── Text-to-Speech ────────────────────────────
  const handleSpeak = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showToast('Speech not supported', 'error')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(message.content)
    utterance.rate = 1.05
    utterance.pitch = 1
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    speechRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    showToast('Reading aloud…', 'info')
  }, [message.content, speaking, showToast])

  // ── Edit ──────────────────────────────────────
  const handleEdit = useCallback(() => {
    onEdit?.(message.id)
    showToast('Edit mode', 'info')
  }, [message.id, onEdit, showToast])

  // ── Share ─────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: message.content })
        showToast('Shared successfully', 'success')
      } catch {
        // User cancelled
      }
    } else {
      onShare?.(message.id)
      showToast('Share link copied', 'success')
    }
  }, [message.id, message.content, onShare, showToast])

  // ── Delete ────────────────────────────────────
  const handleDelete = useCallback(() => {
    onDelete?.(message.id)
    showToast('Message deleted', 'success')
  }, [message.id, onDelete, showToast])

  const isAssistant = message.role === 'assistant'
  const isUser = message.role === 'user'

  // Menu items for overflow
  const menuItems: MenuItemDef[] = [
    ...(isAssistant ? [{
      icon: <I.Volume />,
      label: speaking ? 'Stop reading' : 'Read aloud',
      onClick: handleSpeak,
    }] : []),
    {
      icon: <I.Share />,
      label: 'Share',
      onClick: handleShare,
      shortcut: '⌘S',
    },
    ...(isUser && onEdit ? [{
      icon: <I.Edit />,
      label: 'Edit message',
      onClick: handleEdit,
      shortcut: 'E',
    }] : []),
    ...(onDelete ? [{
      icon: <I.Trash />,
      label: 'Delete',
      onClick: handleDelete,
      destructive: true,
    }] : []),
  ]

  return (
    <>
      {/* ── Actions Pill ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 4 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="absolute -top-4 right-0 z-30 flex items-center gap-0.5 px-1 py-1 rounded-xl bg-[#0e0e18]/95 backdrop-blur-xl border border-white/[0.09] shadow-xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Copy */}
        <ActionBtn
          onClick={handleCopy}
          tooltip={copied ? 'Copied!' : 'Copy message'}
          shortcut="⌘C"
          active={copied}
          activeColor="emerald"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                <I.Check />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <I.Copy />
              </motion.span>
            )}
          </AnimatePresence>
        </ActionBtn>

        {/* Regenerate — assistant only */}
        {isAssistant && (
          <>
            <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

            <ActionBtn
              onClick={handleRegenerate}
              tooltip={regenerating ? 'Regenerating…' : 'Regenerate response'}
              shortcut="⌘R"
              active={regenerating}
              activeColor="indigo"
              spinning={regenerating}
              disabled={regenerating}
            >
              <I.Refresh />
            </ActionBtn>

            <ActionBtn
              onClick={handleSpeak}
              tooltip={speaking ? 'Stop reading' : 'Read aloud'}
              active={speaking}
              activeColor="violet"
            >
              <I.Volume />
            </ActionBtn>

            <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

            <ActionBtn
              onClick={() => handleFeedback('up')}
              tooltip="Good response"
              active={feedback === 'up'}
              activeColor="emerald"
            >
              <I.ThumbUp filled={feedback === 'up'} />
            </ActionBtn>

            <ActionBtn
              onClick={() => handleFeedback('down')}
              tooltip="Bad response"
              active={feedback === 'down'}
              activeColor="red"
            >
              <I.ThumbDown filled={feedback === 'down'} />
            </ActionBtn>
          </>
        )}

        {/* Edit — user only */}
        {isUser && onEdit && (
          <>
            <div className="w-px h-4 bg-white/[0.06] mx-0.5" />
            <ActionBtn
              onClick={handleEdit}
              tooltip="Edit message"
              shortcut="E"
              activeColor="indigo"
            >
              <I.Edit />
            </ActionBtn>
          </>
        )}

        {/* Overflow menu */}
        {menuItems.length > 0 && (
          <>
            <div className="w-px h-4 bg-white/[0.06] mx-0.5" />
            <div className="relative">
              <ActionBtn
                onClick={() => setMenuOpen((v) => !v)}
                tooltip="More options"
                active={menuOpen}
                activeColor="indigo"
              >
                <I.More />
              </ActionBtn>
              <AnimatePresence>
                {menuOpen && <OverflowMenu items={menuItems} onClose={() => setMenuOpen(false)} />}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>

      {/* Toasts */}
      <MiniToast toasts={toasts} />
    </>
  )
}