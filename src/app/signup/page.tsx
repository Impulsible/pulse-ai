// src/app/signup/page.tsx
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

export default function SignupPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { addToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      addToast({
        title: 'Passwords do not match',
        type: 'error',
      })
      return
    }

    setIsLoading(true)

    try {
      await register({ email, password, name })
      addToast({
        title: 'Account created!',
        description: 'Welcome to Pulse AI',
        type: 'success',
      })
      router.push('/chat')
    } catch (error) {
      addToast({
        title: 'Registration failed',
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
              Create Account
            </h1>
            <p className="text-muted">
              Join Pulse AI and start your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            
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

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-pulse hover:text-secondary-pulse">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}