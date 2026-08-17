/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Chat/TypingIndicator.tsx
'use client'

import { memo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

// ─── Types ───────────────────────────────────────────────────────────────────────
type IndicatorState = 'thinking' | 'typing' | 'listening' | 'searching' | 'analyzing'

interface TypingIndicatorProps {
  state?: IndicatorState
  model?: string
  showElapsed?: boolean
}

// ─── State Configuration ─────────────────────────────────────────────────────────
const STATE_CONFIG: Record<IndicatorState, {
  label: string
  hint: string
  accent: string
  rgb: string
  variant: 'dots' | 'wave' | 'orbit' | 'pulse' | 'scan'
}> = {
  thinking: {
    label: 'thinking',
    hint: 'Reasoning through your request',
    accent: '#818cf8',
    rgb: '129,140,248',
    variant: 'orbit',
  },
  typing: {
    label: 'generating',
    hint: 'Composing response',
    accent: '#818cf8',
    rgb: '129,140,248',
    variant: 'dots',
  },
  listening: {
    label: 'listening',
    hint: 'Capturing audio',
    accent: '#22d3ee',
    rgb: '34,211,238',
    variant: 'wave',
  },
  searching: {
    label: 'searching',
    hint: 'Looking through sources',
    accent: '#a78bfa',
    rgb: '167,139,250',
    variant: 'scan',
  },
  analyzing: {
    label: 'analyzing',
    hint: 'Processing information',
    accent: '#34d399',
    rgb: '52,211,153',
    variant: 'pulse',
  },
}

// ─── AI Avatar ───────────────────────────────────────────────────────────────────
function AIAvatar({ accent, rgb }: { accent: string; rgb: string }) {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-2xl blur-xl"
        style={{ background: `rgba(${rgb},0.15)` }}
      />

      {/* Pulsing rings */}
      <motion.div
        className="absolute -inset-1 rounded-2xl border"
        style={{ borderColor: `rgba(${rgb},0.3)` }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute -inset-2 rounded-2xl border"
        style={{ borderColor: `rgba(${rgb},0.15)` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
      />

      {/* Main avatar */}
      <div
        className="relative w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border"
        style={{
          background: `linear-gradient(135deg, rgba(${rgb},0.2), rgba(${rgb},0.05))`,
          borderColor: `rgba(${rgb},0.25)`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 30% 30%, rgba(${rgb},0.15), transparent 70%)` }}
        />
        <svg
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke={accent}
          strokeWidth="1.7" strokeLinecap="round"
          className="relative z-10 opacity-90"
        >
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04" />
        </svg>
      </div>

      {/* Status dot */}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ background: accent }}
        />
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-[#050508]"
          style={{ background: accent }}
        />
      </span>
    </div>
  )
}

// ─── Bouncing Dots ───────────────────────────────────────────────────────────────
function BouncingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
          className="block w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
        />
      ))}
    </div>
  )
}

// ─── Waveform Bars ───────────────────────────────────────────────────────────────
function WaveformBars({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-[3px] h-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.span
          key={i}
          animate={{ scaleY: [0.3, 1, 0.3] }}
          transition={{
            duration: 0.6 + (i % 3) * 0.15,
            repeat: Infinity,
            delay: i * 0.08,
            ease: 'easeInOut',
          }}
          className="block w-[2.5px] rounded-full origin-center h-full"
          style={{ background: color }}
        />
      ))}
    </div>
  )
}

// ─── Orbit Animation ─────────────────────────────────────────────────────────────
function OrbitLoader({ color }: { color: string }) {
  return (
    <div className="relative w-5 h-5">
      {/* Center dot */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      {/* Orbiting dot */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </motion.div>
      {/* Second orbiting dot (opposite direction) */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-60"
          style={{ background: color }}
        />
      </motion.div>
    </div>
  )
}

// ─── Pulse Loader ────────────────────────────────────────────────────────────────
function PulseLoader({ color }: { color: string }) {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      {[0, 0.4, 0.8].map((delay, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: color }}
          animate={{
            width: [4, 20],
            height: [4, 20],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay,
            ease: 'easeOut',
          }}
        />
      ))}
      <span
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
    </div>
  )
}

// ─── Scan Loader ─────────────────────────────────────────────────────────────────
function ScanLoader({ color }: { color: string }) {
  return (
    <div className="relative w-8 h-4 overflow-hidden rounded-full border" style={{ borderColor: `${color}30` }}>
      <motion.div
        className="absolute top-0 bottom-0 w-2 rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
        animate={{ x: [-8, 32] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─── Elapsed Timer ───────────────────────────────────────────────────────────────
function ElapsedTimer() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 100) / 10)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="text-[9px] font-mono text-white/25 tabular-nums">
      {elapsed.toFixed(1)}s
    </span>
  )
}

// ─── Loader Renderer ─────────────────────────────────────────────────────────────
function StateLoader({ variant, color }: { variant: string; color: string }) {
  switch (variant) {
    case 'dots': return <BouncingDots color={color} />
    case 'wave': return <WaveformBars color={color} />
    case 'orbit': return <OrbitLoader color={color} />
    case 'pulse': return <PulseLoader color={color} />
    case 'scan': return <ScanLoader color={color} />
    default: return <BouncingDots color={color} />
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════
export const TypingIndicator = memo(function TypingIndicator({
  state = 'typing',
  model = 'Pulse AI',
  showElapsed = true,
}: TypingIndicatorProps) {
  const cfg = STATE_CONFIG[state]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-start gap-3 mb-4"
    >
      {/* ── Avatar ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="flex-shrink-0 pt-1"
      >
        <AIAvatar accent={cfg.accent} rgb={cfg.rgb} />
      </motion.div>

      {/* ── Bubble ─────────────────────────────────── */}
      <div className="flex flex-col items-start gap-1.5 min-w-0">
        <div className="relative overflow-hidden rounded-2xl rounded-tl-md border backdrop-blur-xl"
          style={{
            background: 'rgba(11,12,20,0.85)',
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        >
          {/* Top accent */}
          <div
            className="absolute left-[14%] right-[14%] top-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)`, opacity: 0.5 }}
          />

          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(circle at 30% 50%, rgba(${cfg.rgb},0.15), transparent 70%)`,
            }}
          />

          {/* Header bar */}
          <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.04] bg-white/[0.01] px-3 py-1.5">
            <div className="flex items-center gap-2">
              {/* Brand */}
              <div
                className="flex items-center gap-1.5 rounded-full border px-2 py-0.5"
                style={{
                  borderColor: `${cfg.accent}30`,
                  background: `${cfg.accent}10`,
                }}
              >
                <span
                  className="text-[9px] font-mono font-bold tracking-[0.12em]"
                  style={{ color: cfg.accent }}
                >
                  PULSE
                </span>
                <span
                  className="text-[8px] font-mono font-bold opacity-70"
                  style={{ color: cfg.accent }}
                >
                  AI
                </span>
              </div>

              {/* Model chip */}
              <span className="text-[9px] font-mono text-white/25">{model}</span>
            </div>

            {/* Right: elapsed */}
            {showElapsed && (
              <div className="flex items-center gap-1.5">
                <span
                  className="relative flex h-1 w-1"
                >
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ background: cfg.accent }}
                  />
                  <span
                    className="relative inline-flex h-1 w-1 rounded-full"
                    style={{ background: cfg.accent }}
                  />
                </span>
                <ElapsedTimer />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="relative flex items-center gap-3 px-4 py-3">
            {/* Loader visual */}
            <div className="flex-shrink-0 flex items-center justify-center min-w-[24px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={cfg.variant}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <StateLoader variant={cfg.variant} color={cfg.accent} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/[0.06]" />

            {/* Text */}
            <div className="flex flex-col min-w-0">
              <AnimatePresence mode="wait">
                <motion.span
                  key={cfg.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-[12px] font-mono font-semibold leading-tight"
                  style={{ color: cfg.accent }}
                >
                  {cfg.label}
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="inline-block ml-0.5"
                  >
                    …
                  </motion.span>
                </motion.span>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.span
                  key={cfg.hint}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="text-[10px] font-mono text-white/25 leading-tight mt-0.5"
                >
                  {cfg.hint}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})