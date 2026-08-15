// src/components/Chat/MessageInput.tsx
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

// Types
interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  maxHeight?: number
}

// Icons
function PaperclipIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <rect x="1" y="1" width="10" height="10" rx="2" />
    </svg>
  )
}

// Inline tooltip
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enter = () => { timer.current = setTimeout(() => setShow(true), 500) }
  const leave = () => {
    if (timer.current) clearTimeout(timer.current)
    setShow(false)
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.94 }}
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

// Toolbar icon button
function ToolBtn({
  onClick,
  tooltip,
  children,
  active = false,
  className = '',
  'aria-label': ariaLabel,
}: {
  onClick?: () => void
  tooltip: string
  children: React.ReactNode
  active?: boolean
  className?: string
  'aria-label': string
}) {
  return (
    <Tip label={tooltip}>
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
          'transition-colors duration-150',
          active
            ? 'text-indigo-400 bg-indigo-500/10'
            : 'text-white/25 hover:text-white/60 hover:bg-white/[0.06]',
          className
        )}
      >
        {children}
      </motion.button>
    </Tip>
  )
}

// Character count indicator
function CharCount({ count, limit }: { count: number; limit: number }) {
  if (count < limit * 0.7) return null

  const pct   = count / limit
  const color = pct > 0.95 ? 'text-red-400' : pct > 0.85 ? 'text-amber-400' : 'text-white/20'

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('text-[9px] font-mono tabular-nums', color)}
    >
      {count}/{limit}
    </motion.span>
  )
}

// Main component
export function MessageInput({
  onSendMessage,
  disabled = false,
  className,
  placeholder = 'Message Pulse…',
  maxHeight = 180,
}: MessageInputProps) {
  const [message,  setMessage]  = useState('')
  const [focused,  setFocused]  = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const CHAR_LIMIT = 4000
  const canSend    = message.trim().length > 0 && !disabled && message.length <= CHAR_LIMIT

  // Auto-resize textarea
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [maxHeight])

  // Send
  const handleSend = useCallback(() => {
    if (!canSend) return
    onSendMessage(message.trim())
    setMessage('')
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    })
  }, [canSend, message, onSendMessage])

  // Keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      if (val.length <= CHAR_LIMIT) setMessage(val)
      resize()
    },
    [resize]
  )

  // Focus the textarea on mount
  useEffect(() => {
    if (!disabled) textareaRef.current?.focus()
  }, [disabled])

  return (
    <div className={cn('relative w-full max-w-3xl mx-auto', className)}>
      {/* Outer container */}
      <div
        className="relative rounded-2xl transition-all duration-300"
        style={{
          boxShadow: focused
            ? '0 0 0 1px rgba(99,102,241,0.25), 0 0 30px rgba(99,102,241,0.06)'
            : 'none',
        }}
      >
        {/* Focus gradient border */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), transparent, rgba(139,92,246,0.12))',
            opacity: focused ? 1 : 0,
          }}
        />

        {/* Inner card */}
        <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.07] overflow-hidden">
          {/* Focus top accent line */}
          <div
            className="absolute top-0 left-[15%] right-[15%] h-px transition-opacity duration-300"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)',
              opacity: focused ? 1 : 0,
            }}
          />

          {/* Text area row */}
          <div className="flex items-end gap-1.5 px-3 py-2.5">
            {/* Attach */}
            <ToolBtn
              onClick={() => {/* wire up file picker */}}
              tooltip="Attach file"
              aria-label="Attach file"
            >
              <PaperclipIcon />
            </ToolBtn>

            {/* Textarea */}
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
              className="
                flex-1 min-h-[36px] py-2 bg-transparent
                text-sm text-white/75 placeholder:text-white/20
                font-mono
                resize-none outline-none
                caret-indigo-400
                disabled:opacity-40 disabled:cursor-not-allowed
                [scrollbar-width:thin]
                [scrollbar-color:rgba(255,255,255,0.06)_transparent]
              "
              style={{ maxHeight: `${maxHeight}px` }}
            />

            {/* Voice */}
            <ToolBtn
              onClick={() => {/* wire up voice */}}
              tooltip="Voice input"
              aria-label="Voice input"
            >
              <MicIcon />
            </ToolBtn>

            {/* Send / Stop */}
            <AnimatePresence mode="wait">
              {disabled ? (
                <motion.div
                  key="stop"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Tip label="Stop generating">
                    <motion.button
                      type="button"
                      aria-label="Stop generating"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.9 }}
                      className="
                        w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                        bg-red-500/15 border border-red-500/25
                        text-red-400 hover:bg-red-500/25
                        transition-colors duration-150
                      "
                    >
                      <StopIcon />
                    </motion.button>
                  </Tip>
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Tip label={canSend ? 'Send message' : 'Type a message'}>
                    <motion.button
                      type="button"
                      onClick={handleSend}
                      disabled={!canSend}
                      aria-label="Send message"
                      whileHover={canSend ? { scale: 1.08 } : {}}
                      whileTap={canSend ? { scale: 0.9 } : {}}
                      className={cn(
                        'group relative overflow-hidden w-8 h-8 rounded-xl',
                        'flex items-center justify-center flex-shrink-0',
                        'transition-all duration-200',
                        'disabled:cursor-not-allowed',
                      )}
                      style={{
                        background: canSend
                          ? 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.4))'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${canSend ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: canSend
                          ? '0 0 16px rgba(99,102,241,0.2)'
                          : 'none',
                      }}
                    >
                      {/* Shimmer sweep */}
                      {canSend && (
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />
                      )}
                      <span
                        className="relative z-10 transition-colors duration-150"
                        style={{ color: canSend ? '#c7d2fe' : 'rgba(255,255,255,0.15)' }}
                      >
                        <SendIcon />
                      </span>
                    </motion.button>
                  </Tip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/[0.04]">
            {/* Keyboard hints */}
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

            {/* Right side: char count + model */}
            <div className="flex items-center gap-3">
              <CharCount count={message.length} limit={CHAR_LIMIT} />
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[9px] font-mono text-indigo-400/40">
                  Groq
                </span>
                <span className="text-[9px] font-mono text-white/15">·</span>
                <span className="text-[9px] font-mono text-emerald-400/40">
                  Fast
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar below input */}
      <AnimatePresence>
        {!disabled && message.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex items-center justify-center gap-3 mt-2 text-[10px] font-mono text-white/15"
          >
            <span>Powered by</span>
            <span className="text-emerald-400/50">Groq</span>
            <span className="w-px h-3 bg-white/[0.06]" />
            <span className="text-indigo-400/30">⚡</span>
            <span>Fast AI responses</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}