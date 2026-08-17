/* eslint-disable @next/next/no-img-element */
// src/components/Chat/UserMessage.tsx
'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

// ─── Types ───────────────────────────────────────────────────────────────────────
interface UserMessageProps {
  content: string
  timestamp?: string
  avatar?: string
  username?: string
  className?: string
  onEdit?: (content: string) => void
  /** Current total messages used this billing cycle */
  messagesUsed?: number
  /** Max messages allowed on current plan */
  messagesLimit?: number
  /** Current plan name */
  plan?: string
  /** Message index in conversation (1-based) */
  messageIndex?: number
}

// ─── Utilities ───────────────────────────────────────────────────────────────────
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

// ─── Icons ───────────────────────────────────────────────────────────────────────
const I = {
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Alert: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Zap: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
}

// ─── Inline Code Renderer ─────────────────────────────────────────────────────────
function renderContent(text: string) {
  const parts = text.split(/(`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.875em] text-indigo-300"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ─── Avatar ───────────────────────────────────────────────────────────────────────
function UserAvatar({ avatar, username }: { avatar?: string; username?: string }) {
  const initials = username
    ? username.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
    : 'Y'

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username ?? 'You'}
        className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
      />
    )
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600">
      <span className="text-[11px] font-semibold text-white">
        {initials}
      </span>
    </div>
  )
}

// ─── Usage Meter (compact banner) ────────────────────────────────────────────────
function UsageMeter({
  used,
  limit,
  plan,
}: {
  used: number
  limit: number
  plan: string
}) {
  const percentage = Math.min((used / limit) * 100, 100)
  const remaining = Math.max(limit - used, 0)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  const barColor = isAtLimit
    ? 'bg-red-400'
    : isNearLimit
    ? 'bg-amber-400'
    : 'bg-indigo-400'

  const textColor = isAtLimit
    ? 'text-red-400'
    : isNearLimit
    ? 'text-amber-400'
    : 'text-white/50'

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.25 }}
      className={cn(
        'mx-auto max-w-2xl flex items-center gap-3 rounded-lg border px-3 py-2 mt-2 mb-4',
        isAtLimit
          ? 'bg-red-500/[0.05] border-red-500/20'
          : isNearLimit
          ? 'bg-amber-500/[0.04] border-amber-500/15'
          : 'bg-white/[0.02] border-white/[0.06]'
      )}
    >
      {isAtLimit && (
        <span className="text-red-400 flex-shrink-0">
          <I.Alert />
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn('text-[11px] font-medium capitalize', textColor)}>
            {plan} plan
          </span>
          <span className={cn('text-[11px] tabular-nums', textColor)}>
            {used} / {limit} messages
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className={cn('h-full rounded-full', barColor)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('text-[11px] font-medium tabular-nums', textColor)}>
          {remaining} left
        </span>
        {(isNearLimit || isAtLimit) && (
          <a
            href="/pricing"
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
              isAtLimit
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-white/[0.08] text-white/80 hover:bg-white/[0.12]'
            )}
          >
            Upgrade
          </a>
        )}
      </div>
    </motion.div>
  )
}

// ─── Edit Mode ────────────────────────────────────────────────────────────────────
function EditMode({
  value,
  onSave,
  onCancel,
}: {
  value: string
  onSave: (v: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel()
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (text.trim() && text !== value) onSave(text.trim())
    }
  }

  const isDirty = text.trim() !== value && text.trim().length > 0

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-white/[0.03] p-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full resize-none bg-transparent text-[15px] leading-7 text-white/95 outline-none placeholder:text-white/30"
        placeholder="Edit your message..."
        style={{ minHeight: '24px', maxHeight: '300px' }}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-white/25">
          ⌘↵ to save · Esc to cancel
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => text.trim() && text !== value && onSave(text.trim())}
            disabled={!isDirty}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Save & Submit
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════
export const UserMessage = memo(function UserMessage({
  content,
  timestamp,
  avatar,
  username = 'You',
  className,
  onEdit,
  messagesUsed,
  messagesLimit,
  plan,
  messageIndex,
}: UserMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Usage meter conditions
  const showUsageMeter =
    messagesUsed !== undefined &&
    messagesLimit !== undefined &&
    plan !== undefined &&
    messagesLimit !== -1 // hide for unlimited plans

  const isAtLimit = showUsageMeter && messagesUsed! >= messagesLimit!
  const isNearLimit = showUsageMeter && (messagesUsed! / messagesLimit!) >= 0.8

  // Show meter on: 1st message OR when near/at limit
  const displayMeter = showUsageMeter && (messageIndex === 1 || isNearLimit || isAtLimit)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleSave = (newContent: string) => {
    onEdit?.(newContent)
    setIsEditing(false)
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className={cn('group/msg flex gap-4 px-4 py-5 sm:px-6', className)}
      >
        {/* ── Compact Avatar ────────────────────────── */}
        <div className="flex-shrink-0 pt-0.5">
          <UserAvatar avatar={avatar} username={username} />
        </div>

        {/* ── Content Column ────────────────────────── */}
        <div className="min-w-0 flex-1">
          {/* Header: name only */}
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-sm font-semibold text-white/90">
              {username}
            </span>
          </div>

          {/* Body */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <EditMode
                  value={content}
                  onSave={handleSave}
                  onCancel={() => setIsEditing(false)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[15px] leading-7 text-white/85 whitespace-pre-wrap break-words"
              >
                {content.trim().length === 0 ? (
                  <span className="italic text-white/30">Empty message</span>
                ) : (
                  renderContent(content)
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action bar — appears on hover */}
          {!isEditing && content.trim().length > 0 && (
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

              {onEdit && !isAtLimit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
                  aria-label="Edit message"
                  title="Edit"
                >
                  <I.Edit />
                </button>
              )}

              {timestamp && (
                <span className="ml-2 text-[11px] text-white/25">
                  {formatTimestamp(timestamp)}
                </span>
              )}

              {/* Character counter (only for long messages) */}
              {content.length > 500 && (
                <span className="ml-2 flex items-center gap-1 text-[11px] text-white/20">
                  <span className="text-amber-400/50"><I.Zap /></span>
                  {content.length.toLocaleString()} chars
                </span>
              )}
            </div>
          )}
        </div>
      </motion.article>

      {/* Usage meter appears below the message when needed */}
      {displayMeter && (
        <UsageMeter
          used={messagesUsed!}
          limit={messagesLimit!}
          plan={plan!}
        />
      )}
    </>
  )
})