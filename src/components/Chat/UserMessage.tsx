/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
// src/components/Chat/UserMessage.tsx
'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

interface UserMessageProps {
  content: string
  timestamp?: string
  avatar?: string
  username?: string
  className?: string
  onEdit?: (content: string) => void
}

// Icons
function UserIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// Inline Code
function renderContent(text: string) {
  const parts = text.split(/(`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded-md border border-white/[0.15] bg-white/[0.12] px-1.5 py-0.5 font-mono text-[0.82em] text-white/95"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// Avatar
function UserAvatar({ avatar, username }: { avatar?: string; username?: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username ?? 'User'}
        className="h-10 w-10 flex-shrink-0 rounded-2xl object-cover ring-2 ring-white/[0.08]"
      />
    )
  }

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'YO'

  return (
    <div className="relative h-10 w-10 flex-shrink-0">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 blur-md" />
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.12] bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
        {username ? (
          <span className="text-xs font-bold text-white/80 font-mono">{initials}</span>
        ) : (
          <span className="text-white/60">
            <UserIcon />
          </span>
        )}
      </div>
    </div>
  )
}

// Edit Mode
function EditMode({
  value,
  onSave,
  onCancel,
}: {
  value: string
  onSave: (content: string) => void
  onCancel: () => void
}) {
  const [editValue, setEditValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editValue.trim() && editValue !== value) {
        onSave(editValue.trim())
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={Math.min(editValue.split('\n').length, 6)}
        className="w-full rounded-xl bg-[#0b0b12] border border-indigo-500/30 px-4 py-3 text-sm text-white/80 font-mono resize-none focus:outline-none focus:border-indigo-400/50"
      />
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors text-xs font-mono"
        >
          <XIcon />
        </button>
        <button
          onClick={() => {
            if (editValue.trim() && editValue !== value) {
              onSave(editValue.trim())
            }
          }}
          disabled={!editValue.trim() || editValue === value}
          className="px-4 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-mono flex items-center gap-1.5"
        >
          <CheckIcon />
          save
        </button>
      </div>
    </div>
  )
}

// Main Component
export const UserMessage = memo(function UserMessage({
  content,
  timestamp,
  avatar,
  username,
  className,
  onEdit,
}: UserMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const isMultiLine = content.includes('\n') || content.length > 120
  const isEmpty = content.trim().length === 0

  const handleSave = (newContent: string) => {
    onEdit?.(newContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={cn('flex items-end justify-end gap-3', className)}
    >
      <div className="flex min-w-0 max-w-[80%] flex-col items-end gap-1.5">
        {(username || timestamp) && (
          <div className="flex items-center gap-2 px-1">
            {username && (
              <span className="text-[10px] font-mono font-semibold text-white/35">
                {username}
              </span>
            )}
            {timestamp && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-white/18">
                <ClockIcon />
                {timestamp}
              </span>
            )}
          </div>
        )}

        <div className="group relative">
          <div className="absolute -inset-px rounded-3xl rounded-br-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/20 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />

          <div
            className={cn(
              'relative overflow-hidden rounded-3xl rounded-br-lg',
              'bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600',
              'border border-white/[0.12]',
              'shadow-[0_4px_24px_rgba(99,102,241,0.3)]',
              'transition-shadow duration-300 group-hover:shadow-[0_6px_32px_rgba(99,102,241,0.42)]'
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />

            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="absolute left-[20%] right-[20%] top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className={cn('relative', isMultiLine ? 'px-4 py-3.5 sm:px-5' : 'px-4 py-3')}>
              {isEditing ? (
                <EditMode
                  value={content}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <>
                  {isEmpty ? (
                    <span className="text-sm italic text-white/40">Empty message</span>
                  ) : (
                    <p
                      className={cn(
                        'whitespace-pre-wrap break-words font-sans leading-7 text-white/95',
                        isMultiLine ? 'text-sm' : 'text-sm'
                      )}
                    >
                      {renderContent(content)}
                    </p>
                  )}

                  {/* Edit button - only show if onEdit is provided */}
                  {onEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg bg-[#0b0b12] border border-white/[0.08] text-white/25 hover:text-white/60 hover:bg-white/[0.05]"
                    >
                      <EditIcon />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>

          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 overflow-hidden rounded-br-lg">
            <div className="h-full w-full bg-gradient-to-br from-violet-600 to-purple-600" />
          </div>
        </div>

        {content.length > 300 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="px-1 text-[9px] font-mono text-white/18"
          >
            {content.length} chars
          </motion.p>
        )}
      </div>

      <div className="flex-shrink-0 pt-0.5">
        <UserAvatar avatar={avatar} username={username} />
      </div>
    </motion.article>
  )
})