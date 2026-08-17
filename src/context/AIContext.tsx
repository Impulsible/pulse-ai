/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/AIContext.tsx
'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react'
import { memorySystem } from '@/lib/ai/memory'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error' | 'aborted'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  status: MessageStatus
  /** Token count (assistant messages) */
  tokens?: number
  /** Tokens per second (assistant messages) */
  tokensPerSecond?: number
  /** Response duration in ms */
  durationMs?: number
  /** Error message if status === 'error' */
  error?: string
  /** Model that generated this response */
  model?: string
  /** Was this edited after sending? */
  editedAt?: Date
  /** Metadata for extension */
  metadata?: Record<string, any>
}

export interface AIStats {
  totalMessages: number
  userMessages: number
  assistantMessages: number
  totalTokens: number
  avgResponseTimeMs: number
  errorRate: number
}

interface SendOptions {
  /** Skip persisting to conversation history (one-off queries) */
  ephemeral?: boolean
  /** Override model for this request */
  model?: string
  /** Callback fired for each streamed token */
  onToken?: (token: string, accumulated: string) => void
  /** Callback fired on completion */
  onComplete?: (message: Message) => void
  /** Additional metadata for API request */
  metadata?: Record<string, any>
}

interface AIContextType {
  // Core state
  messages: Message[]
  isProcessing: boolean
  isStreaming: boolean
  streamingMessageId: string | null
  error: Error | null

  // Actions
  sendMessage: (content: string, options?: SendOptions) => Promise<Message | null>
  regenerateResponse: (messageId?: string) => Promise<Message | null>
  editMessage: (messageId: string, newContent: string) => Promise<Message | null>
  deleteMessage: (messageId: string) => void
  clearMessages: () => void
  abort: () => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void

  // Data operations
  setMessages: (messages: Message[]) => void
  loadMessages: (messages: Message[]) => void

  // Stats & insights
  stats: AIStats
}

const AIContext = createContext<AIContextType | undefined>(undefined)

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function estimateTokens(text: string): number {
  return Math.ceil((text?.trim().split(/\s+/).length ?? 0) * 1.35)
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PROVIDER
   ═══════════════════════════════════════════════════════════════════════════════ */

interface AIProviderProps {
  children: ReactNode
  /** API endpoint (default: /api/chat) */
  endpoint?: string
  /** Initial messages to hydrate with */
  initialMessages?: Message[]
  /** Max messages kept in memory */
  maxHistorySize?: number
  /** User's name for personalization */
  userName?: string
  /** Enable long-term memory extraction */
  enableMemory?: boolean
}

export function AIProvider({
  children,
  endpoint = '/api/chat',
  initialMessages = [],
  maxHistorySize = 100,
  userName,
  enableMemory = true,
}: AIProviderProps) {
  const [messages, setMessagesState] = useState<Message[]>(initialMessages)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<Message[]>(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  /* ─── Cleanup on unmount ────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  /* ─── Internal: update a message in place ───────────────────────── */
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessagesState((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
    )
  }, [])

  /* ─── Internal: append with size cap ────────────────────────────── */
  const appendMessages = useCallback(
    (newMsgs: Message[]) => {
      setMessagesState((prev) => {
        const combined = [...prev, ...newMsgs]
        if (combined.length > maxHistorySize) {
          return combined.slice(-maxHistorySize)
        }
        return combined
      })
    },
    [maxHistorySize]
  )

  /* ─── Public: set full message list ─────────────────────────────── */
  const setMessages = useCallback((newMessages: Message[]) => {
    setMessagesState(newMessages)
  }, [])

  /* ─── Public: hydrate from external source (DB, cache) ──────────── */
  const loadMessages = useCallback((newMessages: Message[]) => {
    setMessagesState(newMessages)
    setError(null)
    setIsStreaming(false)
    setIsProcessing(false)
    setStreamingMessageId(null)
  }, [])

  /* ─── Public: abort in-flight request ───────────────────────────── */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    if (streamingMessageId) {
      updateMessage(streamingMessageId, { status: 'aborted' })
    }
    setIsStreaming(false)
    setIsProcessing(false)
    setStreamingMessageId(null)
  }, [streamingMessageId, updateMessage])

  /* ─── Public: delete a message ──────────────────────────────────── */
  const deleteMessage = useCallback((messageId: string) => {
    setMessagesState((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  /* ─── Public: clear all messages ────────────────────────────────── */
  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort()
    setMessagesState([])
    setError(null)
    setIsStreaming(false)
    setIsProcessing(false)
    setStreamingMessageId(null)

    // Fire-and-forget server-side clear
    fetch(endpoint, { method: 'DELETE' }).catch((err) => {
      console.warn('[AIContext] Server clear failed:', err)
    })
  }, [endpoint])

  /* ─── Core streaming logic ──────────────────────────────────────── */
  const executeStream = useCallback(
    async (
      content: string,
      opts: SendOptions,
      userMsgId: string,
      assistantMsgId: string
    ): Promise<Message | null> => {
      const controller = new AbortController()
      abortControllerRef.current = controller

      const startTime = Date.now()
      let fullContent = ''
      let tokenCount = 0

      try {
        // Build snapshot of history for the API
        const history = messagesRef.current
          .filter((m) => m.status !== 'error' && m.content.trim().length > 0)
          .filter((m) => m.id !== userMsgId && m.id !== assistantMsgId)
          .map((m) => ({ role: m.role, content: m.content }))

        // Build long-term memory context
        let memoryContext = ''
        if (enableMemory) {
          try {
            const generalContext = memorySystem.getContextualPrompt({ verbose: false })
            const relevantContext = memorySystem.getRelevantContext(content, 5)
            memoryContext = [generalContext, relevantContext].filter(Boolean).join('\n\n')
          } catch (e) {
            console.warn('[AIContext] Memory context failed:', e)
          }
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            message: content,
            messages: history,
            memoryContext,
            userName,
            model: opts.model,
            metadata: opts.metadata,
            stream: true,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          let errMsg = `Request failed (${response.status})`
          try {
            const data = await response.json()
            errMsg = data.error || errMsg
          } catch { /* noop */ }
          throw new Error(errMsg)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response stream')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()

            if (data === '[DONE]') break
            if (!data) continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) throw new Error(parsed.error)

              const token: string =
                parsed.token ||
                parsed.choices?.[0]?.delta?.content ||
                ''

              if (token) {
                fullContent += token
                tokenCount++
                updateMessage(assistantMsgId, {
                  content: fullContent,
                  status: 'streaming',
                })
                opts.onToken?.(token, fullContent)
              }
            } catch (e) {
              if (e instanceof Error && !e.message.includes('JSON')) throw e
            }
          }
        }

        // Finalize
        const elapsed = Date.now() - startTime
        const tps = elapsed > 0 ? (tokenCount / elapsed) * 1000 : 0

        const finalMsg: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: fullContent,
          timestamp: new Date(),
          status: 'complete',
          tokens: tokenCount || estimateTokens(fullContent),
          tokensPerSecond: tps,
          durationMs: elapsed,
          model: opts.model,
        }

        updateMessage(assistantMsgId, {
          content: fullContent,
          status: 'complete',
          tokens: tokenCount || estimateTokens(fullContent),
          tokensPerSecond: tps,
          durationMs: elapsed,
        })

        // Learn from assistant response too (for reference resolution)
        if (enableMemory && fullContent.length > 20) {
          try {
            memorySystem.processMessage(fullContent, assistantMsgId)
          } catch (e) {
            console.warn('[AIContext] Memory processing (assistant) failed:', e)
          }
        }

        opts.onComplete?.(finalMsg)
        return finalMsg
      } catch (err) {
        // Handle abort
        if (
          err instanceof Error &&
          (err.name === 'AbortError' || controller.signal.aborted)
        ) {
          updateMessage(assistantMsgId, {
            content: fullContent,
            status: 'aborted',
          })
          return null
        }

        const errorObj = err instanceof Error ? err : new Error('Stream failed')
        updateMessage(assistantMsgId, {
          content: fullContent || 'Sorry, I encountered an error. Please try again.',
          status: 'error',
          error: errorObj.message,
        })
        setError(errorObj)
        throw errorObj
      }
    },
    [endpoint, updateMessage, enableMemory, userName]
  )

  /* ─── Public: send message ──────────────────────────────────────── */
  const sendMessage = useCallback(
    async (content: string, options: SendOptions = {}): Promise<Message | null> => {
      const trimmed = content.trim()
      if (!trimmed || isProcessing) return null

      setError(null)
      setIsProcessing(true)
      setIsStreaming(true)

      // Extract facts into long-term memory
      if (enableMemory && !options.ephemeral) {
        try {
          const extracted = memorySystem.processMessage(trimmed)
          if (extracted.length > 0) {
            console.log(
              `🧠 [AIContext] Learned ${extracted.length} fact(s)`,
              extracted.map((m) => `[${m.type}] ${m.content}`)
            )
          }
        } catch (e) {
          console.warn('[AIContext] Memory extraction failed:', e)
        }
      }

      // Build user + placeholder assistant messages
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
        status: 'complete',
        tokens: estimateTokens(trimmed),
      }

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'pending',
        model: options.model,
      }

      if (!options.ephemeral) {
        appendMessages([userMsg, assistantMsg])
      }

      setStreamingMessageId(assistantMsg.id)

      try {
        const result = await executeStream(trimmed, options, userMsg.id, assistantMsg.id)

        if (options.ephemeral) {
          // Remove ephemeral messages after completion
          setMessagesState((prev) =>
            prev.filter((m) => m.id !== userMsg.id && m.id !== assistantMsg.id)
          )
        }

        return result
      } finally {
        setIsStreaming(false)
        setIsProcessing(false)
        setStreamingMessageId(null)
        abortControllerRef.current = null
      }
    },
    [isProcessing, enableMemory, appendMessages, executeStream]
  )

  /* ─── Public: regenerate last assistant response ────────────────── */
  const regenerateResponse = useCallback(
    async (messageId?: string): Promise<Message | null> => {
      const history = messagesRef.current

      let targetIdx: number | undefined

      if (messageId) {
        targetIdx = history.findIndex((m) => m.id === messageId)
        if (targetIdx === -1) return null
      } else {
        // Regenerate the last assistant message
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].role === 'assistant') {
            targetIdx = i
            break
          }
        }
        if (targetIdx === undefined) return null
      }

      // Find the corresponding user message (must be immediately before)
      const userMsg = history[targetIdx - 1]
      if (!userMsg || userMsg.role !== 'user') return null

      // Truncate history to before the assistant message
      setMessagesState((prev) => prev.slice(0, targetIdx))

      // Small delay to let state settle
      await new Promise((r) => setTimeout(r, 50))

      return sendMessage(userMsg.content)
    },
    [sendMessage]
  )

  /* ─── Public: edit a user message + regenerate ──────────────────── */
  const editMessage = useCallback(
    async (messageId: string, newContent: string): Promise<Message | null> => {
      const history = messagesRef.current
      const idx = history.findIndex((m) => m.id === messageId)
      if (idx === -1) return null

      const target = history[idx]
      if (target.role !== 'user') {
        console.warn('[AIContext] Only user messages can be edited')
        return null
      }

      // Truncate everything after the edited message + update it
      setMessagesState((prev) => {
        const truncated = prev.slice(0, idx)
        return [
          ...truncated,
          {
            ...target,
            content: newContent,
            editedAt: new Date(),
            timestamp: new Date(),
          },
        ]
      })

      await new Promise((r) => setTimeout(r, 50))
      return sendMessage(newContent)
    },
    [sendMessage]
  )

  /* ─── Derived stats ─────────────────────────────────────────────── */
  const stats = useMemo<AIStats>(() => {
    const user = messages.filter((m) => m.role === 'user').length
    const assistant = messages.filter((m) => m.role === 'assistant').length
    const totalTokens = messages.reduce((sum, m) => sum + (m.tokens ?? 0), 0)

    const durations = messages
      .filter((m) => m.role === 'assistant' && m.durationMs)
      .map((m) => m.durationMs!)

    const avgResponseTimeMs = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0

    const errors = messages.filter((m) => m.status === 'error').length
    const errorRate = messages.length > 0 ? errors / messages.length : 0

    return {
      totalMessages: messages.length,
      userMessages: user,
      assistantMessages: assistant,
      totalTokens,
      avgResponseTimeMs,
      errorRate,
    }
  }, [messages])

  const value = useMemo<AIContextType>(
    () => ({
      messages,
      isProcessing,
      isStreaming,
      streamingMessageId,
      error,
      sendMessage,
      regenerateResponse,
      editMessage,
      deleteMessage,
      clearMessages,
      abort,
      updateMessage,
      setMessages,
      loadMessages,
      stats,
    }),
    [
      messages,
      isProcessing,
      isStreaming,
      streamingMessageId,
      error,
      sendMessage,
      regenerateResponse,
      editMessage,
      deleteMessage,
      clearMessages,
      abort,
      updateMessage,
      setMessages,
      loadMessages,
      stats,
    ]
  )

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════════════════════════════════════ */

export function useAI() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within AIProvider')
  }
  return context
}