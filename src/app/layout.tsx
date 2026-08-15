// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/UI/Toast'
import { SessionProvider } from '@/components/Providers/SessionProvider'
import { AuthProvider } from '@/context/AuthContext'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pulse AI - Your Intelligent Assistant',
  description: 'Experience the future of AI assistance with Pulse AI',
  keywords: 'AI, assistant, chatbot, pulse, intelligent',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}