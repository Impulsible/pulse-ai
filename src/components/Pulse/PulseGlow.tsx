// src/components/Pulse/PulseGlow.tsx
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type GlowIntensity = 'subtle' | 'low' | 'medium' | 'high' | 'intense'
export type GlowShape = 'circle' | 'ellipse' | 'gradient-bloom' | 'aurora'
export type GlowMotion = 'static' | 'breathe' | 'pulse' | 'rotate' | 'drift'

interface PulseGlowProps {
  className?: string
  /** Primary color (accepts any CSS color) */
  color?: string
  /** Optional secondary color for gradient blends */
  colorSecondary?: string
  intensity?: GlowIntensity
  shape?: GlowShape
  motion?: GlowMotion
  /** Custom size in pixels */
  size?: number
  /** Animation speed multiplier */
  speed?: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
   INTENSITY PRESETS
   ═══════════════════════════════════════════════════════════════════════════════ */

const INTENSITY_STYLES: Record<GlowIntensity, { opacity: number; blur: number }> = {
  subtle:  { opacity: 0.10, blur: 80 },
  low:     { opacity: 0.20, blur: 60 },
  medium:  { opacity: 0.35, blur: 50 },
  high:    { opacity: 0.55, blur: 40 },
  intense: { opacity: 0.75, blur: 32 },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOTION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const MOTION_VARIANTS = {
  static: {},
  breathe: {
    scale: [1, 1.15, 1],
    opacity: [1, 0.7, 1],
  },
  pulse: {
    scale: [1, 1.35, 1],
    opacity: [0.9, 0.4, 0.9],
  },
  rotate: {
    rotate: [0, 360],
  },
  drift: {
    x: [-8, 8, -8],
    y: [-4, 4, -4],
  },
}

const MOTION_TRANSITIONS: Record<GlowMotion, object> = {
  static: {},
  breathe: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  pulse:   { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  rotate:  { duration: 20, repeat: Infinity, ease: 'linear' },
  drift:   { duration: 6, repeat: Infinity, ease: 'easeInOut' },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function PulseGlow({
  className,
  color = '#6366f1',
  colorSecondary,
  intensity = 'medium',
  shape = 'circle',
  motion: motionType = 'breathe',
  size,
  speed = 1,
}: PulseGlowProps) {
  const style = INTENSITY_STYLES[intensity]

  const background = useMemo(() => {
    switch (shape) {
      case 'circle':
        return color
      case 'ellipse':
        return `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`
      case 'gradient-bloom':
        return `radial-gradient(circle at center, ${color} 0%, ${colorSecondary ?? color} 45%, transparent 75%)`
      case 'aurora':
        return `conic-gradient(from 0deg, ${color}, ${colorSecondary ?? '#8b5cf6'}, ${color})`
      default:
        return color
    }
  }, [color, colorSecondary, shape])

  const transition = {
    ...MOTION_TRANSITIONS[motionType],
    duration: (MOTION_TRANSITIONS[motionType] as { duration?: number })?.duration
      ? (MOTION_TRANSITIONS[motionType] as { duration: number }).duration / speed
      : undefined,
  }

  return (
    <motion.div
      aria-hidden="true"
      animate={MOTION_VARIANTS[motionType]}
      transition={transition}
      className={cn('absolute rounded-full pointer-events-none', className)}
      style={{
        background,
        opacity: style.opacity,
        filter: `blur(${style.blur}px)`,
        width: size ? `${size}px` : undefined,
        height: size ? `${size}px` : undefined,
        willChange: motionType !== 'static' ? 'transform, opacity' : 'auto',
      }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPOSITE: PulseGlowGroup — pre-composed multi-layer glow
   ═══════════════════════════════════════════════════════════════════════════════ */

export function PulseGlowGroup({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <PulseGlow
        color="#6366f1"
        colorSecondary="#8b5cf6"
        shape="gradient-bloom"
        intensity="medium"
        motion="breathe"
        size={600}
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
      <PulseGlow
        color="#8b5cf6"
        intensity="low"
        motion="drift"
        size={400}
        className="top-1/4 left-1/4"
      />
      <PulseGlow
        color="#3b82f6"
        intensity="subtle"
        motion="drift"
        speed={0.7}
        size={350}
        className="bottom-1/4 right-1/4"
      />
    </div>
  )
}