/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Providers/SessionProvider.tsx
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ 
  children,
  session,
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}