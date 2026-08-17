/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/db.service.ts
import { connectToDatabase } from './mongodb'
import { ObjectId } from 'mongodb'

// Default model label shown to users
const DEFAULT_MODEL_LABEL = 'Pulse AI' // ✅ was 'Groq'

// Helper to ensure db is not null
async function getDb() {
  const { db } = await connectToDatabase()
  if (!db) {
    throw new Error('Database connection failed')
  }
  return db
}

// User operations
export const User = {
  async create(data: {
    email: string
    password: string
    name?: string
    plan?: string
    createdAt?: Date
    updatedAt?: Date
  }): Promise<{
    id: string
    email: string
    name: string
    password: string
    plan: string
    createdAt: Date
    updatedAt: Date
  }> {
    const db = await getDb()
    const result = await db.collection('users').insertOne({
      email: data.email,
      password: data.password,
      name: data.name || data.email.split('@')[0],
      plan: data.plan || 'free',
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    })

    const user = await db.collection('users').findOne({ _id: result.insertedId })

    if (!user) {
      throw new Error('Failed to create user')
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      password: user.password,
      plan: user.plan || 'free',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  },

  async findByEmail(email: string) {
    const db = await getDb()
    return db.collection('users').findOne({ email })
  },

  async findById(id: string) {
    const db = await getDb()
    return db.collection('users').findOne({ _id: new ObjectId(id) })
  },

  async update(id: string, data: any) {
    const db = await getDb()
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    )
    return this.findById(id)
  },

  async delete(id: string) {
    const db = await getDb()
    await db.collection('users').deleteOne({ _id: new ObjectId(id) })
    return { success: true }
  },
}

// Conversation operations
export const Conversation = {
  async create(data: { userId: string; title?: string }) {
    const db = await getDb()
    const result = await db.collection('conversations').insertOne({
      userId: new ObjectId(data.userId),
      title: data.title || 'New Chat',
      isPinned: false,
      model: DEFAULT_MODEL_LABEL, // ✅ was 'Groq'
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: result.insertedId.toString(), ...data }
  },

  async findByUserId(userId: string) {
    const db = await getDb()
    return db.collection('conversations')
      .find({ userId: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .toArray()
  },

  async findById(id: string) {
    const db = await getDb()
    return db.collection('conversations').findOne({ _id: new ObjectId(id) })
  },

  async update(id: string, data: any) {
    const db = await getDb()
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    )
    return this.findById(id)
  },

  async delete(id: string) {
    const db = await getDb()
    await db.collection('conversations').deleteOne({ _id: new ObjectId(id) })
    return { success: true }
  },
}

// Message operations
export const Message = {
  async create(data: {
    conversationId: string
    role: string
    content: string
    userId?: string
    tokens?: number
    model?: string
    isError?: boolean
    isStreaming?: boolean
  }) {
    const db = await getDb()
    const result = await db.collection('messages').insertOne({
      conversationId: new ObjectId(data.conversationId),
      userId: data.userId ? new ObjectId(data.userId) : null,
      role: data.role,
      content: data.content,
      tokens: data.tokens || 0,
      model: data.model || DEFAULT_MODEL_LABEL, // ✅ was 'Groq'
      isError: data.isError || false,
      isStreaming: data.isStreaming || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: result.insertedId.toString(), ...data }
  },

  async findByConversationId(conversationId: string) {
    const db = await getDb()
    return db.collection('messages')
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray()
  },

  async deleteByConversationId(conversationId: string) {
    const db = await getDb()
    await db.collection('messages').deleteMany({
      conversationId: new ObjectId(conversationId)
    })
    return { success: true }
  },
}

// Settings operations
export const Settings = {
  async create(data: {
    userId: string
    theme?: string
    fontSize?: string
    language?: string
    notifications?: boolean
    soundEffects?: boolean
    createdAt?: Date
    updatedAt?: Date
  }) {
    const db = await getDb()
    const result = await db.collection('settings').insertOne({
      userId: new ObjectId(data.userId),
      theme: data.theme || 'dark',
      fontSize: data.fontSize || 'medium',
      language: data.language || 'en',
      notifications: data.notifications ?? true,
      soundEffects: data.soundEffects ?? true,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    })

    const settings = await db.collection('settings').findOne({ _id: result.insertedId })

    if (!settings) {
      throw new Error('Failed to create settings')
    }

    return {
      id: settings._id.toString(),
      userId: settings.userId.toString(),
      theme: settings.theme,
      fontSize: settings.fontSize,
      language: settings.language,
      notifications: settings.notifications,
      soundEffects: settings.soundEffects,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }
  },

  async findByUserId(userId: string) {
    const db = await getDb()
    const settings = await db.collection('settings').findOne({
      userId: new ObjectId(userId)
    })
    if (!settings) return null
    return {
      id: settings._id.toString(),
      userId: settings.userId.toString(),
      theme: settings.theme,
      fontSize: settings.fontSize,
      language: settings.language,
      notifications: settings.notifications,
      soundEffects: settings.soundEffects,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }
  },

  async update(userId: string, data: any) {
    const db = await getDb()
    await db.collection('settings').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { ...data, updatedAt: new Date() } }
    )
    return this.findByUserId(userId)
  },

  async delete(userId: string) {
    const db = await getDb()
    await db.collection('settings').deleteOne({ userId: new ObjectId(userId) })
    return { success: true }
  },
}

// Export all services as default
export default {
  User,
  Conversation,
  Message,
  Settings,
}