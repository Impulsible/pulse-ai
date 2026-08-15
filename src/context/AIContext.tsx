// src/context/AIContext.tsx
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface AIContextType {
  messages: Message[]
  isProcessing: boolean
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  regenerateResponse: (messageId: string) => Promise<void>
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    setIsProcessing(true)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Send message error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    // Also clear server-side history
    fetch('/api/chat', { method: 'DELETE' })
  }, [])

  const regenerateResponse = useCallback(async (messageId: string) => {
    // Find the user message before this AI message
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex <= 0) return

    const userMessage = messages[messageIndex - 1]
    if (userMessage.role !== 'user') return

    // Remove the old AI response
    setMessages(prev => prev.filter(m => m.id !== messageId))
    
    // Generate new response
    await sendMessage(userMessage.content)
  }, [messages, sendMessage])

  return (
    <AIContext.Provider value={{
      messages,
      isProcessing,
      sendMessage,
      clearMessages,
      regenerateResponse,
    }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within AIProvider')
  }
  return context
}