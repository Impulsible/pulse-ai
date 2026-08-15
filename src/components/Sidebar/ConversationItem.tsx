// src/components/Sidebar/ConversationItem.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

// Types
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

// Icons
function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

// Inline Tooltip
function Tip({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
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
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none"
          >
            <div className="px-2 py-1 rounded-lg bg-[#111118] border border-white/[0.08] shadow-xl">
              <p className="text-[10px] font-mono text-white/50 whitespace-nowrap">{label}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Action button
function ActionBtn({
  onClick,
  tooltip,
  children,
  destructive = false,
  active = false,
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
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-150',
          destructive
            ? 'text-white/25 hover:text-red-400 hover:bg-red-500/[0.12]'
            : active
            ? 'text-indigo-400 bg-indigo-500/10'
            : 'text-white/25 hover:text-white/70 hover:bg-white/[0.06]'
        )}
      >
        {children}
      </motion.button>
    </Tip>
  )
}

// Inline rename input
function RenameInput({
  initial,
  onCommit,
  onCancel,
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
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={commit}
      className="w-full text-xs font-semibold bg-transparent text-white/80 outline-none border-b border-indigo-500/40 pb-px caret-indigo-400"
      maxLength={80}
    />
  )
}

// Delete confirm - IMPROVED VERSION
function DeleteConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -4 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="absolute right-0 top-0 z-50"
      style={{ transformOrigin: 'top right' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mt-1 mr-1 rounded-xl bg-[#0e0e16]/95 border border-red-500/20 shadow-2xl shadow-black/60 p-3 backdrop-blur-xl min-w-[140px]">
        <p className="text-[11px] font-mono text-white/50 mb-3 text-center">
          Delete this chat?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-[10px] font-mono py-1.5 px-2 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white/70 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onConfirm()
            }}
            className="flex-1 text-[10px] font-mono py-1.5 px-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Time formatter
function formatTime(date: Date): string {
  const now  = new Date()
  const diff = now.getTime() - date.getTime()
  const mins  = diff / 60_000
  const hours = diff / 3_600_000
  const days  = diff / 86_400_000

  if (mins  < 1)  return 'just now'
  if (hours < 1)  return `${Math.floor(mins)}m`
  if (days  < 1)  return `${Math.floor(hours)}h`
  if (days  < 7)  return date.toLocaleDateString('en-US', { weekday: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Main component
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

  const handlePin = useCallback(
    (e: React.MouseEvent) => { 
      e.stopPropagation()
      if (!confirmDelete) onPin(conversation.id)
    },
    [onPin, conversation.id, confirmDelete]
  )

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => { 
      e.stopPropagation()
      setConfirmDelete(true)
    },
    []
  )

  const handleDeleteCancel = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setConfirmDelete(false)
  }, [])

  const handleDeleteConfirm = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setConfirmDelete(false)
    onDelete(conversation.id)
  }, [onDelete, conversation.id])

  const handleRenameCommit = useCallback(
    (title: string) => {
      onRename?.(conversation.id, title)
      setIsRenaming(false)
    },
    [onRename, conversation.id]
  )

  const handleRenameClick = useCallback(
    (e: React.MouseEvent) => { 
      e.stopPropagation()
      setIsRenaming(true)
    },
    []
  )

  const showActions = (hovered || isActive) && !isRenaming && !confirmDelete

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6, scale: 0.97 }}
      transition={{
        delay: index * 0.03,
        duration: 0.28,
        ease: [0.23, 1, 0.32, 1],
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { 
        setHovered(false)
        // Don't auto-close delete confirm on mouse leave - let user decide
      }}
      className="relative group"
    >
      {/* Main row */}
      <motion.button
        onClick={handleSelect}
        whileHover={{ x: 1 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50',
          isActive
            ? 'bg-indigo-500/[0.08] border border-indigo-500/[0.15]'
            : 'border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'
        )}
      >
        {/* Active left bar */}
        {isActive && (
          <motion.div
            layoutId="activeBar"
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-indigo-400"
          />
        )}

        {/* Top row: title + timestamp */}
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
                  <span className="text-indigo-400/60 flex-shrink-0">
                    <PinIcon filled />
                  </span>
                )}
                <h3
                  className={cn(
                    'text-xs font-semibold truncate transition-colors duration-200',
                    isActive ? 'text-white/90' : 'text-white/55 group-hover:text-white/75'
                  )}
                >
                  {conversation.title}
                </h3>
              </div>
            )}
          </div>

          {/* Timestamp — hide when actions are visible to avoid crowding */}
          <AnimatePresence mode="wait">
            {!showActions && !confirmDelete && (
              <motion.span
                key="timestamp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex-shrink-0 text-[10px] font-mono text-white/20 mt-px"
              >
                {formatTime(conversation.timestamp)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Last message preview */}
        {!isRenaming && (
          <p
            className={cn(
              'text-[11px] truncate mt-0.5 transition-colors duration-200',
              isActive ? 'text-white/35' : 'text-white/20 group-hover:text-white/28'
            )}
          >
            {conversation.lastMessage}
          </p>
        )}

        {/* Model tag */}
        {conversation.model && isActive && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-indigo-400/70"
          >
            {conversation.model}
          </motion.span>
        )}
      </motion.button>

      {/* Delete confirm popover - positioned absolutely over the item */}
      <AnimatePresence>
        {confirmDelete && (
          <DeleteConfirm
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}
      </AnimatePresence>

      {/* Action buttons — appear on hover/active */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-0.5 px-1 py-1 rounded-xl bg-[#0e0e16]/90 border border-white/[0.07] backdrop-blur-xl shadow-lg shadow-black/40">
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