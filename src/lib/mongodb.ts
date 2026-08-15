// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.DATABASE_URL!
const MONGODB_DB = process.env.MONGODB_DB || 'pulseai'

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable')
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)

  cachedClient = client
  cachedDb = db

  return { client, db }
}