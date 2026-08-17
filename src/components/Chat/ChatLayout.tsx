/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Chat/ChatLayout.tsx
'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { MessageInput } from './MessageInput'
import { useAIStream } from '@/hooks/useAIStream'
import { useToast } from '@/components/UI/Toast'
import type { Conversation } from '@/components/Sidebar/ConversationItem'

// Types
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: number
  model?: string
  isError?: boolean
  isStreaming?: boolean
  editedAt?: Date
}

type AssistantState = 'idle' | 'thinking' | 'typing' | 'listening'

interface ChatLayoutProps {
  className?: string
  initialTitle?: string
}

// Storage keys
const STORAGE_KEYS = {
  CONVERSATIONS: 'pulse_conversations',
  ACTIVE_ID: 'pulse_active_conversation_id',
  MESSAGES: 'pulse_messages_',
}

// Load from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Handle Date objects for arrays
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.timestamp) {
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })) as T
      }
      return parsed as T
    }
  } catch (error) {
    console.error('Failed to load from storage:', error)
  }
  return defaultValue
}

// Save to localStorage
function saveToStorage(key: string, data: any) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to storage:', error)
  }
}

// Mobile backdrop
function MobileBackdrop({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  )
}

// Empty state
function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  const suggestions = [
    { label: 'Explain a concept', text: 'Explain how React Server Components work' },
    { label: 'Write some code', text: 'Write a TypeScript utility to deep-merge objects' },
    { label: 'Analyse data', text: 'What are the key trends in AI adoption for 2024?' },
    { label: 'Creative writing', text: 'Write a short story about a robot learning to dream' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center flex-1 px-6 pb-8 gap-8"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-indigo-500/[0.15]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border border-dashed border-violet-500/[0.1]"
          />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center">
            <svg
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="rgba(99,102,241,0.7)"
              strokeWidth="1.6" strokeLinecap="round"
            >
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04" />
            </svg>
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white/80 tracking-tight">
            How can I help you today?
          </h2>
          <p className="text-sm text-white/30 font-mono max-w-xs">
            Ask anything — I think, learn, and deliver.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.35 }}
            onClick={() => onSuggestion(s.text)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="group flex flex-col items-start gap-1 px-4 py-3.5 rounded-2xl text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-indigo-500/25 transition-all duration-200"
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-indigo-400/60 group-hover:text-indigo-400/90 transition-colors">
              {s.label}
            </span>
            <span className="text-xs text-white/35 group-hover:text-white/55 transition-colors leading-snug">
              {s.text}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// Token budget indicator - FIXED hydration
function TokenBudget({ used, limit = 128_000 }: { used: number; limit?: number }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pct = Math.min((used / limit) * 100, 100)
  const color =
    pct > 85 ? 'bg-red-500'
    : pct > 60 ? 'bg-amber-500'
    : 'bg-indigo-500'

  if (used === 0) return null

  // During SSR, render a static version without animations
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/[0.04] bg-white/[0.005]">
        <div className="flex-1 h-px bg-white/[0.06] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${color}`} 
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[9px] font-mono text-white/20 flex-shrink-0 tabular-nums">
          {used.toLocaleString()} / {(limit / 1000).toFixed(0)}k ctx
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/[0.04] bg-white/[0.005]">
      <div className="flex-1 h-px bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
      <span className="text-[9px] font-mono text-white/20 flex-shrink-0 tabular-nums">
        {used.toLocaleString()} / {(limit / 1000).toFixed(0)}k ctx
      </span>
    </div>
  )
}

// Main Layout
export function ChatLayout({ className, initialTitle = 'New Chat' }: ChatLayoutProps) {
  const [mounted, setMounted] = useState(false)
  
  // Load from localStorage on mount
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>(() => 
    loadFromStorage(STORAGE_KEYS.CONVERSATIONS, [])
  )
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(() => 
    loadFromStorage(STORAGE_KEYS.ACTIVE_ID, undefined)
  )
  const [messages, setMessages] = useState<Message[]>(() => {
    const activeId = loadFromStorage<string | undefined>(STORAGE_KEYS.ACTIVE_ID, undefined)
    if (activeId) {
      return loadFromStorage<Message[]>(`${STORAGE_KEYS.MESSAGES}${activeId}`, [])
    }
    return []
  })
  const [assistantState, setAssistantState] = useState<AssistantState>('idle')
  const [conversationTitle, setConversationTitle] = useState(initialTitle)
  const { streamMessage, isStreaming, streamedContent, clearHistory, reset } = useAIStream()
  const { addToast } = useToast()
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingMessageIdRef = useRef<string | null>(null)
  const currentConversationIdRef = useRef<string | null>(null)

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversations)
  }, [conversations])

  // Save active conversation ID
  useEffect(() => {
    if (activeConversationId) {
      saveToStorage(STORAGE_KEYS.ACTIVE_ID, activeConversationId)
    }
  }, [activeConversationId])

  // Save messages for the active conversation
  useEffect(() => {
    if (activeConversationId) {
      saveToStorage(`${STORAGE_KEYS.MESSAGES}${activeConversationId}`, messages)
    }
  }, [activeConversationId, messages])

  // Set title when active conversation changes - FIXED with useMemo
  const title = useMemo(() => {
    if (activeConversationId) {
      const conv = conversations.find(c => c.id === activeConversationId)
      if (conv) {
        return conv.title
      }
      return 'New Chat'
    }
    return 'New Chat'
  }, [activeConversationId, conversations])

  // Update conversationTitle when title changes
  useEffect(() => {
    setConversationTitle(title)
  }, [title])

  // Clean up pending timeouts on unmount
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamedContent])

  const pushTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }, [])

  // Derived
  const totalTokens = messages.reduce((sum, m) => sum + (m.tokens ?? 0), 0)
  const isDisabled = assistantState !== 'idle' || isStreaming

  // Generate a concise title from user message
  const generateTitle = useCallback((content: string): string => {
    const clean = content.trim()
    if (!clean) return 'New Chat'
    
    const firstSentence = clean.split(/[.!?]/, 1)[0] || clean
    const truncated = firstSentence.slice(0, 30)
    
    if (truncated.length < firstSentence.length) {
      return truncated + '...'
    }
    
    const lastSpace = truncated.lastIndexOf(' ', 25)
    if (lastSpace > 15) {
      return truncated.slice(0, lastSpace) + '...'
    }
    
    return truncated
  }, [])

  // Create a new conversation
  const createNewConversation = useCallback((message?: string) => {
    const id = `conv-${Date.now()}`
    const title = message ? generateTitle(message) : 'New Chat'
    
    const newConversation: Conversation = {
      id,
      title,
      lastMessage: message ? message.slice(0, 100) : 'Start typing to begin…',
      timestamp: new Date(),
      model: 'Groq',
    }
    
    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(id)
    currentConversationIdRef.current = id
    
    if (message) {
      setConversationTitle(title)
    }
    
    return id
  }, [generateTitle])

  // Update conversation with new message
  const updateConversation = useCallback((id: string, message: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, lastMessage: message.slice(0, 100), timestamp: new Date() }
          : c
      )
    )
  }, [])

  // Update conversation title
  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, title }
          : c
      )
    )
    setConversationTitle(title)
  }, [])

  // Handle conversation selection
  const handleConversationSelect = useCallback((id: string) => {
    setActiveConversationId(id)
    setAssistantState('idle')
    const conv = conversations.find(c => c.id === id)
    if (conv) {
      setConversationTitle(conv.title)
    }
    // Load messages for this conversation
    const savedMessages = loadFromStorage<Message[]>(`${STORAGE_KEYS.MESSAGES}${id}`, [])
    setMessages(savedMessages)
    // Reset the conversation history in the AI stream
    clearHistory()
  }, [conversations, clearHistory])

  // Send message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (isDisabled || !content.trim()) return

      const ts = Date.now()
      let conversationId = activeConversationId
      const isNewConversation = !conversationId

      if (!conversationId) {
        conversationId = createNewConversation(content)
      }

      if (isNewConversation) {
        const newTitle = generateTitle(content)
        updateConversationTitle(conversationId, newTitle)
      }

      updateConversation(conversationId, content)

      const userMessage: Message = {
        id: `user-${ts}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        tokens: Math.ceil(content.trim().split(/\s+/).length * 1.35),
      }

      setMessages((prev) => [...prev, userMessage])

      const aiMessageId = `ai-${ts + 1}`
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        model: 'Groq',
      }
      setMessages((prev) => [...prev, aiMessage])
      streamingMessageIdRef.current = aiMessageId

      setAssistantState('thinking')
      pushTimeout(() => setAssistantState('typing'), 600)

      let fullResponse = ''

      try {
        await streamMessage(content, {
          onToken: (token) => {
            fullResponse += token
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + token }
                  : msg
              )
            )
          },
          onComplete: () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { 
                      ...msg, 
                      isStreaming: false,
                      tokens: Math.ceil(msg.content.split(/\s+/).length * 1.5)
                    }
                  : msg
              )
            )
            if (conversationId) {
              updateConversation(conversationId, fullResponse || 'No response')
            }
            setAssistantState('idle')
            streamingMessageIdRef.current = null
          },
          onError: (error) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      content: 'Sorry, I encountered an error. Please try again.',
                      isStreaming: false,
                      isError: true,
                    }
                  : msg
              )
            )
            setAssistantState('idle')
            streamingMessageIdRef.current = null
            addToast({
              title: 'Error',
              description: error.message || 'Failed to get response',
              type: 'error',
            })
          },
        })
      } catch (error) {
        console.error('Send message error:', error)
        setAssistantState('idle')
        streamingMessageIdRef.current = null
        addToast({
          title: 'Error',
          description: 'Failed to send message',
          type: 'error',
        })
      }
    },
    [isDisabled, activeConversationId, createNewConversation, generateTitle, updateConversationTitle, updateConversation, pushTimeout, streamMessage, addToast]
  )

  // Suggestion shortcut
  const handleSuggestion = useCallback(
    (text: string) => handleSendMessage(text),
    [handleSendMessage]
  )

  // Handle new chat
  const handleNewChat = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    streamingMessageIdRef.current = null
    
    const id = `conv-${Date.now()}`
    const newConversation: Conversation = {
      id,
      title: 'New Chat',
      lastMessage: 'Start typing to begin…',
      timestamp: new Date(),
      model: 'Groq',
    }
    
    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(id)
    currentConversationIdRef.current = id
    setMessages([])
    setConversationTitle('New Chat')
    setAssistantState('idle')
    clearHistory() // Clear conversation history
    
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
    
    addToast({
      title: 'New chat created',
      type: 'success',
    })
  }, [addToast, clearHistory])

  // Handle clear messages
  const handleClear = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setMessages([])
    setAssistantState('idle')
    setConversationTitle('New Chat')
    streamingMessageIdRef.current = null
    clearHistory() // Clear conversation history
    addToast({
      title: 'Messages cleared',
      type: 'success',
    })
  }, [addToast, clearHistory])

  // Handle delete conversation
  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter(c => c.id !== id))
    // Remove messages from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEYS.MESSAGES}${id}`)
    }
    if (activeConversationId === id) {
      setActiveConversationId(undefined)
      setMessages([])
      setConversationTitle('New Chat')
      clearHistory() // Clear conversation history
    }
    addToast({
      title: 'Conversation deleted',
      type: 'success',
    })
  }, [activeConversationId, addToast, clearHistory])

  const handleToggleSidebar = useCallback(
    () => setIsSidebarOpen((v) => !v),
    []
  )

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])

  const handleExport = useCallback(() => {
    if (messages.length === 0) {
      addToast({
        title: 'No messages to export',
        type: 'info',
      })
      return
    }
    const data = {
      title: conversationTitle,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        tokens: m.tokens,
        model: m.model,
      })),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pulse-chat-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast({
      title: 'Export successful',
      type: 'success',
    })
  }, [messages, conversationTitle, addToast])

  const handleSettings = useCallback(() => {
    addToast({
      title: 'Settings',
      description: 'Settings panel coming soon',
      type: 'info',
    })
  }, [addToast])

  // Don't render on server to prevent hydration mismatches
  if (!mounted) {
    return (
      <div
        className={cn(
          'flex h-screen overflow-hidden',
          'bg-[#050508]',
          className
        )}
      >
        {/* Static placeholder for SSR */}
        <div className="flex-1" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden',
        'bg-[#050508]',
        className
      )}
    >
      <MobileBackdrop
        visible={isSidebarOpen}
        onClose={closeSidebar}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        conversations={conversations}
        onConversationsUpdate={setConversations}
      />

      <div className="relative flex flex-col flex-1 min-w-0 min-h-0">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/[0.03] to-transparent pointer-events-none z-0" />

        <ChatHeader
          onToggleSidebar={handleToggleSidebar}
          conversationTitle={conversationTitle}
          assistantState={assistantState}
          onClear={handleClear}
          onExport={handleExport}
          onSettings={handleSettings}
          onSearch={() => {
            addToast({
              title: 'Search',
              description: 'Search functionality coming soon',
              type: 'info',
            })
          }}
        />

        <TokenBudget used={totalTokens} />

        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {messages.length === 0 && assistantState === 'idle' && !isStreaming ? (
              <EmptyState
                key="empty"
                onSuggestion={handleSuggestion}
              />
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1 min-h-0"
              >
                <ChatMessages
                  messages={messages}
                  isTyping={assistantState !== 'idle' || isStreaming}
                />
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 flex-shrink-0">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="px-3 py-3 sm:px-4 sm:py-4 bg-[#050508]/80 backdrop-blur-xl">
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={isDisabled}
            />
            <p className="text-center text-[10px] text-white/15 font-mono mt-2.5">
              Pulse can make mistakes — verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatLayout