/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/index.ts
export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
  metadata?: Record<string, any>
}

export interface ChatRequest {
  message: string
  conversationId?: string
}

export interface ChatResponse {
  message: Message
  conversation: Conversation
}

export interface UserSettings {
  theme: 'dark' | 'light'
  fontSize: 'small' | 'medium' | 'large'
  notifications: boolean
  soundEffects: boolean
}