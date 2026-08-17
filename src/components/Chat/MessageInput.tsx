// src/components/Chat/MessageInput.tsx
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

// ─── Types ───────────────────────────────────────────────────────────────────────
interface MessageInputProps {
  onSendMessage: (content: string) => void
  onStopGenerating?: () => void
  onFileAttach?: (files: FileList) => void
  onVoiceToggle?: (isRecording: boolean) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  maxHeight?: number
  maxLength?: number
  /** Show suggestion chips above input when empty */
  suggestions?: Array<{ label: string; prompt: string; icon?: React.ReactNode }>
}

// ─── Icons ───────────────────────────────────────────────────────────────────────
const I = {
  Paperclip: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  Mic: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l14-7-7 14-2-5-5-2z" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  Stop: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  ),
}

// ─── Suggestion Chip ─────────────────────────────────────────────────────────────
function SuggestionChip({
  label,
  icon,
  onClick,
}: {
  label: string
  icon?: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-[13px] text-white/60 hover:text-white/90 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-150 whitespace-nowrap"
    >
      {icon && <span className="text-white/40">{icon}</span>}
      {label}
    </button>
  )
}

// ─── Icon Button ─────────────────────────────────────────────────────────────────
function IconButton({
  onClick,
  disabled = false,
  active = false,
  children,
  className,
  'aria-label': ariaLabel,
  title,
}: {
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
  className?: string
  'aria-label': string
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
        disabled
          ? 'text-white/15 cursor-not-allowed'
          : active
          ? 'text-indigo-400 bg-indigo-500/10'
          : 'text-white/50 hover:text-white/90 hover:bg-white/[0.06]',
        className
      )}
    >
      {children}
    </button>
  )
}

// ─── Voice Recording Wave ────────────────────────────────────────────────────────
function VoiceWave() {
  return (
    <div className="flex items-center gap-[2px] h-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-red-400"
          animate={{ height: [4, 12, 4] }}
          transition={{
            duration: 0.6 + i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════
export function MessageInput({
  onSendMessage,
  onStopGenerating,
  onFileAttach,
  onVoiceToggle,
  disabled = false,
  className,
  placeholder = 'Message Pulse…',
  maxHeight = 200,
  maxLength = 8000,
  suggestions,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [focused, setFocused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const trimmed = message.trim()
  const canSend = trimmed.length > 0 && !disabled && message.length <= maxLength
  const isOverLimit = message.length > maxLength
  const isNearLimit = message.length > maxLength * 0.9

  // ─── Auto-resize textarea ────────────────────────────────
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [maxHeight])

  useEffect(() => { resize() }, [message, resize])

  // ─── Send message ────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!canSend) return
    onSendMessage(trimmed)
    setMessage('')
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (el) {
        el.style.height = 'auto'
        el.focus()
      }
    })
  }, [canSend, trimmed, onSendMessage])

  // ─── Keyboard shortcuts ──────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // ─── Text change ─────────────────────────────────────────
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }, [])

  // ─── Suggestion click ────────────────────────────────────
  const handleSuggestion = useCallback((prompt: string) => {
    setMessage(prompt)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }, [])

  // ─── File attach ─────────────────────────────────────────
  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileAttach?.(e.target.files)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [onFileAttach])

  // ─── Voice ───────────────────────────────────────────────
  const handleVoiceToggle = useCallback(() => {
    const next = !isRecording
    setIsRecording(next)
    onVoiceToggle?.(next)
  }, [isRecording, onVoiceToggle])

  // ─── Auto-focus on mount ─────────────────────────────────
  useEffect(() => {
    if (!disabled) textareaRef.current?.focus()
  }, [disabled])

  // Determine which button to show (send / stop / mic)
  const showStopButton = disabled && onStopGenerating
  const showSendButton = trimmed.length > 0 && !disabled
  const showMicButton = !showStopButton && !showSendButton

  return (
    <div className={cn('relative w-full max-w-3xl mx-auto px-4', className)}>

      {/* ── Suggestion Chips ──────────────────────────── */}
      <AnimatePresence>
        {suggestions && suggestions.length > 0 && !disabled && message.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {suggestions.map((s, i) => (
              <SuggestionChip
                key={i}
                label={s.label}
                icon={s.icon}
                onClick={() => handleSuggestion(s.prompt)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Input Container - NO border, NO background ── */}
      <div
        className={cn(
          'relative rounded-3xl transition-all duration-200',
          'bg-transparent',
          focused
            ? 'shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_8px_32px_rgba(0,0,0,0.4)]'
            : 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
        )}
      >
        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.txt,.doc,.docx,.csv,.md,.json"
        />

        <div className="flex items-end gap-1 px-2 py-1.5">
          {/* Left: Attach button */}
          <IconButton
            onClick={handleFileClick}
            disabled={disabled}
            aria-label="Attach files"
            title="Attach files"
          >
            <I.Paperclip />
          </IconButton>

          {/* Textarea */}
          <div className="flex-1 relative py-2">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              maxLength={maxLength + 500}
              className={cn(
                'w-full bg-transparent',
                'text-[15px] text-white/90 placeholder:text-white/30',
                'leading-6',
                'resize-none outline-none',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                '[scrollbar-width:thin]',
                '[scrollbar-color:rgba(255,255,255,0.1)_transparent]'
              )}
              style={{
                maxHeight: `${maxHeight}px`,
                minHeight: '24px',
              }}
            />
          </div>

          {/* Right: Action button (Send / Stop / Mic) */}
          <div className="flex items-center gap-0.5">
            {/* Character count (only near limit) */}
            <AnimatePresence>
              {isNearLimit && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    'text-[11px] tabular-nums mr-2 self-center',
                    isOverLimit ? 'text-red-400' : 'text-amber-400'
                  )}
                >
                  {maxLength - message.length}
                </motion.span>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              {showStopButton ? (
                <motion.button
                  key="stop"
                  type="button"
                  onClick={onStopGenerating}
                  aria-label="Stop generating"
                  title="Stop generating"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 transition-colors"
                >
                  <I.Stop />
                </motion.button>
              ) : showSendButton ? (
                <motion.button
                  key="send"
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  aria-label="Send message"
                  title="Send (↵)"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                    canSend
                      ? 'bg-white text-black hover:bg-white/90 active:scale-95'
                      : 'bg-white/[0.08] text-white/30 cursor-not-allowed'
                  )}
                >
                  <I.ArrowUp />
                </motion.button>
              ) : showMicButton ? (
                <motion.div
                  key="mic"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <IconButton
                    onClick={handleVoiceToggle}
                    disabled={disabled}
                    active={isRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Voice input'}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                    className={isRecording ? 'text-red-400 bg-red-500/10' : ''}
                  >
                    {isRecording ? <VoiceWave /> : <I.Mic />}
                  </IconButton>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}