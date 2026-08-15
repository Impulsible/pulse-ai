// src/components/Pulse/PulseStatus.tsx
'use client'

import { cn } from '@/utils/cn'
import type { PulseState } from '@/utils/constants'

interface PulseStatusProps {
  state: PulseState
  className?: string
}

export function PulseStatus({ state, className }: PulseStatusProps) {
  const statusConfig = {
    idle: {
      label: 'Ready',
      color: 'bg-gray-400',
      pulse: false,
    },
    listening: {
      label: 'Listening',
      color: 'bg-secondary-pulse',
      pulse: true,
    },
    thinking: {
      label: 'Thinking',
      color: 'bg-primary-pulse',
      pulse: true,
    },
    speaking: {
      label: 'Speaking',
      color: 'bg-green-500',
      pulse: false,
    },
    error: {
      label: 'Error',
      color: 'bg-red-500',
      pulse: false,
    },
  }

  const config = statusConfig[state]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            config.color,
            config.pulse && 'animate-ping absolute inset-0'
          )}
        />
        <div className={cn('w-2 h-2 rounded-full relative', config.color)} />
      </div>
      <span className="text-sm text-muted">{config.label}</span>
    </div>
  )
}