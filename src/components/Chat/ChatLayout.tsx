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
import { useAIStream, type StreamMessage } from '@/hooks/useAIStream'
import { useToast } from '@/components/UI/Toast'
import { memorySystem } from '@/lib/ai/memory'
import type { Conversation } from '@/components/Sidebar/ConversationItem'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

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
  defaultModel?: string
  userName?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const DEFAULT_MODEL = 'gpt-4o'
const MODEL_LABEL = 'Pulse AI'
const MOBILE_BREAKPOINT = 1024 // lg

const STORAGE_KEYS = {
  CONVERSATIONS: 'pulse_conversations',
  ACTIVE_ID: 'pulse_active_conversation_id',
  MESSAGES: 'pulse_messages_',
  SIDEBAR_OPEN: 'pulse_sidebar_open',
  MODEL: 'pulse_model',
} as const

const SUGGESTIONS = [
  { label: 'Explain a concept', prompt: 'Explain how React Server Components work', icon: '💡' },
  { label: 'Write code',        prompt: 'Write a TypeScript utility to deep-merge objects', icon: '⚡' },
  { label: 'Analyze data',      prompt: 'What are the key trends in AI adoption for 2024?', icon: '📊' },
  { label: 'Creative writing',  prompt: 'Write a short story about a robot learning to dream', icon: '✨' },
]

/* ═══════════════════════════════════════════════════════════════════════════════
   STORAGE HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue
    const parsed = JSON.parse(stored)

    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.timestamp) {
      return parsed.map(
        (item: { timestamp: string; editedAt?: string; [key: string]: unknown }) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          editedAt: item.editedAt ? new Date(item.editedAt) : undefined,
        })
      ) as T
    }
    return parsed as T
  } catch (error) {
    console.error(`[Storage] Failed to load ${key}:`, error)
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(data)) }
  catch (error) { console.error(`[Storage] Failed to save ${key}:`, error) }
}

function removeFromStorage(key: string) {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(key) }
  catch (error) { console.error(`[Storage] Failed to remove ${key}:`, error) }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════════════════ */

function generateTitle(content: string): string {
  const clean = content.trim()
  if (!clean) return 'New Chat'

  const firstSentence = clean.split(/[.!?\n]/, 1)[0] || clean
  if (firstSentence.length <= 40) return firstSentence

  const truncated = firstSentence.slice(0, 40)
  const lastSpace = truncated.lastIndexOf(' ', 35)
  return lastSpace > 20 ? truncated.slice(0, lastSpace) + '…' : truncated + '…'
}

function estimateTokens(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).length * 1.35)
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Reactive viewport detection with SSR safety */
function useIsMobile(breakpoint = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    } else {
      // Safari fallback
      mql.addListener(handler)
      return () => mql.removeListener(handler)
    }
  }, [breakpoint])

  return isMobile
}

/** Get real viewport height (accounts for mobile browser chrome) */
function useDynamicViewportHeight() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)

    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOBILE BACKDROP
   ═══════════════════════════════════════════════════════════════════════════════ */

function MobileBackdrop({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EMPTY STATE — Mobile-first responsive
   ═══════════════════════════════════════════════════════════════════════════════ */

function EmptyState({
  onSuggestion,
  userName,
}: {
  onSuggestion: (prompt: string) => void
  userName?: string
}) {
  const greeting = userName
    ? `How can I help, ${userName}?`
    : 'How can I help you today?'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center flex-1 px-4 sm:px-6 pb-6 sm:pb-12 pt-8"
    >
      {/* Headline — scales from mobile → desktop */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="
          text-[22px] leading-tight
          sm:text-3xl
          md:text-4xl
          font-semibold text-white/85 tracking-tight text-center
          mb-2 sm:mb-3
          max-w-[280px] sm:max-w-none
        "
      >
        {greeting}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="
          text-[12px] sm:text-sm
          text-white/35
          mb-6 sm:mb-10
          text-center
          max-w-[280px] sm:max-w-none
          leading-relaxed
        "
      >
        Ask me anything — I can code, write, analyze, and more.
      </motion.p>

      {/* Suggestion grid — single column on mobile, 2×2 on tablet+ */}
      <div className="
        grid grid-cols-1 sm:grid-cols-2
        gap-2 sm:gap-2.5
        w-full max-w-[420px] sm:max-w-2xl
      ">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => onSuggestion(s.prompt)}
            className="
              group flex items-start gap-2.5 sm:gap-3
              px-3.5 sm:px-4 py-3 sm:py-3.5
              rounded-xl sm:rounded-2xl
              text-left
              bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.07]
              border border-white/[0.06] hover:border-white/[0.14]
              transition-all duration-150
              touch-manipulation
            "
          >
            <span className="text-base sm:text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
              {s.icon}
            </span>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="
                text-[13px] sm:text-sm
                font-medium text-white/80 group-hover:text-white/95
                transition-colors
              ">
                {s.label}
              </span>
              <span className="
                text-[11px] sm:text-[13px]
                text-white/40 group-hover:text-white/55
                transition-colors
                leading-snug line-clamp-2
              ">
                {s.prompt}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN LAYOUT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function ChatLayout({
  className,
  initialTitle = 'New Chat',
  defaultModel = DEFAULT_MODEL,
  userName: propUserName,
}: ChatLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()

  // Fix mobile viewport height issues (iOS Safari, mobile Chrome)
  useDynamicViewportHeight()

  useEffect(() => {
    setMounted(true)

    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      ;(window as any).memory = memorySystem
      ;(window as any).debugMemory = () => {
        const all = memorySystem.getAllMemories()
        console.group('🧠 Memory System State')
        console.log('Total memories:', all.length)
        console.log('Stats:', memorySystem.getStats())
        console.log('Context:\n', memorySystem.getContextualPrompt({ verbose: true }))
        console.table(
          all.map((m) => ({
            type: m.type,
            content: m.content,
            importance: m.importance.toFixed(2),
            confidence: m.confidence,
          }))
        )
        console.groupEnd()
      }
      console.log('💡 Debug helpers ready → window.memory, window.debugMemory()')
    }
  }, [])

  /* ─── Sidebar state — mobile-aware defaults ────────────────────── */
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = loadFromStorage<boolean | null>(STORAGE_KEYS.SIDEBAR_OPEN, null)
    if (saved !== null && window.innerWidth >= MOBILE_BREAKPOINT) {
      setIsSidebarOpen(saved)
    } else {
      // Mobile: always closed on mount, Desktop: open by default
      setIsSidebarOpen(window.innerWidth >= MOBILE_BREAKPOINT)
    }
  }, [])

  // Only save sidebar state on desktop (mobile always starts closed)
  useEffect(() => {
    if (mounted && !isMobile) saveToStorage(STORAGE_KEYS.SIDEBAR_OPEN, isSidebarOpen)
  }, [isSidebarOpen, mounted, isMobile])

  // Auto-close sidebar when switching to mobile viewport
  useEffect(() => {
    if (mounted && isMobile && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
    // Auto-open when switching to desktop (respect stored preference)
    if (mounted && !isMobile) {
      const saved = loadFromStorage<boolean | null>(STORAGE_KEYS.SIDEBAR_OPEN, null)
      if (saved === null || saved === true) setIsSidebarOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, mounted])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isMobile && isSidebarOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = originalStyle }
    }
  }, [isMobile, isSidebarOpen])

  /* ─── Conversations state ────────────────────────────────────────── */
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadFromStorage(STORAGE_KEYS.CONVERSATIONS, [])
  )

  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVE_ID, undefined)
  )

  const [messages, setMessages] = useState<Message[]>(() => {
    const activeId = loadFromStorage<string | undefined>(STORAGE_KEYS.ACTIVE_ID, undefined)
    if (activeId) return loadFromStorage<Message[]>(`${STORAGE_KEYS.MESSAGES}${activeId}`, [])
    return []
  })

  const [assistantState, setAssistantState] = useState<AssistantState>('idle')
  const [conversationTitle, setConversationTitle] = useState(initialTitle)
  const [currentModel, setCurrentModel] = useState<string>(() =>
    loadFromStorage(STORAGE_KEYS.MODEL, defaultModel)
  )

  /* ─── Auto-derive userName from memory ───────────────────────────── */
  const [derivedUserName, setDerivedUserName] = useState<string | undefined>(propUserName)

  useEffect(() => {
    if (propUserName) {
      setDerivedUserName(propUserName)
      return
    }
    if (!mounted) return

    const identityMems = memorySystem.getMemoriesByType('identity')
    const nameMem = identityMems.find((m) => m.predicate === 'named')
    if (nameMem?.object) setDerivedUserName(nameMem.object)

    return memorySystem.subscribe(() => {
      if (propUserName) return
      const idMems = memorySystem.getMemoriesByType('identity')
      const nMem = idMems.find((m) => m.predicate === 'named')
      if (nMem?.object) setDerivedUserName(nMem.object)
    })
  }, [propUserName, mounted])

  const userName = propUserName ?? derivedUserName

  const { streamMessage, isStreaming, streamedContent } = useAIStream()
  const { addToast } = useToast()

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingMessageIdRef = useRef<string | null>(null)

  /* ─── Persist to storage ─────────────────────────────────────────── */
  useEffect(() => {
    if (mounted) saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversations)
  }, [conversations, mounted])

  useEffect(() => {
    if (mounted && activeConversationId) {
      saveToStorage(STORAGE_KEYS.ACTIVE_ID, activeConversationId)
    }
  }, [activeConversationId, mounted])

  useEffect(() => {
    if (mounted && activeConversationId) {
      saveToStorage(`${STORAGE_KEYS.MESSAGES}${activeConversationId}`, messages)
    }
  }, [activeConversationId, messages, mounted])

  useEffect(() => {
    if (mounted) saveToStorage(STORAGE_KEYS.MODEL, currentModel)
  }, [currentModel, mounted])

  /* ─── Derived title ──────────────────────────────────────────────── */
  const derivedTitle = useMemo(() => {
    if (!activeConversationId) return initialTitle
    const conv = conversations.find((c) => c.id === activeConversationId)
    return conv?.title ?? initialTitle
  }, [activeConversationId, conversations, initialTitle])

  useEffect(() => {
    setConversationTitle(derivedTitle)
  }, [derivedTitle])

  /* ─── Cleanup ────────────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [])

  /* ─── Auto-scroll ────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, streamedContent])

  const pushTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }, [])

  const isDisabled = assistantState !== 'idle' || isStreaming

  /* ─── Conversation management ────────────────────────────────────── */
  const createConversation = useCallback((firstMessage?: string): string => {
    const id = `conv-${Date.now()}`
    const title = firstMessage ? generateTitle(firstMessage) : 'New Chat'

    const newConversation: Conversation = {
      id,
      title,
      lastMessage: firstMessage ? firstMessage.slice(0, 100) : 'Start typing to begin…',
      timestamp: new Date(),
      model: MODEL_LABEL,
    }

    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(id)
    setConversationTitle(title)

    return id
  }, [])

  const updateConversation = useCallback((id: string, lastMessage: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, lastMessage: lastMessage.slice(0, 100), timestamp: new Date() }
          : c
      )
    )
  }, [])

  const handleRenameConversation = useCallback(
    (newTitle: string) => {
      if (!activeConversationId) return
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, title: newTitle } : c))
      )
      setConversationTitle(newTitle)
    },
    [activeConversationId]
  )

  const handleConversationSelect = useCallback(
    (id: string) => {
      setActiveConversationId(id)
      setAssistantState('idle')
      const conv = conversations.find((c) => c.id === id)
      setConversationTitle(conv?.title ?? 'Chat')
      const savedMessages = loadFromStorage<Message[]>(`${STORAGE_KEYS.MESSAGES}${id}`, [])
      setMessages(savedMessages)

      // Always close sidebar on mobile after selection
      if (isMobile) setIsSidebarOpen(false)
    },
    [conversations, isMobile]
  )

  /* ─── Send message ───────────────────────────────────────────────── */
  const handleSendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (isDisabled || !trimmed) return

      const ts = Date.now()
      const conversationId = activeConversationId ?? createConversation(trimmed)

      updateConversation(conversationId, trimmed)

      try {
        const extracted = memorySystem.processMessage(trimmed, conversationId)
        if (extracted.length > 0) {
          console.log(
            `🧠 [ChatLayout] Learned ${extracted.length} fact(s):`,
            extracted.map((m) => `[${m.type}] ${m.content}`)
          )
        }
      } catch (e) {
        console.warn('[Memory] Failed to process:', e)
      }

      const userMessage: Message = {
        id: `user-${ts}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
        tokens: estimateTokens(trimmed),
      }
      setMessages((prev) => [...prev, userMessage])

      const aiMessageId = `ai-${ts + 1}`
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        model: MODEL_LABEL,
      }
      setMessages((prev) => [...prev, aiMessage])
      streamingMessageIdRef.current = aiMessageId

      setAssistantState('thinking')
      pushTimeout(() => setAssistantState('typing'), 500)

      let fullResponse = ''

      try {
        const historyForAPI: StreamMessage[] = messages
          .filter((m) => !m.isError && m.content.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.content }))

        let memoryContext = ''
        try {
          const generalContext = memorySystem.getContextualPrompt({ verbose: false })
          const relevantContext = memorySystem.getRelevantContext(trimmed, 5)
          memoryContext = [generalContext, relevantContext].filter(Boolean).join('\n\n')
        } catch (e) {
          console.warn('[Memory] Failed to build context:', e)
        }

        console.log('📤 [ChatLayout] Sending:', {
          historyMessages: historyForAPI.length,
          memoryContextChars: memoryContext.length,
          userName: userName || '(none)',
        })

        if (memoryContext) {
          console.log('🧠 [ChatLayout] Memory context preview:\n', memoryContext.slice(0, 300))
        }

        await streamMessage(trimmed, {
          history: historyForAPI,
          memoryContext,
          userName,
          model: currentModel,
          onToken: (token) => {
            fullResponse += token
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, content: msg.content + token } : msg
              )
            )
          },
          onComplete: () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, isStreaming: false, tokens: estimateTokens(msg.content) }
                  : msg
              )
            )
            updateConversation(conversationId, fullResponse || 'No response')
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
        console.error('Send error:', error)
        setAssistantState('idle')
        streamingMessageIdRef.current = null
        addToast({ title: 'Error', description: 'Failed to send message', type: 'error' })
      }
    },
    [
      isDisabled,
      activeConversationId,
      createConversation,
      updateConversation,
      pushTimeout,
      streamMessage,
      addToast,
      messages,
      currentModel,
      userName,
    ]
  )

  /* ─── Actions ────────────────────────────────────────────────────── */
  const handleNewChat = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    streamingMessageIdRef.current = null

    setActiveConversationId(undefined)
    setMessages([])
    setConversationTitle('New Chat')
    setAssistantState('idle')

    if (isMobile) setIsSidebarOpen(false)
  }, [isMobile])

  const handleClear = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setMessages([])
    setAssistantState('idle')
    streamingMessageIdRef.current = null

    if (activeConversationId) {
      removeFromStorage(`${STORAGE_KEYS.MESSAGES}${activeConversationId}`)
      updateConversation(activeConversationId, 'Start typing to begin…')
    }
  }, [activeConversationId, updateConversation])

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      removeFromStorage(`${STORAGE_KEYS.MESSAGES}${id}`)

      if (activeConversationId === id) {
        setActiveConversationId(undefined)
        setMessages([])
        setConversationTitle('New Chat')
      }
    },
    [activeConversationId]
  )

  const handleExport = useCallback(() => {
    if (messages.length === 0) {
      addToast({ title: 'No messages to export', type: 'info' })
      return
    }

    const md = [
      `# ${conversationTitle}`,
      `_Exported ${new Date().toLocaleString()}_`,
      '',
      ...messages.map((m) => {
        const role = m.role === 'user' ? '**You**' : `**${m.model ?? MODEL_LABEL}**`
        return `${role}\n\n${m.content}\n`
      }),
    ].join('\n')

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pulse-${conversationTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)

    addToast({ title: 'Exported as Markdown', type: 'success' })
  }, [messages, conversationTitle, addToast])

  const handleShare = useCallback(async () => {
    if (messages.length === 0) {
      addToast({ title: 'No messages to share', type: 'info' })
      return
    }
    const url = `${window.location.origin}/chat/${activeConversationId}`

    // Prefer native share API on mobile
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: conversationTitle,
          text: `Check out this conversation on Pulse AI`,
          url,
        })
        return
      } catch (err) {
        // User cancelled or error — fall through to clipboard
        if ((err as Error).name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      addToast({ title: 'Share link copied', type: 'success' })
    } catch {
      addToast({ title: 'Failed to copy link', type: 'error' })
    }
  }, [messages.length, activeConversationId, conversationTitle, addToast, isMobile])

  const handleSearch = useCallback(() => {
    addToast({ title: 'Search coming soon', type: 'info' })
  }, [addToast])

  const handleToggleSidebar = useCallback(() => setIsSidebarOpen((v) => !v), [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])

  /* ─── SSR guard ──────────────────────────────────────────────────── */
  if (!mounted) {
    return (
      <div
        className={cn('flex overflow-hidden bg-[#0a0a0f]', className)}
        style={{ height: '100dvh' }}
      >
        <div className="flex-1" />
      </div>
    )
  }

  const showEmptyState = messages.length === 0 && !isStreaming && assistantState === 'idle'

  return (
    <div
      className={cn(
        'flex overflow-hidden bg-[#0a0a0f] w-full',
        className
      )}
      style={{
        // Use 100dvh with fallback to calc(var(--vh)) for older browsers
        height: '100dvh',
        minHeight: 'calc(var(--vh, 1vh) * 100)',
      }}
    >
      {/* Mobile backdrop */}
      <MobileBackdrop visible={isSidebarOpen && isMobile} onClose={closeSidebar} />

      {/* Sidebar — off-canvas on mobile, static on desktop */}
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

      {/* Main chat area */}
      <div className="relative flex flex-col flex-1 min-w-0 min-h-0 w-full">
        {/* Ambient glow effects — scaled down on mobile for performance */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top glow — smaller on mobile */}
          <div
            className="absolute -top-24 sm:-top-32 left-1/2 -translate-x-1/2 rounded-full opacity-40"
            style={{
              width: 'min(600px, 90vw)',
              height: 'min(300px, 45vw)',
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.12), transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          {/* Bottom glow */}
          <div
            className="absolute -bottom-24 sm:-bottom-32 left-1/2 -translate-x-1/2 rounded-full opacity-30"
            style={{
              width: 'min(500px, 80vw)',
              height: 'min(250px, 40vw)',
              background: 'radial-gradient(ellipse, rgba(139,92,246,0.10), transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Side glows — hidden on mobile to save GPU */}
          <div
            className="hidden md:block absolute top-1/2 -translate-y-1/2 -left-32 w-[200px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.06), transparent 70%)', filter: 'blur(60px)' }}
          />
          <div
            className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-32 w-[200px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.06), transparent 70%)', filter: 'blur(60px)' }}
          />

          {/* Accent lines */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
          <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-violet-500/10 to-transparent" />
        </div>

        {/* Header */}
        <ChatHeader
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isSidebarOpen}
          conversationTitle={conversationTitle}
          assistantState={assistantState}
          model={currentModel}
          onModelChange={setCurrentModel}
          onRename={handleRenameConversation}
          onClear={handleClear}
          onExport={handleExport}
          onShare={handleShare}
          onSearch={handleSearch}
          onNewChat={handleNewChat}
        />

        {/* Messages area — flex-1 with proper overflow */}
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {showEmptyState ? (
              <EmptyState key="empty" onSuggestion={handleSendMessage} userName={userName} />
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="
                  flex flex-col flex-1 min-h-0
                  overflow-y-auto overflow-x-hidden
                  overscroll-behavior-contain
                "
                style={{
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <ChatMessages
                  messages={messages}
                  isTyping={assistantState !== 'idle' || isStreaming}
                />
                <div ref={messagesEndRef} className="h-2 sm:h-4 flex-shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input area — mobile-safe padding for iOS home indicator */}
        <div
          className="
            relative flex-shrink-0 bg-[#0a0a0f]
            pt-1.5 sm:pt-2
            pb-2 sm:pb-4
            px-safe
          "
          style={{
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
          }}
        >
          <MessageInput onSendMessage={handleSendMessage} disabled={isDisabled} />

          <p className="
            text-center
            text-[10px] sm:text-[11px]
            text-white/25
            mt-1.5 sm:mt-2.5
            px-4
            hidden xs:block sm:block
          ">
            <span className="hidden sm:inline">Pulse can make mistakes — verify important information.</span>
            <span className="sm:hidden">Pulse can make mistakes.</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatLayout