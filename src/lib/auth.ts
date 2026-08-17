/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import { User } from '@/lib/db.service'
import { ObjectId } from 'mongodb'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password required')
          }

          // Connect to database
          const { db } = await connectToDatabase()
          
          if (!db) {
            throw new Error('Database connection failed')
          }

          // Try using db.service first, fallback to direct collection query
          let user = await User.findByEmail(credentials.email.toLowerCase())
          
          if (!user) {
            // Fallback: direct collection query
            user = await db.collection('users').findOne({
              email: credentials.email.toLowerCase(),
            })
          }

          if (!user || !user.password) {
            throw new Error('Invalid email or password')
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          // Return user object with consistent structure
          return {
            id: user._id?.toString() || user.id?.toString(),
            email: user.email,
            name: user.name || user.email?.split('@')[0] || 'User',
            image: user.image || user.avatarUrl || null,
            plan: user.plan || 'free',
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login on error
  },
  
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token
      if (user) {
        token.id = user.id
        token.plan = (user.plan || 'free') as 'free' | 'pro' | 'team'
        token.email = user.email || ''
        token.name = user.name || 'User'
      }
      return token
    },
    
    async session({ session, token }) {
      // Add token data to session
      if (session.user) {
        session.user.id = token.id as string
        session.user.plan = (token.plan as 'free' | 'pro' | 'team') || 'free'
        session.user.email = token.email as string || ''
        session.user.name = token.name as string || 'User'
      }
      return session
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  // Debug only in development
  debug: process.env.NODE_ENV === 'development',
}

// Optional: Helper function to get user from session
export const getUserFromSession = async (session: any) => {
  if (!session?.user?.id) return null
  
  const { db } = await connectToDatabase()
  if (!db) return null
  
  try {
    // Try to find user by ObjectId if valid, otherwise by string ID
    let user
    try {
      const objectId = new ObjectId(session.user.id)
      user = await db.collection('users').findOne({ _id: objectId })
    } catch {
      // If not a valid ObjectId, try as string
      user = await db.collection('users').findOne({ _id: session.user.id })
    }
    
    return user
  } catch (error) {
    console.error('Error fetching user from session:', error)
    return null
  }
}