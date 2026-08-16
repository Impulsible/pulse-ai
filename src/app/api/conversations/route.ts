/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { db } = await connectToDatabase()
    
    const conversations = await db.collection('conversations')
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title } = body

    const { db } = await connectToDatabase()

    const result = await db.collection('conversations').insertOne({
      userId: new ObjectId(session.user.id),
      title: title || 'New Chat',
      isPinned: false,
      model: 'Groq',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const conversation = await db.collection('conversations').findOne({
      _id: result.insertedId,
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}