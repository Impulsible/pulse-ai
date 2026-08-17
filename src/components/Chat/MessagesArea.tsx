// src/components/Chat/MessagesArea.tsx
'use client'

import { UserMessage } from './UserMessage'
import { AIMessage } from './AIMessage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  model?: string
}

interface MessagesAreaProps {
  messages: Message[]
  isStreaming?: boolean
  onRegenerate?: (messageId: string) => void
  onEdit?: (messageId: string, content: string) => void
  userAvatar?: string
  userName?: string
}

export function MessagesArea({
  messages,
  isStreaming,
  onRegenerate,
  onEdit,
  userAvatar,
  userName,
}: MessagesAreaProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1
        const showStreaming = isLast && isStreaming && msg.role === 'assistant'

        return msg.role === 'user' ? (
          <UserMessage
            key={msg.id}
            content={msg.content}
            timestamp={msg.createdAt}
            avatar={userAvatar}
            username={userName}
            onEdit={onEdit ? (c) => onEdit(msg.id, c) : undefined}
          />
        ) : (
          <AIMessage
            key={msg.id}
            content={msg.content}
            model={msg.model ?? 'Pulse AI'}
            timestamp={msg.createdAt}
            isStreaming={showStreaming}
            onRegenerate={onRegenerate ? () => onRegenerate(msg.id) : undefined}
          />
        )
      })}
    </div>
  )
}