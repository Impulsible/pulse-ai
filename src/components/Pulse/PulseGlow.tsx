// src/components/Pulse/PulseGlow.tsx
'use client'

import { cn } from '@/utils/cn'

interface PulseGlowProps {
  className?: string
  color?: string
  intensity?: 'low' | 'medium' | 'high'
}

export function PulseGlow({ className, color = '#4F8CFF', intensity = 'medium' }: PulseGlowProps) {
  const intensityStyles = {
    low: 'opacity-20 blur-3xl',
    medium: 'opacity-40 blur-2xl',
    high: 'opacity-60 blur-xl',
  }

  return (
    <div
      className={cn(
        'absolute rounded-full pointer-events-none',
        intensityStyles[intensity],
        className
      )}
      style={{
        backgroundColor: color,
        animation: 'pulse 3s ease-in-out infinite',
      }}
    />
  )
}