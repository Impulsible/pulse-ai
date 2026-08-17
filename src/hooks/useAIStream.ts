/* eslint-disable @typescript-eslint/no-unused-vars */
// src/hooks/useAIStream.ts
'use client'

import { useState, useCallback } from 'react'

interface StreamOptions {
  onToken?: (token: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: Error) => void
}

export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [error, setError] = useState<Error | null>(null)

  const streamMessage = useCallback(async (
    message: string,
    options: StreamOptions = {}
  ) => {
    setIsStreaming(true)
    setStreamedContent('')
    setError(null)

    try {
      console.log('📤 Sending message to API:', message)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          stream: true,
          messages: [
            { role: 'user', content: message }
          ],
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
          // If we can't parse JSON, try text
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
              options.onComplete?.(fullContent)
              setIsStreaming(false)
              return
            }

            if (data) {
              try {
                const parsed = JSON.parse(data)
                
                // Check for error in the response
                if (parsed.error) {
                  console.error('❌ Stream error:', parsed.error)
                  throw new Error(parsed.error)
                }
                
                // Get the token from the custom format
                const token = parsed.token || parsed.choices?.[0]?.delta?.content || ''
                
                if (token) {
                  fullContent += token
                  setStreamedContent(fullContent)
                  options.onToken?.(token)
                }
              } catch (e) {
                // If it's an error we threw, rethrow it
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

      options.onComplete?.(fullContent)
    } catch (error) {
      console.error('❌ Streaming error:', error)
      const err = error instanceof Error ? error : new Error('Failed to stream response')
      setError(err)
      options.onError?.(err)
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const reset = useCallback(() => {
    setStreamedContent('')
    setError(null)
    setIsStreaming(false)
  }, [])

  return {
    isStreaming,
    streamedContent,
    error,
    streamMessage,
    reset,
  }
}