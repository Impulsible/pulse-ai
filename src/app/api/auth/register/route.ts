// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { User, Settings } from '@/lib/db.service'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Enhanced password validation - minimum 8 characters (more secure)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Connect to database
    const { db } = await connectToDatabase()
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase()

    // Check if user already exists
    const existingUser = await User.findByEmail(normalizedEmail)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with all fields
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: name?.trim() || normalizedEmail.split('@')[0],
      plan: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Ensure user.id exists before using it
    if (!user.id) {
      throw new Error('User created but ID is missing')
    }

    // Create default settings for the user
    await Settings.create({
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Return success response (exclude sensitive data)
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan || 'free',
        createdAt: user.createdAt,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}