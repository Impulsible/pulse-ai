// src/components/Sidebar/ConversationItem.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────────────────── */
export interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  isPinned?: boolean
  isActive?: boolean
  messageCount?: number
  model?: string
}

interface ConversationItemProps {
  conversation: Conversation
  isActive?: boolean
  onSelect: (id: string) => void
  onPin: (id: string) => void
  onDelete: (id: string) => void
  onRename?: (id: string, title: string) => void
  index?: number
}

/* ─────────────────────────────────────────────────────────────────────────────
   MODEL LABEL NORMALIZER
   ───────────────────────────────────────────────────────────────────────────── */
function friendlyModelName(model?: string): string {
  if (!model) return 'Pulse AI'
  const lower = model.toLowerCase().trim()

  const legacyPatterns = [
    'groq',
    'openai',
    'gpt',
    'llama',
    'mixtral',
    'gemma',
    'claude',
    'instant',
    'oss',
  ]

  if (legacyPatterns.some((p) => lower.includes(p))) {
    return 'Pulse AI'
  }
  return model
}

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
   ───────────────────────────────────────────────────────────────────────────── */
function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOOLTIP
   ───────────────────────────────────────────────────────────────────────────── */
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
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.92 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-[60] pointer-events-none"
          >
            <div className="px-2 py-1 rounded-md bg-[#0a0a12] border border-white/[0.08] shadow-2xl shadow-black/60">
              <p className="text-[9.5px] font-mono text-white/60 whitespace-nowrap tracking-wide">
                {label}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   ACTION BUTTON
   ───────────────────────────────────────────────────────────────────────────── */
function ActionBtn({
  onClick, tooltip, children, destructive = false, active = false,
}: {
  onClick: (e: React.MouseEvent) => void
  tooltip: string
  children: React.ReactNode
  destructive?: boolean
  active?: boolean
}) {
  return (
    <Tip label={tooltip}>
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150',
          destructive
            ? 'text-white/30 hover:text-red-400 hover:bg-red-500/[0.12]'
            : active
            ? 'text-indigo-300 bg-indigo-500/15'
            : 'text-white/30 hover:text-white/80 hover:bg-white/[0.06]'
        )}
      >
        {children}
      </motion.button>
    </Tip>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE RENAME
   ───────────────────────────────────────────────────────────────────────────── */
function RenameInput({
  initial, onCommit, onCancel,
}: {
  initial: string
  onCommit: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const commit = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== initial) onCommit(trimmed)
    else onCancel()
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  { e.preventDefault(); commit() }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        className="
          w-full text-[13px] font-semibold bg-transparent
          text-white/90 outline-none
          border-b border-indigo-500/50 pb-0.5
          caret-indigo-400
          focus:border-indigo-400
        "
        maxLength={80}
      />
      <span className="absolute -bottom-4 left-0 text-[8px] font-mono text-white/25 tracking-wider">
        ↵ save · esc cancel
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE CONFIRMATION
   ───────────────────────────────────────────────────────────────────────────── */
function DeleteConfirm({
  onConfirm, onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="absolute right-1 top-1 z-50"
      style={{ transformOrigin: 'top right' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="
        rounded-xl bg-[#0b0b14]/95 backdrop-blur-2xl
        border border-red-500/25
        shadow-[0_10px_40px_-8px_rgba(220,38,38,0.35),0_0_0_1px_rgba(220,38,38,0.05)]
        p-2.5 min-w-[168px]
      ">
        <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
          <div className="w-5 h-5 rounded-md bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <TrashIcon />
          </div>
          <p className="text-[10.5px] font-medium text-white/70">
            Delete conversation?
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onCancel}
            className="
              flex-1 text-[10px] font-mono py-1.5 rounded-md
              bg-white/[0.03] border border-white/[0.08]
              text-white/45 hover:text-white/80 hover:bg-white/[0.06]
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm() }}
            className="
              flex-1 text-[10px] font-mono py-1.5 rounded-md
              bg-gradient-to-b from-red-500/25 to-red-500/15
              border border-red-500/40
              text-red-300 hover:text-red-200 hover:from-red-500/35
              transition-colors
              shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
            "
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TIME FORMAT
   ───────────────────────────────────────────────────────────────────────────── */
function formatTime(date: Date): string {
  const now  = new Date()
  const diff = now.getTime() - date.getTime()
  const mins  = diff / 60_000
  const hours = diff / 3_600_000
  const days  = diff / 86_400_000

  if (mins  < 1)  return 'now'
  if (hours < 1)  return `${Math.floor(mins)}m`
  if (days  < 1)  return `${Math.floor(hours)}h`
  if (days  < 7)  return date.toLocaleDateString('en-US', { weekday: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
export function ConversationItem({
  conversation,
  isActive = false,
  onSelect,
  onPin,
  onDelete,
  onRename,
  index = 0,
}: ConversationItemProps) {
  const [hovered,       setHovered]       = useState(false)
  const [isRenaming,    setIsRenaming]    = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSelect = useCallback(() => {
    if (!isRenaming && !confirmDelete) onSelect(conversation.id)
  }, [isRenaming, confirmDelete, onSelect, conversation.id])

  const handlePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirmDelete) onPin(conversation.id)
  }, [onPin, conversation.id, confirmDelete])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDelete(true)
  }, [])

  const handleDeleteCancel = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setConfirmDelete(false)
  }, [])

  const handleDeleteConfirm = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setConfirmDelete(false)
    onDelete(conversation.id)
  }, [onDelete, conversation.id])

  const handleRenameCommit = useCallback((title: string) => {
    onRename?.(conversation.id, title)
    setIsRenaming(false)
  }, [onRename, conversation.id])

  const handleRenameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRenaming(true)
  }, [])

  // Only show actions if there's at least one action available
  const hasActions = onRename !== undefined || true // Pin and Delete are always available
  const showActions = (hovered || isActive) && !isRenaming && !confirmDelete && hasActions

  /* Per-item accent hue for variety */
  const accentSeed = conversation.id.charCodeAt(conversation.id.length - 1) % 3
  const accents = [
    { dot: 'bg-indigo-400', ring: 'from-indigo-500/40', glow: 'bg-indigo-500/10' },
    { dot: 'bg-violet-400', ring: 'from-violet-500/40', glow: 'bg-violet-500/10' },
    { dot: 'bg-sky-400',    ring: 'from-sky-500/40',    glow: 'bg-sky-500/10'    },
  ]
  const accent = accents[accentSeed]

  /* Normalize model name */
  const displayModel = friendlyModelName(conversation.model)

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -4, scale: 0.97 }}
      transition={{
        delay: index * 0.025,
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1],
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group px-1.5"
    >
      {/* Main row */}
      <motion.button
        onClick={handleSelect}
        whileHover={{ x: 1.5 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={cn(
          'relative w-full text-left rounded-xl px-3 py-2.5',
          'transition-all duration-250',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50',
          'overflow-hidden',
          isActive
            ? 'bg-gradient-to-r from-indigo-500/[0.09] via-indigo-500/[0.05] to-transparent border border-indigo-500/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
            : 'border border-transparent hover:bg-white/[0.03] hover:border-white/[0.05]'
        )}
      >
        {/* Active state — glowing left rail */}
        {isActive && (
          <>
            <motion.div
              layoutId="activeBar"
              className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full bg-gradient-to-b from-indigo-400 via-indigo-300 to-indigo-500 shadow-[0_0_8px_rgba(129,140,248,0.6)]"
            />
            <div className={cn(
              'absolute -left-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-2xl pointer-events-none',
              accent.glow
            )} />
          </>
        )}

        {/* Hover shimmer sweep */}
        {hovered && !isActive && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '200%', opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none"
          />
        )}

        {/* Content */}
        <div className="relative flex items-start gap-2.5 min-w-0">
          {/* Left dot indicator */}
          <div className="flex-shrink-0 pt-1">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full transition-all duration-300',
              isActive
                ? cn(accent.dot, 'shadow-[0_0_6px_currentColor]')
                : 'bg-white/15 group-hover:bg-white/30'
            )} />
          </div>

          {/* Main content column */}
          <div className="flex-1 min-w-0">
            {/* Top: title + timestamp */}
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <RenameInput
                    initial={conversation.title}
                    onCommit={handleRenameCommit}
                    onCancel={() => setIsRenaming(false)}
                  />
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    {conversation.isPinned && (
                      <span className="text-indigo-400/70 flex-shrink-0">
                        <PinIcon filled />
                      </span>
                    )}
                    <h3 className={cn(
                      'text-[13px] font-semibold truncate transition-colors duration-200 tracking-tight',
                      isActive
                        ? 'text-white/95'
                        : 'text-white/60 group-hover:text-white/85'
                    )}>
                      {conversation.title}
                    </h3>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <AnimatePresence mode="wait">
                {!showActions && !confirmDelete && !isRenaming && (
                  <motion.span
                    key="timestamp"
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ duration: 0.14 }}
                    className={cn(
                      'flex-shrink-0 text-[10px] font-mono mt-px tracking-wide',
                      isActive ? 'text-white/40' : 'text-white/25'
                    )}
                  >
                    {formatTime(conversation.timestamp)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Last message preview */}
            {!isRenaming && (
              <p className={cn(
                'text-[11.5px] truncate mt-0.5 transition-colors duration-200 leading-snug',
                isActive
                  ? 'text-white/45'
                  : 'text-white/28 group-hover:text-white/40'
              )}>
                {conversation.lastMessage}
              </p>
            )}

            {/* ── Model chip + metadata ── */}
            {!isRenaming && isActive && (
              <motion.div
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-1.5 mt-1.5"
              >
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-[9px] font-mono px-2 py-0.5 rounded-md',
                  'bg-gradient-to-b from-indigo-500/15 to-indigo-500/5',
                  'border border-indigo-500/20',
                  'text-indigo-300/85',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                  'uppercase tracking-wider font-semibold'
                )}>
                  {/* Live pulsing dot */}
                  <span className="relative flex h-1 w-1">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-1 w-1 rounded-full bg-indigo-400" />
                  </span>
                  {displayModel}
                </span>

                {conversation.messageCount !== undefined && conversation.messageCount > 0 && (
                  <span className="text-[9px] font-mono text-white/30 tracking-wider">
                    {conversation.messageCount} msgs
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.button>

      {/* Delete confirmation popover */}
      <AnimatePresence>
        {confirmDelete && (
          <DeleteConfirm
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}
      </AnimatePresence>

      {/* Floating action toolbar */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, x: 4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.88, x: 4 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="
              flex items-center gap-0.5 p-1 rounded-xl
              bg-[#0a0a14]/90 backdrop-blur-2xl
              border border-white/[0.08]
              shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]
            ">
              {onRename && (
                <ActionBtn onClick={handleRenameClick} tooltip="Rename">
                  <PencilIcon />
                </ActionBtn>
              )}
              <ActionBtn
                onClick={handlePin}
                tooltip={conversation.isPinned ? 'Unpin' : 'Pin'}
                active={conversation.isPinned}
              >
                <PinIcon filled={!!conversation.isPinned} />
              </ActionBtn>

              <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

              <ActionBtn
                onClick={handleDeleteClick}
                tooltip="Delete"
                destructive
              >
                <TrashIcon />
              </ActionBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}