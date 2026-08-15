// src/components/Chat/MessageBubble.tsx
'use client'

import { useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { MessageActions } from './MessageActions'
import { UserMessage } from './UserMessage'
import { AIMessage } from './AIMessage'

// Types
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: number
  model?: string
  isError?: boolean
  editedAt?: Date
}

interface MessageBubbleProps {
  message: Message
  isLatest?: boolean
  onRegenerate?: (id: string) => void
  onFeedback?: (id: string, kind: 'up' | 'down') => void
  onEdit?: (id: string, content: string) => void
}

// Time formatter
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Avatar
function UserAvatar() {
  return (
    <div className="
      w-7 h-7 rounded-xl flex-shrink-0
      bg-gradient-to-br from-indigo-500/20 to-violet-500/20
      border border-indigo-500/20
      flex items-center justify-center
    ">
      <svg
        width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="rgba(165,180,252,0.7)"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  )
}

function AIAvatar() {
  return (
    <div className="
      w-7 h-7 rounded-xl flex-shrink-0
      bg-gradient-to-br from-indigo-500/15 to-violet-500/15
      border border-indigo-500/20
      flex items-center justify-center
    ">
      <svg
        width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="rgba(129,140,248,0.8)"
        strokeWidth="1.8" strokeLinecap="round"
      >
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04" />
      </svg>
    </div>
  )
}

// Meta bar
function MetaBar({
  timestamp,
  tokens,
  model,
  isUser,
  editedAt,
  isError,
}: {
  timestamp: Date
  tokens?: number
  model?: string
  isUser: boolean
  editedAt?: Date
  isError?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className={cn(
        'flex items-center gap-2 mt-1.5 px-1',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {isError && (
        <span className="text-[9px] font-mono text-red-400/70 bg-red-500/10 border border-red-500/15 px-1.5 py-0.5 rounded-md">
          error
        </span>
      )}

      {editedAt && (
        <span className="text-[9px] font-mono text-white/20">edited</span>
      )}

      {!isUser && model && (
        <span className="text-[9px] font-mono text-indigo-400/50 bg-indigo-500/[0.08] border border-indigo-500/10 px-1.5 py-0.5 rounded-md">
          {model}
        </span>
      )}

      {!isUser && tokens !== undefined && (
        <span className="flex items-center gap-1 text-[9px] font-mono text-white/15">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-400/30">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          {tokens}
        </span>
      )}

      <span className="text-[9px] font-mono text-white/15">
        {formatTime(timestamp)}
      </span>
    </motion.div>
  )
}

// System message
function SystemMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center py-2"
    >
      <div className="
        flex items-center gap-2 px-3 py-1.5 rounded-xl
        bg-white/[0.02] border border-white/[0.06]
        text-[10px] font-mono text-white/25
        max-w-sm text-center
      ">
        <svg width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {content}
      </div>
    </motion.div>
  )
}

// Main MessageBubble
export const MessageBubble = memo(function MessageBubble({
  message,
  isLatest = false,
  onRegenerate,
  onFeedback,
  onEdit,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  // Handle edit callback - moved before any conditional returns
  const handleEdit = useCallback((content: string) => {
    if (onEdit) {
      onEdit(message.id, content)
    }
  }, [message.id, onEdit])

  // System messages are always centred
  if (message.role === 'system') {
    return <SystemMessage content={message.content} />
  }

  const isUser = message.role === 'user'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group flex items-end gap-2.5 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="flex-shrink-0 mb-5"
      >
        {isUser ? <UserAvatar /> : <AIAvatar />}
      </motion.div>

      <div
        className={cn(
          'relative flex flex-col min-w-0',
          'max-w-[82%] md:max-w-[68%] lg:max-w-[60%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <AnimatePresence>
          {hovered && (
            <MessageActions
              message={message}
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
            />
          )}
        </AnimatePresence>

        {message.isError && (
          <div className="absolute -inset-px rounded-2xl border border-red-500/20 pointer-events-none" />
        )}

        {isLatest && !isUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -left-1 top-3 w-1 h-1 rounded-full bg-indigo-400"
          />
        )}

        {isUser ? (
          <UserMessage
            content={message.content}
            onEdit={handleEdit}
          />
        ) : (
          <AIMessage
            content={message.content}
            model={message.model}
            isError={message.isError}
          />
        )}

        <MetaBar
          timestamp={message.timestamp}
          tokens={message.tokens}
          model={message.model}
          isUser={isUser}
          editedAt={message.editedAt}
          isError={message.isError}
        />
      </div>
    </motion.div>
  )
})