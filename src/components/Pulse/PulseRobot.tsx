// src/components/Pulse/PulseRobot.tsx
'use client'

import { motion, type Easing } from 'framer-motion'
import { cn } from '@/utils/cn'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type RobotSize = 'sm' | 'md' | 'lg'
export type RobotState = 'idle' | 'thinking' | 'typing' | 'listening' | 'speaking' | 'error'

interface PulseRobotProps {
  size?: RobotSize
  state?: RobotState
  className?: string
  onClick?: () => void
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════════════════════ */

const SIZES: Record<RobotSize, {
  container: number
  inner: number
  eye: number
  pupil: number
  gap: number
}> = {
  sm: { container: 32, inner: 24, eye: 8,  pupil: 4, gap: 4 },
  md: { container: 48, inner: 36, eye: 12, pupil: 6, gap: 6 },
  lg: { container: 64, inner: 48, eye: 16, pupil: 8, gap: 8 },
}

// Cast the cubic bezier to Easing for Framer Motion v11+ type safety
const EASE_IN_OUT: Easing = [0.4, 0, 0.6, 1] as unknown as Easing
const EASE_OUT:    Easing = [0.23, 1, 0.32, 1] as unknown as Easing

/* ─── Per-state color palette ─────────────────────────────────────────────── */
type StateColors = {
  pupil: string
  glow: string
  glowShadow: string
  statusDot: string
  gradientFrom: string
  gradientTo: string
  border: string
}

const STATE_COLORS: Record<RobotState, StateColors> = {
  idle: {
    pupil: 'bg-indigo-400',
    glow: 'rgba(129, 140, 248, 0.8)',
    glowShadow: 'from-indigo-500/30 to-violet-500/30',
    statusDot: 'bg-emerald-400',
    gradientFrom: 'from-indigo-500/20',
    gradientTo: 'to-violet-500/20',
    border: 'border-white/[0.15]',
  },
  thinking: {
    pupil: 'bg-violet-400',
    glow: 'rgba(167, 139, 250, 0.9)',
    glowShadow: 'from-violet-500/40 to-fuchsia-500/40',
    statusDot: 'bg-violet-400',
    gradientFrom: 'from-violet-500/25',
    gradientTo: 'to-fuchsia-500/25',
    border: 'border-violet-400/25',
  },
  typing: {
    pupil: 'bg-indigo-400',
    glow: 'rgba(129, 140, 248, 0.85)',
    glowShadow: 'from-indigo-500/35 to-blue-500/35',
    statusDot: 'bg-indigo-400',
    gradientFrom: 'from-indigo-500/25',
    gradientTo: 'to-blue-500/25',
    border: 'border-indigo-400/25',
  },
  listening: {
    pupil: 'bg-emerald-400',
    glow: 'rgba(52, 211, 153, 0.9)',
    glowShadow: 'from-emerald-500/40 to-cyan-500/40',
    statusDot: 'bg-emerald-400',
    gradientFrom: 'from-emerald-500/25',
    gradientTo: 'to-cyan-500/25',
    border: 'border-emerald-400/30',
  },
  speaking: {
    pupil: 'bg-sky-400',
    glow: 'rgba(56, 189, 248, 0.9)',
    glowShadow: 'from-sky-500/40 to-indigo-500/40',
    statusDot: 'bg-sky-400',
    gradientFrom: 'from-sky-500/25',
    gradientTo: 'to-indigo-500/25',
    border: 'border-sky-400/30',
  },
  error: {
    pupil: 'bg-red-400',
    glow: 'rgba(248, 113, 113, 0.9)',
    glowShadow: 'from-red-500/40 to-orange-500/40',
    statusDot: 'bg-red-400',
    gradientFrom: 'from-red-500/25',
    gradientTo: 'to-orange-500/25',
    border: 'border-red-400/35',
  },
}

/* ─── Human-readable labels for a11y ──────────────────────────────────────── */
const STATE_LABELS: Record<RobotState, string> = {
  idle:      'ready',
  thinking:  'thinking',
  typing:    'typing',
  listening: 'listening',
  speaking:  'speaking',
  error:     'error',
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION BUILDERS
   ═══════════════════════════════════════════════════════════════════════════════ */

function getEyeAnimation(state: RobotState) {
  switch (state) {
    case 'thinking':
      return {
        animate: { scaleY: [1, 0.3, 1] },
        transition: { duration: 0.8, repeat: Infinity, ease: EASE_IN_OUT },
      }
    case 'typing':
      return {
        animate: { scaleY: [1, 0.4, 1] },
        transition: { duration: 0.6, repeat: Infinity, ease: EASE_IN_OUT },
      }
    case 'listening':
      return {
        animate: { scaleX: [1, 0.7, 1], scaleY: [1, 0.7, 1] },
        transition: { duration: 0.5, repeat: Infinity, ease: EASE_IN_OUT },
      }
    case 'speaking':
      return {
        animate: { scaleY: [1, 0.85, 1, 0.9, 1] },
        transition: { duration: 0.4, repeat: Infinity, ease: EASE_IN_OUT },
      }
    case 'error':
      return {
        animate: { scaleX: [1, 0.5, 1], scaleY: [1, 0.5, 1] },
        transition: { duration: 0.35, repeat: Infinity, ease: EASE_IN_OUT },
      }
    default:
      return {
        animate: { scaleY: 1 },
        transition: { duration: 0 },
      }
  }
}

function getPulseAnimation(state: RobotState) {
  switch (state) {
    case 'thinking':
      return {
        animate: { opacity: [0.3, 1, 0.3] },
        transition: { duration: 1.2, repeat: Infinity, ease: EASE_IN_OUT },
      }
    case 'typing':
      return {
        animate: { opacity: [0.4, 1, 0.4] },
        transition: { duration: 0.9, repeat: Infinity, ease: EASE_IN_OUT },
      }
    case 'listening':
      return {
        animate: { scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] },
        transition: { duration: 0.7, repeat: Infinity, ease: EASE_IN_OUT },
      }
    case 'speaking':
      return {
        animate: { scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] },
        transition: { duration: 0.5, repeat: Infinity, ease: EASE_IN_OUT },
      }
    case 'error':
      return {
        animate: { x: [-2, 2, -2, 2, 0], opacity: [1, 0.7, 1, 0.7, 1] },
        transition: { duration: 0.5, repeat: Infinity, ease: EASE_IN_OUT },
      }
    default:
      return {
        animate: { opacity: 1 },
        transition: { duration: 0 },
      }
  }
}

function getStatusAnimation(state: RobotState) {
  if (state === 'idle') {
    return {
      animate: { opacity: [0.5, 1, 0.5] },
      transition: { duration: 2, repeat: Infinity, ease: EASE_IN_OUT },
    }
  }
  if (state === 'error') {
    return {
      animate: { opacity: [1, 0.3, 1], scale: [1, 1.2, 1] },
      transition: { duration: 0.4, repeat: Infinity, ease: EASE_IN_OUT },
    }
  }
  return {
    animate: { opacity: [0.3, 1, 0.3] },
    transition: { duration: 0.6, repeat: Infinity, ease: EASE_IN_OUT },
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function PulseRobot({
  size = 'md',
  state = 'idle',
  className,
  onClick,
}: PulseRobotProps) {
  const dims = SIZES[size]
  const isInteractive = !!onClick
  const colors = STATE_COLORS[state]

  const eyeAnim    = getEyeAnimation(state)
  const pulseAnim  = getPulseAnimation(state)
  const statusAnim = getStatusAnimation(state)

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center',
        isInteractive && 'cursor-pointer',
        className
      )}
      style={{
        width: dims.container,
        height: dims.container,
      }}
      whileHover={isInteractive ? { scale: 1.05 } : undefined}
      whileTap={isInteractive ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      aria-label={isInteractive ? `Pulse robot: ${STATE_LABELS[state]}` : undefined}
    >
      {/* Outer glow ring */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br blur-md transition-colors duration-500',
          colors.glowShadow
        )}
        animate={pulseAnim.animate}
        transition={pulseAnim.transition}
      />

      {/* Inner circle */}
      <motion.div
        className={cn(
          'relative rounded-full bg-gradient-to-br border flex items-center justify-center transition-colors duration-500',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
          colors.gradientFrom,
          colors.gradientTo,
          colors.border
        )}
        style={{
          width: dims.inner,
          height: dims.inner,
        }}
        animate={pulseAnim.animate}
        transition={pulseAnim.transition}
      >
        {/* Eyes container */}
        <div
          className="flex items-center"
          style={{ gap: dims.gap }}
        >
          {/* Left eye */}
          <div
            className="rounded-full bg-white/20 border border-white/10 flex items-center justify-center"
            style={{ width: dims.eye, height: dims.eye }}
          >
            <motion.div
              className={cn('rounded-full transition-colors duration-500', colors.pupil)}
              style={{
                width: dims.pupil,
                height: dims.pupil,
                boxShadow: `0 0 6px ${colors.glow}`,
              }}
              animate={eyeAnim.animate}
              transition={eyeAnim.transition}
            />
          </div>

          {/* Right eye */}
          <div
            className="rounded-full bg-white/20 border border-white/10 flex items-center justify-center"
            style={{ width: dims.eye, height: dims.eye }}
          >
            <motion.div
              className={cn('rounded-full transition-colors duration-500', colors.pupil)}
              style={{
                width: dims.pupil,
                height: dims.pupil,
                boxShadow: `0 0 6px ${colors.glow}`,
              }}
              animate={eyeAnim.animate}
              transition={eyeAnim.transition}
            />
          </div>
        </div>

        {/* Mouth indicator (visible when active — hidden for idle) */}
        {state !== 'idle' && (
          <motion.div
            className={cn(
              'absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
              colors.pupil,
              'opacity-60'
            )}
            animate={{
              scale: state === 'speaking' ? [1, 1.8, 1] : [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: state === 'speaking' ? 0.4 : 0.8,
              repeat: Infinity,
              ease: EASE_IN_OUT,
            }}
          />
        )}
      </motion.div>

      {/* Status indicator */}
      <div className="absolute -bottom-0.5 -right-0.5">
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full animate-ping opacity-60 transition-colors duration-500',
              colors.statusDot
            )}
          />
          <motion.span
            className={cn(
              'relative inline-flex h-2 w-2 rounded-full border border-[#0a0a0f] transition-colors duration-500',
              colors.statusDot
            )}
            animate={statusAnim.animate}
            transition={statusAnim.transition}
          />
        </span>
      </div>
    </motion.div>
  )
}