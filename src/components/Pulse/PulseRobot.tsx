/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Pulse/PulseRobot.tsx
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import type { PulseState } from '@/utils/constants'

interface PulseRobotProps {
  state?: PulseState
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PulseRobot({ state = 'idle', size = 'md', className }: PulseRobotProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 1000)
    return () => clearTimeout(timer)
  }, [state])

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  const stateClasses = {
    idle: 'opacity-80',
    listening: 'opacity-100 scale-110',
    thinking: 'opacity-100 animate-pulse-slow',
    speaking: 'opacity-100',
    error: 'opacity-100 border-red-500',
  }

  return (
    <div className={cn('relative', className)}>
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-primary-pulse/20 blur-xl transition-all duration-500',
          state === 'thinking' && 'bg-primary-pulse/40 animate-pulse-slow',
          state === 'listening' && 'bg-secondary-pulse/40',
          state === 'error' && 'bg-red-500/20'
        )}
      />
      
      {/* Robot head */}
      <div
        className={cn(
          'relative rounded-full border-2 border-primary-pulse',
          'bg-surface flex items-center justify-center',
          'transition-all duration-500',
          sizeClasses[size],
          stateClasses[state],
          isAnimating && 'animate-bounce-slow'
        )}
      >
        {/* Eyes */}
        <div className="flex gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full bg-primary-pulse',
              'transition-all duration-300',
              state === 'listening' && 'animate-ping'
            )}
          />
          <div
            className={cn(
              'w-2 h-2 rounded-full bg-secondary-pulse',
              'transition-all duration-300',
              state === 'thinking' && 'animate-pulse'
            )}
          />
        </div>
      </div>
    </div>
  )
}