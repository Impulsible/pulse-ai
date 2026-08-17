// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'pulseai'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  // Don't throw error during build - return null instead
  if (!MONGODB_URI) {
    console.warn('⚠️ DATABASE_URL is not set, skipping database connection')
    return { client: null, db: null }
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(MONGODB_DB)

    cachedClient = client
    cachedDb = db

    console.log('✅ Connected to MongoDB')
    return { client, db }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    return { client: null, db: null }
  }
}

// Helper to check if database is connected
export function isDatabaseConnected(): boolean {
  return !!MONGODB_URI && cachedClient !== null && cachedDb !== null
}

// Helper to get cached connection without connecting
export function getCachedConnection() {
  return { client: cachedClient, db: cachedDb }
}

// Alias for backward compatibility
export const connectDB = connectToDatabase