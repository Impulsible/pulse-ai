/* eslint-disable react/no-unescaped-entities */
// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { Card } from '@/components/UI/Card'
import { PulseRobot } from '@/components/Pulse/PulseRobot'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/UI/Toast'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      addToast({
        title: 'Welcome back!',
        type: 'success',
      })
      router.push('/chat')
    } catch (error) {
      addToast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please try again',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card variant="glass" className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <PulseRobot size="lg" />
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Welcome Back
            </h1>
            <p className="text-muted">
              Sign in to continue to Pulse AI
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-primary-pulse hover:text-secondary-pulse">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-pulse hover:text-secondary-pulse">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}