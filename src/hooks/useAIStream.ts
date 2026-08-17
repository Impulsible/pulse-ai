// src/hooks/useAIStream.ts
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface StreamMessage {
  role: MessageRole
  content: string
}

interface StreamOptions {
  /** Full conversation history (excluding the current message) */
  history?: StreamMessage[]
  /** Long-term memory context injected as an additional system message */
  memoryContext?: string
  /** User's name (for personalization) */
  userName?: string
  onToken?: (token: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: Error) => void
  onAbort?: () => void
  signal?: AbortSignal
  model?: string
}

export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const streamMessage = useCallback(
    async (message: string, options: StreamOptions = {}) => {
      // Cancel any in-flight request
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsStreaming(true)
      setStreamedContent('')
      setError(null)

      const history = options.history ?? []

      console.log('📤 [useAIStream] Sending:', {
        newMessage: message.slice(0, 60),
        historyLength: history.length,
        historyRoles: history.map((m) => m.role).join(' → '),
        hasMemory: !!options.memoryContext,
        memoryLength: options.memoryContext?.length ?? 0,
      })

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            messages: history,                    // ← Short-term memory
            memoryContext: options.memoryContext, // ← Long-term memory
            userName: options.userName,
            stream: true,
            model: options.model,
          }),
          signal: options.signal ?? controller.signal,
        })

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            try {
              errorMessage = (await response.text()) || errorMessage
            } catch { /* noop */ }
          }
          throw new Error(errorMessage)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let fullContent = ''
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

            if (data === '[DONE]') {
              options.onComplete?.(fullContent)
              setIsStreaming(false)
              return fullContent
            }
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
                setStreamedContent(fullContent)
                options.onToken?.(token)
              }
            } catch (e) {
              if (e instanceof Error && e.message) throw e
              console.warn('⚠ SSE parse:', data)
            }
          }
        }

        options.onComplete?.(fullContent)
        return fullContent
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          options.onAbort?.()
          return
        }
        const errorObj = err instanceof Error ? err : new Error('Stream failed')
        console.error('❌ [useAIStream]', errorObj.message)
        setError(errorObj)
        options.onError?.(errorObj)
      } finally {
        setIsStreaming(false)
      }
    },
    []
  )

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    isStreaming,
    streamedContent,
    error,
    streamMessage,
    abort,
    // Legacy no-op for backward compat
    clearHistory: () => {},
  }
}