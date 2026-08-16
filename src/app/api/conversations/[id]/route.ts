/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/conversations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Fix: Use Promise for params in Next.js 16
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { db } = await connectToDatabase()
    
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.user.id),
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const messages = await db.collection('messages')
      .find({ conversationId: new ObjectId(id) })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({
      ...conversation,
      messages,
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { db } = await connectToDatabase()

    await db.collection('conversations').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.user.id),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { title, isPinned } = body

    const { db } = await connectToDatabase()

    const updateData: any = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (isPinned !== undefined) updateData.isPinned = isPinned

    await db.collection('conversations').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(session.user.id) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}