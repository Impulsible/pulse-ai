// src/types/next-auth.d.ts
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string | null
      plan: 'free' | 'pro' | 'team'
    }
  }

  interface User {
    id: string
    plan?: 'free' | 'pro' | 'team'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    plan: 'free' | 'pro' | 'team'
    email: string
    name: string
  }
}