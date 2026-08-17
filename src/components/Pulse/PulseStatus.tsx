// src/components/Pulse/PulseStatus.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { PulseState } from '@/utils/constants'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type StatusSize = 'sm' | 'md' | 'lg'
export type StatusVariant = 'inline' | 'pill' | 'card'

interface PulseStatusProps {
  state: PulseState
  size?: StatusSize
  variant?: StatusVariant
  showLabel?: boolean
  className?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STATUS CONFIG
   ═══════════════════════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<PulseState, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  glowColor: string
  animate: boolean
  intensity: number
}> = {
  idle: {
    label: 'Ready',
    color: 'text-white/50',
    bgColor: 'bg-white/[0.04]',
    borderColor: 'border-white/[0.08]',
    glowColor: 'rgba(255,255,255,0.2)',
    animate: false,
    intensity: 0.5,
  },
  listening: {
    label: 'Listening',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/25',
    glowColor: 'rgba(16,185,129,0.5)',
    animate: true,
    intensity: 1,
  },
  thinking: {
    label: 'Thinking',
    color: 'text-violet-300',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/25',
    glowColor: 'rgba(167,139,250,0.5)',
    animate: true,
    intensity: 1,
  },
  speaking: {
    label: 'Speaking',
    color: 'text-sky-300',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/25',
    glowColor: 'rgba(56,189,248,0.5)',
    animate: true,
    intensity: 0.8,
  },
  error: {
    label: 'Error',
    color: 'text-red-300',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/25',
    glowColor: 'rgba(239,68,68,0.5)',
    animate: false,
    intensity: 1,
  },
}

const SIZE_CONFIG: Record<StatusSize, { dot: string; text: string; gap: string; padding: string }> = {
  sm: { dot: 'w-1.5 h-1.5', text: 'text-[10px]', gap: 'gap-1.5', padding: 'px-2 py-1' },
  md: { dot: 'w-2 h-2',     text: 'text-[11px]', gap: 'gap-2',   padding: 'px-2.5 py-1.5' },
  lg: { dot: 'w-2.5 h-2.5', text: 'text-xs',     gap: 'gap-2.5', padding: 'px-3 py-2' },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function PulseStatus({
  state,
  size = 'md',
  variant = 'inline',
  showLabel = true,
  className,
}: PulseStatusProps) {
  const cfg = STATUS_CONFIG[state]
  const dims = SIZE_CONFIG[size]

  const wrapperClasses = cn(
    'inline-flex items-center transition-all duration-300',
    dims.gap,
    variant === 'pill' && cn('rounded-full border', dims.padding, cfg.bgColor, cfg.borderColor),
    variant === 'card' && cn('rounded-lg border', dims.padding, cfg.bgColor, cfg.borderColor),
    className
  )

  return (
    <div className={wrapperClasses} role="status" aria-live="polite">
      {/* Animated dot */}
      <div className="relative flex-shrink-0">
        {cfg.animate && (
          <motion.span
            className={cn('absolute inset-0 rounded-full', dims.dot)}
            style={{
              background: `radial-gradient(circle, ${cfg.glowColor}, transparent)`,
              boxShadow: `0 0 8px ${cfg.glowColor}`,
            }}
            animate={{
              scale: [1, 2.5, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: state === 'thinking' ? 1.2 : 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        <motion.span
          className={cn('relative inline-block rounded-full', dims.dot)}
          style={{
            background: cfg.glowColor.replace('0.5', String(cfg.intensity)),
            boxShadow: `0 0 6px ${cfg.glowColor}`,
          }}
          animate={
            cfg.animate
              ? { scale: [1, 1.15, 1] }
              : state === 'error'
              ? { scale: [1, 1.1, 1] }
              : {}
          }
          transition={{
            duration: state === 'thinking' ? 1.2 : 2,
            repeat: cfg.animate || state === 'error' ? Infinity : 0,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Label with state transition */}
      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'font-mono font-medium tracking-wide',
              dims.text,
              cfg.color,
              variant === 'inline' && 'text-white/60'
            )}
          >
            {cfg.label}
            {cfg.animate && state !== 'listening' && (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="inline-block ml-0.5"
              >
                …
              </motion.span>
            )}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  )
}