/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/purity */
// src/components/Landing/Hero.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from 'framer-motion'
import { PulseRobot } from '@/components/Pulse/PulseRobot'
import { PulseOrb } from '@/components/Pulse/PulseOrb'

// Constants
const SPRING_CONFIG = { stiffness: 40, damping: 18 }

// Terminal Line Component
interface TerminalLineProps {
  prefix: string
  text: string
  color?: string
  delay: number
  speed?: number
}

function TerminalLine({ prefix, text, color = 'text-white/60', delay, speed = 35 }: TerminalLineProps) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true)
      let i = 0
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(interval)
      }, speed)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(startTimer)
  }, [text, delay, speed])

  if (!started && displayed === '') return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-2 font-mono text-xs sm:text-sm leading-relaxed"
    >
      <span className="text-indigo-400 flex-shrink-0 mt-px select-none">{prefix}</span>
      <span className={color}>
        {displayed}
        {displayed.length < text.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-0.5 align-middle"
          />
        )}
      </span>
    </motion.div>
  )
}

// Glitch Text
function GlitchText({ text, className }: { text: string; className?: string }) {
  const [glitching, setGlitching] = useState(false)
  const chars = '!@#$%^&*<>?/\\|[]{}~`'

  const triggerGlitch = useCallback(() => {
    setGlitching(true)
    setTimeout(() => setGlitching(false), 400)
  }, [])

  useEffect(() => {
    const interval = setInterval(triggerGlitch, 5000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [triggerGlitch])

  if (!glitching) return <span className={className}>{text}</span>

  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          animate={{
            opacity: [1, 0.3, 1],
            x: [0, Math.random() * 4 - 2, 0],
          }}
          transition={{ duration: 0.08, delay: i * 0.02 }}
          className={i % 3 === 0 ? 'text-indigo-400' : ''}
        >
          {i % 4 === 0 && glitching
            ? chars[Math.floor(Math.random() * chars.length)]
            : char}
        </motion.span>
      ))}
    </span>
  )
}

// Matrix Rain Column - FIXED
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const fontSize = 11
    let cols: number[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      cols = Array.from(
        { length: Math.floor(canvas.width / fontSize) },
        () => Math.random() * -canvas.height
      )
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.04)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px monospace`

      cols.forEach((y, i) => {
        const chars = '01アイウエオカキクケコABCDEF∑∆Ω'
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize

        const progress = (y + canvas.height) / canvas.height
        const alpha = Math.max(0, Math.min(0.12, progress * 0.12))

        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`
        ctx.fillText(char, x, y)

        cols[i] = y > canvas.height + fontSize * 20 ? -fontSize * 20 : y + fontSize
      })

      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [isClient])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: isClient ? 1 : 0 }}
    />
  )
}

// Waveform Visualizer
function WaveformVisualizer({ active = true }: { active?: boolean }) {
  const bars = 28

  return (
    <div className="flex items-center gap-[2px] h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-gradient-to-t from-indigo-500 to-violet-400"
          animate={
            active
              ? {
                  height: [
                    `${8 + Math.random() * 20}px`,
                    `${8 + Math.random() * 28}px`,
                    `${8 + Math.random() * 14}px`,
                  ],
                }
              : { height: '4px' }
          }
          transition={{
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            repeatType: 'mirror',
            delay: i * 0.03,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Capability Card
interface CapabilityCardProps {
  icon: React.ReactNode
  title: string
  description: string
  status: 'active' | 'ready' | 'processing'
  delay: number
  accentColor: string
}

function CapabilityCard({ icon, title, description, status, delay, accentColor }: CapabilityCardProps) {
  const statusConfig = {
    active: { label: 'ACTIVE', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    ready: { label: 'READY', dot: 'bg-indigo-400', text: 'text-indigo-400' },
    processing: { label: 'PROCESSING', dot: 'bg-amber-400', text: 'text-amber-400' },
  }
  const cfg = statusConfig[status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 cursor-default"
    >
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${accentColor}`} />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 70%)` }}
      />

      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:border-white/[0.1] transition-colors">
            {icon}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`relative flex h-1.5 w-1.5`}>
              {status === 'active' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            </span>
            <span className={`text-[9px] font-bold tracking-widest ${cfg.text} font-mono`}>
              {cfg.label}
            </span>
          </div>
        </div>
        <p className="text-sm font-semibold text-white/90 mb-1">{title}</p>
        <p className="text-[11px] text-white/35 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// Command Terminal
function CommandTerminal() {
  const [inputVal, setInputVal] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [response, setResponse] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = [
    'Analyze my codebase for bugs',
    'Write a marketing email',
    'Explain quantum computing',
    'Build a REST API',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    setSubmitted(true)
    const replies = [
      'Processing your request with GPT-4o...',
      'Analyzing context and generating response...',
      'Running inference on your prompt...',
    ]
    let charI = 0
    const reply = replies[Math.floor(Math.random() * replies.length)]
    const interval = setInterval(() => {
      charI++
      setResponse(reply.slice(0, charI))
      if (charI >= reply.length) clearInterval(interval)
    }, 30)
  }

  const handleSuggestion = (s: string) => {
    setInputVal(s)
    inputRef.current?.focus()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0a0a0f]/80 backdrop-blur-2xl shadow-2xl shadow-black/50"
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50 hover:bg-red-500/80 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50 hover:bg-amber-500/80 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 hover:bg-emerald-500/80 transition-colors" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[10px] font-mono text-white/20 select-none">
            pulse-ai — terminal v3.0
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono text-emerald-400">connected</span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-4 space-y-2 min-h-[180px]">
        <TerminalLine prefix="$" text="pulse --connect --model gpt-4o" delay={200} color="text-white/50" />
        <TerminalLine prefix=">" text="✓ Connection established. Model ready." delay={1200} color="text-emerald-400/80" />
        <TerminalLine prefix=">" text="✓ Context window: 128k tokens" delay={1900} color="text-white/30" />
        <TerminalLine prefix=">" text="✓ Voice synthesis: enabled" delay={2400} color="text-white/30" />
        <TerminalLine prefix=">" text="Pulse is ready. What can I help you build?" delay={2900} color="text-indigo-300/80" />

        {submitted && (
          <>
            <TerminalLine prefix="$" text={`ask "${inputVal}"`} delay={100} color="text-white/60" />
            <div className="flex items-start gap-2 font-mono text-xs leading-relaxed mt-1">
              <span className="text-violet-400 flex-shrink-0">~</span>
              <span className="text-violet-300/70">
                {response}
                {response.length < 40 && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-1.5 h-3 bg-violet-400 ml-0.5 align-middle"
                  />
                )}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Suggestion chips */}
      {!submitted && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/35 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-4">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] transition-all duration-300">
          <span className="font-mono text-indigo-400 text-sm flex-shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="ask pulse anything..."
            className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-white/80 placeholder:text-white/20 outline-none caret-indigo-400"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 text-xs font-mono font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            run
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// Robot Identity Card
function RobotIdentityCard() {
  const [heartbeat, setHeartbeat] = useState(72)
  const [uptime] = useState('47d 12h 33m')
  const [thoughts, setThoughts] = useState(0)

  const thoughtList = [
    'Monitoring 3 active sessions...',
    'Learning from conversation patterns...',
    'Optimizing response strategies...',
    'Processing background tasks...',
  ]

  useEffect(() => {
    const hbInterval = setInterval(() => {
      setHeartbeat(68 + Math.floor(Math.random() * 12))
    }, 2000)
    const thoughtInterval = setInterval(() => {
      setThoughts((p) => (p + 1) % thoughtList.length)
    }, 3000)
    return () => {
      clearInterval(hbInterval)
      clearInterval(thoughtInterval)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="relative group"
    >
      {/* Outer glow */}
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />

      <div className="relative rounded-3xl border border-white/[0.07] bg-[#0a0a0f]/60 backdrop-blur-2xl overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        {/* Corner decoration */}
        <div className="absolute top-3 right-3 w-12 h-12 opacity-10">
          <svg viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="white" strokeWidth="0.5" />
            <circle cx="24" cy="24" r="12" stroke="white" strokeWidth="0.5" />
            <line x1="24" y1="4" x2="24" y2="44" stroke="white" strokeWidth="0.5" />
            <line x1="4" y1="24" x2="44" y2="24" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Robot visual */}
        <div className="relative flex flex-col items-center pt-8 pb-0 px-8">
          {/* Halo glow */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-indigo-500/[0.06] blur-3xl pointer-events-none" />

          {/* Spinning ring */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 -m-5 rounded-full border border-dashed border-indigo-500/[0.15]"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 -m-10 rounded-full border border-dashed border-violet-500/[0.08]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-400/50 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
            </motion.div>

            <PulseOrb size={180} />
            <div className="absolute inset-0 flex items-center justify-center">
              <PulseRobot size="md" state="idle" />
            </div>
          </div>

          {/* Name badge */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <GlitchText
                text="PULSE"
                className="text-2xl font-black tracking-[0.15em] text-white font-mono"
              />
              <span className="text-[10px] font-bold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                v3.0
              </span>
            </div>
            <p className="text-[11px] text-white/30 font-mono tracking-wider">
              AI_ENTITY / COGNITIVE_CORE
            </p>
          </div>
        </div>

        {/* Voice wave */}
        <div className="flex justify-center px-8 py-4">
          <WaveformVisualizer active />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.05] border-t border-white/[0.05]">
          {[
            { label: 'HEARTBEAT', value: `${heartbeat}bpm`, color: 'text-rose-400' },
            { label: 'UPTIME', value: uptime, color: 'text-emerald-400' },
            { label: 'IQ SCORE', value: '∞', color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5 py-3 px-2">
              <span className={`text-sm font-bold font-mono ${stat.color} tabular-nums`}>
                {stat.value}
              </span>
              <span className="text-[8px] font-mono text-white/20 tracking-widest text-center leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Current thought */}
        <div className="border-t border-white/[0.05] px-4 py-3">
          <div className="flex items-start gap-2">
            <div className="flex gap-0.5 mt-1 flex-shrink-0">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [1, 2, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.2 }}
                  className="w-0.5 h-2.5 bg-indigo-400/60 rounded-full origin-bottom"
                />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={thoughts}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] text-white/30 font-mono leading-snug"
              >
                {thoughtList[thoughts]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Live Feed Ticker
function LiveFeedTicker() {
  const events = [
    { type: 'query', text: 'User asked about React hooks', time: '0s ago' },
    { type: 'code', text: 'Generated TypeScript interface', time: '4s ago' },
    { type: 'voice', text: 'Voice session started', time: '12s ago' },
    { type: 'analysis', text: 'Analyzed 3 documents', time: '28s ago' },
    { type: 'query', text: 'Summarized meeting notes', time: '45s ago' },
  ]

  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((p) => (p + 1) % events.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const typeColors: Record<string, string> = {
    query: 'text-indigo-400 bg-indigo-400/10',
    code: 'text-emerald-400 bg-emerald-400/10',
    voice: 'text-violet-400 bg-violet-400/10',
    analysis: 'text-amber-400 bg-amber-400/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="rounded-2xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[9px] font-mono font-bold tracking-widest text-white/25 uppercase">
          Live Activity Feed
        </span>
        <div className="ml-auto text-[9px] font-mono text-white/15">
          {events.length} events
        </div>
      </div>

      <div className="relative h-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 flex items-center gap-2.5 px-3"
          >
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${typeColors[events[current].type]}`}>
              {events[current].type}
            </span>
            <span className="text-[11px] text-white/40 font-mono flex-1 truncate">
              {events[current].text}
            </span>
            <span className="text-[9px] font-mono text-white/20 flex-shrink-0">
              {events[current].time}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Word Reveal Headline - FIXED with min-height
function WordRevealHeadline() {
  const line1 = ['Not', 'a', 'chatbot.']
  const line2 = ['An', 'AI', 'entity.']

  return (
    <div className="overflow-hidden" style={{ minHeight: '2.5em' }}>
      {/* Line 1 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {line1.map((word, i) => (
          <motion.span
            key={word}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.3 + i * 0.1,
              duration: 0.7,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="inline-block text-white/90"
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* Line 2 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {line2.map((word, i) => (
          <motion.span
            key={word}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.55 + i * 0.1,
              duration: 0.7,
              ease: [0.23, 1, 0.32, 1],
            }}
            className={`inline-block ${
              word === 'AI'
                ? 'bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent'
                : word === 'entity.'
                ? 'bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'
                : 'text-white/90'
            }`}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

// Ambient Background
function AmbientBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Matrix rain — very subtle */}
      <div className="absolute inset-0 opacity-40">
        <MatrixRain />
      </div>

      {/* Deep glow bottom left */}
      <div
        className="absolute bottom-0 left-0 w-[60vw] h-[60vh]"
        style={{
          background: 'radial-gradient(ellipse at 0% 100%, rgba(99,102,241,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Deep glow top right */}
      <div
        className="absolute top-0 right-0 w-[50vw] h-[50vh]"
        style={{
          background: 'radial-gradient(ellipse at 100% 0%, rgba(139,92,246,0.05) 0%, transparent 60%)',
        }}
      />

      {/* Horizontal divider lines */}
      {[20, 40, 60, 80].map((pos) => (
        <div
          key={pos}
          className="absolute left-0 right-0 h-px opacity-[0.03]"
          style={{ top: `${pos}%`, background: 'linear-gradient(90deg, transparent, white, transparent)' }}
        />
      ))}

      {/* Vertical divider lines */}
      {[25, 50, 75].map((pos) => (
        <div
          key={pos}
          className="absolute top-0 bottom-0 w-px opacity-[0.02]"
          style={{ left: `${pos}%`, background: 'linear-gradient(180deg, transparent, white, transparent)' }}
        />
      ))}
    </div>
  )
}

// Navigation Dots
function NavDots() {
  const sections = ['hero', 'features', 'how-it-works', 'pricing', 'about']
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-2"
    >
      {sections.map((s, i) => (
        <Link key={s} href={`/#${s}`}>
          <motion.div
            whileHover={{ scale: 1.4 }}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              i === 0
                ? 'h-5 bg-indigo-400'
                : 'h-1.5 bg-white/20 hover:bg-white/40'
            }`}
          />
        </Link>
      ))}
    </motion.div>
  )
}

// Main Hero
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const leftY = useTransform(scrollYProgress, [0, 1], ['0px', '-120px'])
  const rightY = useTransform(scrollYProgress, [0, 1], ['0px', '-60px'])
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const sX = useSpring(mouseX, SPRING_CONFIG)
  const sY = useSpring(mouseY, SPRING_CONFIG)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const r = sectionRef.current?.getBoundingClientRect()
      if (!r) return
      mouseX.set(((e.clientX - r.left) / r.width - 0.5) * 14)
      mouseY.set(((e.clientY - r.top) / r.height - 0.5) * 14)
    },
    [mouseX, mouseY]
  )

  return (
    <>
      <NavDots />

      <section
        ref={sectionRef}
        id="hero"
        onMouseMove={handleMouseMove}
        className="relative min-h-[100dvh] overflow-hidden bg-[#050507]"
        aria-label="Pulse AI — Intelligent AI Entity"
        suppressHydrationWarning
      >
        {/* Background */}
        <motion.div className="absolute inset-0" style={{ opacity: bgOpacity }}>
          <AmbientBackground />
        </motion.div>

        {/* Vertical left rail */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent hidden lg:block" />

        {/* Main Grid */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 min-h-[100dvh] grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 items-center pt-24 pb-20">

          {/* LEFT COLUMN */}
          <motion.div style={{ y: leftY }} className="flex flex-col gap-8 order-2 lg:order-1">

            {/* System badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-widest">SYS:ONLINE</span>
              </div>
              <div className="h-px flex-1 max-w-12 bg-white/[0.06]" />
              <span className="text-[10px] font-mono text-white/20 tracking-wider">PULSE_CORE v3.0.1</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <WordRevealHeadline />
            </motion.h1>

            {/* Descriptor */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4 max-w-md"
            >
              <p className="text-base text-white/50 leading-relaxed">
                Pulse is a next-generation AI entity with its own identity, memory,
                and reasoning engine — built for teams who demand more than autocomplete.
              </p>
              <div className="flex flex-wrap gap-2">
                {['GPT-4o', 'Claude 3.5', 'Gemini Pro', 'Real-time Voice', 'Vision'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/35"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* CTA section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup">
                  <button className="group relative overflow-hidden flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm tracking-wide shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-500 hover:scale-[1.02] active:scale-[0.97]">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[800ms] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                    </svg>
                    <span className="relative">Launch Pulse Free</span>
                  </button>
                </Link>
                <Link href="/#demo">
                  <button className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-sm font-semibold text-white/50 hover:text-white/90 border border-white/[0.07] hover:border-white/[0.18] hover:bg-white/[0.03] transition-all duration-300">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>See it live</span>
                  </button>
                </Link>
              </div>

              {/* Trust line */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['#6366f1', '#8b5cf6', '#a855f7', '#ec4899'].map((color, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: color, zIndex: 4 - i }}
                      className="w-6 h-6 rounded-full border-2 border-[#050507]"
                    />
                  ))}
                </div>
                <p className="text-xs text-white/25 font-mono">
                  <span className="text-white/50 font-semibold">12,400+</span> developers building with Pulse
                </p>
              </div>
            </motion.div>

            {/* Capability cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="grid grid-cols-2 gap-2.5"
            >
              <CapabilityCard
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-indigo-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                }
                title="Deep Reasoning"
                description="128k context, chain-of-thought, multi-step"
                status="active"
                delay={1.1}
                accentColor="from-transparent via-indigo-500/40 to-transparent"
              />
              <CapabilityCard
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-emerald-400">
                    <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                    <path d="M12 18v4M8 22h8M6 10a6 6 0 0 0 12 0" />
                  </svg>
                }
                title="Voice Native"
                description="Real-time speech with emotion detection"
                status="active"
                delay={1.2}
                accentColor="from-transparent via-emerald-500/40 to-transparent"
              />
              <CapabilityCard
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-violet-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                }
                title="Vision & Code"
                description="Analyze images, write & debug code"
                status="ready"
                delay={1.3}
                accentColor="from-transparent via-violet-500/40 to-transparent"
              />
              <CapabilityCard
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-amber-400">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                }
                title="Persistent Memory"
                description="Learns your preferences across sessions"
                status="processing"
                delay={1.4}
                accentColor="from-transparent via-amber-500/40 to-transparent"
              />
            </motion.div>
          </motion.div>

          {/* CENTER COLUMN (Robot Card) */}
          <motion.div
            style={{ y: useTransform(scrollYProgress, [0, 1], ['0px', '-90px']), x: sX, rotate: useTransform(sX, [-14, 14], [-1.5, 1.5]) }}
            className="flex flex-col items-center gap-4 order-1 lg:order-2"
          >
            <RobotIdentityCard />
            <LiveFeedTicker />
          </motion.div>

          {/* RIGHT COLUMN (Terminal) */}
          <motion.div
            style={{ y: rightY }}
            className="flex flex-col gap-4 order-3"
          >
            <CommandTerminal />

            {/* Model performance chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono font-bold text-white/25 uppercase tracking-widest">
                  Response Quality
                </p>
                <span className="text-[10px] font-mono text-emerald-400">+12% this week</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Accuracy', value: 97, color: 'from-indigo-500 to-violet-500' },
                  { label: 'Speed', value: 89, color: 'from-emerald-500 to-teal-500' },
                  { label: 'Context Retention', value: 94, color: 'from-violet-500 to-purple-500' },
                  { label: 'User Satisfaction', value: 99, color: 'from-amber-500 to-orange-500' },
                ].map((bar, i) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-white/30">{bar.label}</span>
                      <span className="text-[10px] font-mono text-white/50 font-semibold">{bar.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ delay: 1.5 + i * 0.1, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                        className={`h-full rounded-full bg-gradient-to-r ${bar.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="grid grid-cols-3 gap-2"
            >
              {[
                { label: 'API Docs', icon: '📄', href: '/docs' },
                { label: 'Discord', icon: '💬', href: '#' },
                { label: 'GitHub', icon: '⭐', href: 'https://github.com' },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 cursor-pointer"
                  >
                    <span className="text-lg leading-none">{action.icon}</span>
                    <span className="text-[10px] font-mono text-white/30 hover:text-white/50">{action.label}</span>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050507] to-transparent pointer-events-none z-[5]" />

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[9px] font-mono text-white/15 tracking-[0.3em] uppercase">scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-indigo-400/40 to-transparent" />
          </motion.div>
        </motion.div>
      </section>
    </>
  )
}