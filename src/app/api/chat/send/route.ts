// src/app/api/chat/send/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  pro: -1,
  team: -1,
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { content, conversationId } = body as {
      content: string
      conversationId?: string
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content required' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const user = await db.collection('users').findOne({
      email: session.user.email,
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const plan = user.plan ?? 'free'
    const limit = PLAN_LIMITS[plan] ?? 50

    // Enforce quota for non-unlimited plans
    if (limit !== -1) {
      const cycleStart = new Date()
      cycleStart.setDate(1)
      cycleStart.setHours(0, 0, 0, 0)

      const messagesUsed = await db.collection('messages').countDocuments({
        userId: user._id,
        role: 'user',
        createdAt: { $gte: cycleStart },
      })

      if (messagesUsed >= limit) {
        return NextResponse.json(
          {
            error: 'Message limit reached',
            code: 'QUOTA_EXCEEDED',
            plan,
            used: messagesUsed,
            limit,
          },
          { status: 429 }
        )
      }
    }

    // Get or create conversation
    let convId: ObjectId
    if (conversationId && ObjectId.isValid(conversationId)) {
      convId = new ObjectId(conversationId)
    } else {
      const result = await db.collection('conversations').insertOne({
        userId: user._id,
        title: content.slice(0, 40),
        isPinned: false,
        model: 'Pulse AI', // ✅ was 'Groq'
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      convId = result.insertedId
    }

    // Persist user message
    const userMsgResult = await db.collection('messages').insertOne({
      userId: user._id,
      conversationId: convId,
      role: 'user',
      content: content.trim(),
      tokens: Math.ceil(content.length / 4),
      model: 'Pulse AI', // ✅ was 'Groq'
      isError: false,
      isStreaming: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // TODO: Call your AI provider (OpenAI/Anthropic/etc.) here
    // and save assistant message

    return NextResponse.json({
      success: true,
      messageId: userMsgResult.insertedId.toString(),
      conversationId: convId.toString(),
    })
  } catch (err) {
    console.error('[POST /api/chat/send]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}