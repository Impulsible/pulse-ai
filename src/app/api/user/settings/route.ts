// src/app/api/user/settings/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }
    
    let settings = await db.collection('settings').findOne({ 
      userId: new ObjectId(session.user.id) 
    })

    if (!settings) {
      const result = await db.collection('settings').insertOne({
        userId: new ObjectId(session.user.id),
        theme: 'dark',
        fontSize: 'medium',
        language: 'en',
        notifications: true,
        soundEffects: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      settings = await db.collection('settings').findOne({ _id: result.insertedId })
    }

    // Return with proper null check
    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to create or fetch settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: settings._id.toString(),
      userId: settings.userId.toString(),
      theme: settings.theme,
      fontSize: settings.fontSize,
      language: settings.language,
      notifications: settings.notifications,
      soundEffects: settings.soundEffects,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { theme, fontSize, language, notifications, soundEffects } = body

    const { db } = await connectToDatabase()
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const updateData: any = { updatedAt: new Date() }
    if (theme !== undefined) updateData.theme = theme
    if (fontSize !== undefined) updateData.fontSize = fontSize
    if (language !== undefined) updateData.language = language
    if (notifications !== undefined) updateData.notifications = notifications
    if (soundEffects !== undefined) updateData.soundEffects = soundEffects

    await db.collection('settings').updateOne(
      { userId: new ObjectId(session.user.id) },
      { $set: updateData },
      { upsert: true }
    )

    let settings = await db.collection('settings').findOne({ 
      userId: new ObjectId(session.user.id) 
    })

    if (!settings) {
      const result = await db.collection('settings').insertOne({
        userId: new ObjectId(session.user.id),
        theme: 'dark',
        fontSize: 'medium',
        language: 'en',
        notifications: true,
        soundEffects: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      settings = await db.collection('settings').findOne({ _id: result.insertedId })
    }

    // Return with proper null check
    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to create or fetch settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: settings._id.toString(),
      userId: settings.userId.toString(),
      theme: settings.theme,
      fontSize: settings.fontSize,
      language: settings.language,
      notifications: settings.notifications,
      soundEffects: settings.soundEffects,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}