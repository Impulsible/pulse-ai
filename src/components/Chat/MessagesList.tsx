/* eslint-disable react-hooks/immutability */
// src/components/Chat/MessagesList.tsx
'use client'

import { useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MessageBubble, type Message } from './MessageBubble'

interface MessagesListProps {
  messages: Message[]
  isStreaming?: boolean
  onRegenerate?: (id: string) => void
  onFeedback?: (id: string, kind: 'up' | 'down') => void
  onEdit?: (id: string, content: string) => void
  onCopy?: (id: string) => void
  username?: string
  avatar?: string
  messagesUsed?: number
  messagesLimit?: number
  plan?: string
  autoScroll?: boolean
}

export function MessagesList({
  messages,
  isStreaming,
  onRegenerate,
  onFeedback,
  onEdit,
  onCopy,
  username,
  avatar,
  messagesUsed,
  messagesLimit,
  plan,
  autoScroll = true,
}: MessagesListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages / streaming updates
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, autoScroll])

  // Track user message index for the usage meter
  let userMessageIndex = 0

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AnimatePresence initial={false}>
        {messages.map((msg, i) => {
          const isLatest = i === messages.length - 1
          const isCurrentlyStreaming =
            isLatest && isStreaming && msg.role === 'assistant'

          if (msg.role === 'user') userMessageIndex += 1

          return (
            <MessageBubble
              key={msg.id}
              message={{
                ...msg,
                isStreaming: isCurrentlyStreaming,
              }}
              isLatest={isLatest}
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
              onEdit={onEdit}
              onCopy={onCopy}
              username={username}
              avatar={avatar}
              messagesUsed={messagesUsed}
              messagesLimit={messagesLimit}
              plan={plan}
              messageIndex={msg.role === 'user' ? userMessageIndex : undefined}
            />
          )
        })}
      </AnimatePresence>

      <div ref={bottomRef} className="h-4" />
    </div>
  )
}