/* eslint-disable @typescript-eslint/no-unused-vars */
// src/hooks/useAIStream.ts
'use client'

import { useState, useCallback } from 'react'

interface StreamOptions {
  onToken?: (token: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: Error) => void
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [error, setError] = useState<Error | null>(null)
  // Store conversation history
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])

  const streamMessage = useCallback(async (
    message: string,
    options: StreamOptions = {}
  ) => {
    setIsStreaming(true)
    setStreamedContent('')
    setError(null)

    try {
      // Add user message to history
      const userMessage: Message = { role: 'user', content: message }
      const updatedHistory = [...conversationHistory, userMessage]
      
      console.log('📤 Sending message with history:', updatedHistory.length, 'messages')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          stream: true,
          messages: updatedHistory, // Send full history
        }),
      })

      console.log('📊 Response status:', response.status)

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error('❌ API error response:', errorData)
        } catch (e) {
          try {
            const text = await response.text()
            console.error('❌ API error text:', text)
            if (text) errorMessage = text
          } catch (textError) {
            // Ignore
          }
        }
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body available')
      }

      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      console.log('🔄 Reading stream...')

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          // Add assistant response to history
          if (fullContent) {
            const assistantMessage: Message = { role: 'assistant', content: fullContent }
            setConversationHistory([...updatedHistory, assistantMessage])
          }
          console.log('✅ Stream complete, full content length:', fullContent.length)
          options.onComplete?.(fullContent)
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Process SSE messages
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              console.log('✅ Stream done signal received')
              if (fullContent) {
                const assistantMessage: Message = { role: 'assistant', content: fullContent }
                setConversationHistory([...updatedHistory, assistantMessage])
              }
              options.onComplete?.(fullContent)
              setIsStreaming(false)
              return
            }

            if (data) {
              try {
                const parsed = JSON.parse(data)
                
                if (parsed.error) {
                  console.error('❌ Stream error:', parsed.error)
                  throw new Error(parsed.error)
                }
                
                const token = parsed.token || parsed.choices?.[0]?.delta?.content || ''
                
                if (token) {
                  fullContent += token
                  setStreamedContent(fullContent)
                  options.onToken?.(token)
                }
              } catch (e) {
                if (e instanceof Error && e.message) {
                  throw e
                }
                console.warn('⚠️ Failed to parse SSE data:', data, e)
              }
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer && buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim()
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data)
            const token = parsed.token || parsed.choices?.[0]?.delta?.content || ''
            if (token) {
              fullContent += token
              setStreamedContent(fullContent)
              options.onToken?.(token)
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse final buffer:', data, e)
          }
        }
      }

      // Add assistant response to history if not already added
      if (fullContent) {
        // Check if already added to avoid duplicates
        const lastMessage = conversationHistory[conversationHistory.length - 1]
        if (!lastMessage || lastMessage.role !== 'assistant' || lastMessage.content !== fullContent) {
          const assistantMessage: Message = { role: 'assistant', content: fullContent }
          setConversationHistory([...updatedHistory, assistantMessage])
        }
      }

      options.onComplete?.(fullContent)
    } catch (error) {
      console.error('❌ Streaming error:', error)
      const err = error instanceof Error ? error : new Error('Failed to stream response')
      setError(err)
      options.onError?.(err)
    } finally {
      setIsStreaming(false)
    }
  }, [conversationHistory])

  const reset = useCallback(() => {
    setConversationHistory([])
    setStreamedContent('')
    setError(null)
    setIsStreaming(false)
  }, [])

  const clearHistory = useCallback(() => {
    setConversationHistory([])
  }, [])

  const getHistory = useCallback(() => {
    return conversationHistory
  }, [conversationHistory])

  return {
    isStreaming,
    streamedContent,
    error,
    streamMessage,
    reset,
    clearHistory,
    getHistory,
    conversationHistory,
  }
}