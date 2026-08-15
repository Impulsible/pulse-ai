/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/db.service.ts
import { connectToDatabase } from './mongodb'
import { ObjectId } from 'mongodb'

// User operations
export const User = {
  async create(data: { email: string; password: string; name?: string }) {
    const { db } = await connectToDatabase()
    const result = await db.collection('users').insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: result.insertedId, ...data }
  },

  async findByEmail(email: string) {
    const { db } = await connectToDatabase()
    return db.collection('users').findOne({ email })
  },

  async findById(id: string) {
    const { db } = await connectToDatabase()
    return db.collection('users').findOne({ _id: new ObjectId(id) })
  },

  async update(id: string, data: any) {
    const { db } = await connectToDatabase()
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    )
    return this.findById(id)
  },

  async delete(id: string) {
    const { db } = await connectToDatabase()
    await db.collection('users').deleteOne({ _id: new ObjectId(id) })
    return { success: true }
  },
}

// Conversation operations
export const Conversation = {
  async create(data: { userId: string; title?: string }) {
    const { db } = await connectToDatabase()
    const result = await db.collection('conversations').insertOne({
      userId: new ObjectId(data.userId),
      title: data.title || 'New Chat',
      isPinned: false,
      model: 'Groq',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: result.insertedId, ...data }
  },

  async findByUserId(userId: string) {
    const { db } = await connectToDatabase()
    return db.collection('conversations')
      .find({ userId: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .toArray()
  },

  async findById(id: string) {
    const { db } = await connectToDatabase()
    return db.collection('conversations').findOne({ _id: new ObjectId(id) })
  },

  async update(id: string, data: any) {
    const { db } = await connectToDatabase()
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    )
    return this.findById(id)
  },

  async delete(id: string) {
    const { db } = await connectToDatabase()
    await db.collection('conversations').deleteOne({ _id: new ObjectId(id) })
    return { success: true }
  },
}

// Message operations
export const Message = {
  async create(data: { 
    conversationId: string; 
    role: string; 
    content: string; 
    userId?: string; 
    tokens?: number; 
    model?: string 
  }) {
    const { db } = await connectToDatabase()
    const result = await db.collection('messages').insertOne({
      conversationId: new ObjectId(data.conversationId),
      userId: data.userId ? new ObjectId(data.userId) : null,
      role: data.role,
      content: data.content,
      tokens: data.tokens || 0,
      model: data.model || 'Groq',
      isError: false,
      isStreaming: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: result.insertedId, ...data }
  },

  async findByConversationId(conversationId: string) {
    const { db } = await connectToDatabase()
    return db.collection('messages')
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray()
  },

  async deleteByConversationId(conversationId: string) {
    const { db } = await connectToDatabase()
    await db.collection('messages').deleteMany({ 
      conversationId: new ObjectId(conversationId) 
    })
    return { success: true }
  },
}

// Settings operations
export const Settings = {
  async create(data: { userId: string }) {
    const { db } = await connectToDatabase()
    const result = await db.collection('settings').insertOne({
      userId: new ObjectId(data.userId),
      theme: 'dark',
      fontSize: 'medium',
      language: 'en',
      notifications: true,
      soundEffects: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: result.insertedId, ...data }
  },

  async findByUserId(userId: string) {
    const { db } = await connectToDatabase()
    return db.collection('settings').findOne({ userId: new ObjectId(userId) })
  },

  async update(userId: string, data: any) {
    const { db } = await connectToDatabase()
    await db.collection('settings').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { ...data, updatedAt: new Date() } }
    )
    return this.findByUserId(userId)
  },

  async delete(userId: string) {
    const { db } = await connectToDatabase()
    await db.collection('settings').deleteOne({ userId: new ObjectId(userId) })
    return { success: true }
  },
}

// Export all services
export const db = {
  User,
  Conversation,
  Message,
  Settings,
}