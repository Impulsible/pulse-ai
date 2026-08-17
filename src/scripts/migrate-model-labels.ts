// src/scripts/migrate-model-labels.ts
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') })

async function migrate() {
  console.log('🔄 Starting migration...')
  console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? '✅ loaded' : '❌ missing')
  console.log('📍 MONGODB_URI:', process.env.MONGODB_URI  ? '✅ loaded' : '❌ missing')

  // ⚡ Dynamic import — happens AFTER dotenv has run
  const { connectToDatabase } = await import('../lib/mongodb')

  const { db } = await connectToDatabase()
  if (!db) throw new Error('DB connection failed')

  console.log('✅ Connected to database')

  const conv = await db.collection('conversations').updateMany(
    { model: 'Groq' },
    { $set: { model: 'Pulse AI' } }
  )
  console.log(`✅ Updated ${conv.modifiedCount} conversations`)

  const msg = await db.collection('messages').updateMany(
    { model: 'Groq' },
    { $set: { model: 'Pulse AI' } }
  )
  console.log(`✅ Updated ${msg.modifiedCount} messages`)

  process.exit(0)
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e)
  process.exit(1)
})