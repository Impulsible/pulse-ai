// src/app/api/user/me/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'

const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  pro: -1,
  team: -1,
}

export async function GET() {
  try {
    // 1. Verify session
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Connect to MongoDB
    const { db } = await connectToDatabase()

    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // 3. Fetch user
    const user = await db.collection('users').findOne({
      email: session.user.email,
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Calculate cycle start (first of current month)
    const cycleStart = new Date()
    cycleStart.setDate(1)
    cycleStart.setHours(0, 0, 0, 0)

    // 5. Count user messages this cycle
    const messagesUsed = await db.collection('messages').countDocuments({
      userId: user._id,
      role: 'user',
      createdAt: { $gte: cycleStart },
    })

    const plan = user.plan ?? 'free'
    const messagesLimit = PLAN_LIMITS[plan] ?? 50

    // 6. Return normalized response
    return NextResponse.json({
      id: user._id.toString(),
      name: user.name || 'User',
      email: user.email,
      avatarUrl: user.image || user.avatarUrl || null,
      plan,
      messagesUsed,
      messagesLimit,
      createdAt: user.createdAt?.toISOString?.() ?? new Date().toISOString(),
    })
  } catch (err) {
    console.error('[GET /api/user/me]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}