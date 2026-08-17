
/* eslint-disable react-hooks/rules-of-hooks */
// src/components/Chat/MessageBubble.tsx
'use client'

import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { UserMessage } from './UserMessage'
import { AIMessage } from './AIMessage'

// ─── Types ───────────────────────────────────────────────────────────────────────
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date | string
  tokens?: number
  model?: string
  isError?: boolean
  editedAt?: Date | string
  isStreaming?: boolean
}

interface MessageBubbleProps {
  message: Message
  isLatest?: boolean
  onRegenerate?: (id: string) => void
  onFeedback?: (id: string, kind: 'up' | 'down') => void
  onEdit?: (id: string, content: string) => void
  onCopy?: (id: string) => void
  /** User info (from auth context) */
  username?: string
  avatar?: string
  /** Plan / usage — for free-tier meter on user messages */
  messagesUsed?: number
  messagesLimit?: number
  plan?: string
  messageIndex?: number
  className?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────
function toISOString(date: Date | string): string {
  if (typeof date === 'string') return date
  return date.toISOString()
}

// ─── System Message (info banner) ────────────────────────────────────────────────
function SystemMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-center px-4 py-3"
    >
      <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#0a0a0f]/50 px-3 py-1.5 backdrop-blur-sm">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-[#6366f1]/60">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-[11px] text-white/40">{content}</span>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════════
export const MessageBubble = memo(function MessageBubble({
  message,
  isLatest = false,
  onRegenerate,
  onFeedback,
  onEdit,
  onCopy,
  username,
  avatar,
  messagesUsed,
  messagesLimit,
  plan,
  messageIndex,
  className,
}: MessageBubbleProps) {
  // ─── System messages ─────────────────────────────────────
  if (message.role === 'system') {
    return <SystemMessage content={message.content} />
  }

  const handleEdit = useCallback(
    (content: string) => onEdit?.(message.id, content),
    [message.id, onEdit]
  )

  const handleRegenerate = useCallback(
    () => onRegenerate?.(message.id),
    [message.id, onRegenerate]
  )

  const handleFeedback = useCallback(
    (kind: 'up' | 'down') => onFeedback?.(message.id, kind),
    [message.id, onFeedback]
  )

  const handleCopy = useCallback(
    () => onCopy?.(message.id),
    [message.id, onCopy]
  )

  const timestamp = toISOString(message.timestamp)

  // ─── User message ─────────────────────────────────────────────────
  if (message.role === 'user') {
    return (
      <div
        data-message-id={message.id}
        data-message-role="user"
        className={cn(
          'relative bg-transparent',
          className
        )}
      >
        <UserMessage
          content={message.content}
          timestamp={timestamp}
          username={username}
          avatar={avatar}
          onEdit={onEdit ? handleEdit : undefined}
          messagesUsed={messagesUsed}
          messagesLimit={messagesLimit}
          plan={plan}
          messageIndex={messageIndex}
        />
      </div>
    )
  }

  // ─── Assistant message ────────────────────────────────────────────
  return (
    <div
      data-message-id={message.id}
      data-message-role="assistant"
      className={cn(
        'relative bg-[#0a0a0f]/60',
        className
      )}
    >
      {/* Subtle "latest" indicator — thin left accent line */}
      {isLatest && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full bg-gradient-to-b from-[#6366f1]/50 via-[#8b5cf6]/40 to-transparent origin-top"
        />
      )}

      <AIMessage
        content={message.content}
        model={message.model}
        timestamp={timestamp}
        isStreaming={message.isStreaming}
        isError={message.isError}
        isLatest={isLatest}
        onRegenerate={onRegenerate ? handleRegenerate : undefined}
        onCopy={onCopy ? handleCopy : undefined}
        onFeedback={onFeedback ? handleFeedback : undefined}
      />
    </div>
  )
})