// src/components/Chat/TypingIndicator.tsx
'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────────────────
type IndicatorState = 'thinking' | 'typing' | 'listening'

interface TypingIndicatorProps {
  state?: IndicatorState
  model?: string
}

// ─── AI Avatar (matches MessageBubble) ───────────────────────────────────────────
function AIAvatar() {
  return (
    <div className="
      w-7 h-7 rounded-xl flex-shrink-0
      bg-gradient-to-br from-indigo-500/15 to-violet-500/15
      border border-indigo-500/20
      flex items-center justify-center
    ">
      <svg
        width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="rgba(129,140,248,0.8)"
        strokeWidth="1.8" strokeLinecap="round"
      >
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04" />
      </svg>
    </div>
  )
}

// ─── Dot cluster (typing) ─────────────────────────────────────────────────────────
function BouncingDots() {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
          className="block w-1.5 h-1.5 rounded-full bg-indigo-400/60"
        />
      ))}
    </div>
  )
}

// ─── Bar waveform (thinking / listening) ─────────────────────────────────────────
function WaveformBars({ color = 'rgba(99,102,241,0.55)' }: { color?: string }) {
  return (
    <div className="flex items-center gap-[2px] h-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          animate={{ scaleY: [0.3, 1, 0.3] }}
          transition={{
            duration: 0.65,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
          className="block w-[2px] rounded-full origin-bottom"
          style={{
            height: '100%',
            background: color,
          }}
        />
      ))}
    </div>
  )
}

// ─── State config ─────────────────────────────────────────────────────────────────
const STATE_CONFIG: Record<
  IndicatorState,
  { label: string; accentRgb: string; accentColor: string }
> = {
  thinking:  { label: 'reasoning…',   accentRgb: '99,102,241',  accentColor: '#6366f1' },
  typing:    { label: 'generating…',  accentRgb: '99,102,241',  accentColor: '#6366f1' },
  listening: { label: 'listening…',   accentRgb: '56,189,248',  accentColor: '#38bdf8' },
}

// ─── Main component ───────────────────────────────────────────────────────────────
export const TypingIndicator = memo(function TypingIndicator({
  state = 'typing',
  model,
}: TypingIndicatorProps) {
  const cfg = STATE_CONFIG[state]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-end gap-2.5 mb-4"
    >
      {/* ── Avatar ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.22 }}
        className="flex-shrink-0 mb-5"
      >
        <AIAvatar />
      </motion.div>

      {/* ── Bubble ─────────────────────────────────────────── */}
      <div className="flex flex-col items-start gap-1.5">
        {/* Author */}
        <span className="text-[9px] font-mono text-white/20 px-1">
          pulse_ai{model ? ` · ${model}` : ''}
        </span>

        <div
          className="relative flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-sm"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Left accent bar */}
          <div
            className="absolute top-0 left-0 bottom-0 w-0.5 rounded-full"
            style={{ background: `rgba(${cfg.accentRgb},0.35)` }}
          />

          {/* Indicator visual */}
          <div className="pl-2">
            <AnimatePresence mode="wait">
              {state === 'typing' ? (
                <motion.div
                  key="dots"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                >
                  <BouncingDots />
                </motion.div>
              ) : (
                <motion.div
                  key="wave"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                >
                  <WaveformBars
                    color={
                      state === 'listening'
                        ? 'rgba(56,189,248,0.55)'
                        : 'rgba(99,102,241,0.55)'
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Label */}
          <AnimatePresence mode="wait">
            <motion.span
              key={cfg.label}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18 }}
              className="text-[10px] font-mono"
              style={{ color: `rgba(${cfg.accentRgb},0.6)` }}
            >
              {cfg.label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
})