/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Landing/HowItWorks.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion'

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Step {
  id: string
  number: string
  cmd: string
  title: string
  description: string
  detail: string
  icon: React.ReactNode
  accent: string
  accentRgb: string
  terminal: { prefix: string; lines: string[] }
  metrics: { label: string; value: string }[]
  status: 'complete' | 'active' | 'pending'
}

// ─── Step Icons ───────────────────────────────────────────────────────────────────
function AccountIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ChatIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="9" cy="10" r="1" fill={color} stroke="none" />
      <circle cx="12" cy="10" r="1" fill={color} stroke="none" />
      <circle cx="15" cy="10" r="1" fill={color} stroke="none" />
    </svg>
  )
}

function ResultsIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function OrganizeIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
}

// ─── Step Data ────────────────────────────────────────────────────────────────────
const STEPS: Step[] = [
  {
    id: 'account',
    number: '01',
    cmd: 'pulse --init',
    title: 'Create Account',
    description: 'Sign up in 30 seconds. No credit card, no onboarding call — just instant access.',
    detail: 'Choose your plan, set your preferences, and Pulse learns your working style from the first message. Your AI identity is initialized immediately.',
    icon: <AccountIcon color="#6366f1" />,
    accent: '#6366f1',
    accentRgb: '99,102,241',
    terminal: {
      prefix: '$',
      lines: [
        'pulse --init --plan=free',
        '> Initializing PULSE_CORE v3.0...',
        '> Creating cognitive profile...',
        '> ✓ Account ready — welcome aboard',
      ],
    },
    metrics: [
      { label: 'Setup time', value: '<30s' },
      { label: 'Plan', value: 'Free' },
      { label: 'Card needed', value: 'None' },
    ],
    status: 'complete',
  },
  {
    id: 'chat',
    number: '02',
    cmd: 'pulse --connect',
    title: 'Start Chatting',
    description: 'Ask anything — code, research, writing, voice. Pulse adapts to your style in real time.',
    detail: 'Switch between GPT-4o, Claude 3.5, and Gemini on the fly. Use voice, upload files, or just type. Pulse figures out the best approach for each query.',
    icon: <ChatIcon color="#22d3ee" />,
    accent: '#22d3ee',
    accentRgb: '34,211,238',
    terminal: {
      prefix: '$',
      lines: [
        'pulse --connect --model=gpt-4o',
        '> Model loaded: GPT-4o (128k ctx)',
        '> Voice synthesis: enabled',
        '> ✓ Session active — ready',
      ],
    },
    metrics: [
      { label: 'Models', value: '3+' },
      { label: 'Context', value: '128k' },
      { label: 'Latency', value: '<200ms' },
    ],
    status: 'active',
  },
  {
    id: 'results',
    number: '03',
    cmd: 'pulse --generate',
    title: 'Get Results',
    description: 'Receive intelligent, cited, production-ready output — not just autocomplete.',
    detail: 'Code passes lint. Writing matches your brand. Research is cited. Pulse doesn\'t just generate — it verifies, refines, and explains its reasoning at every step.',
    icon: <ResultsIcon color="#34d399" />,
    accent: '#34d399',
    accentRgb: '52,211,153',
    terminal: {
      prefix: '$',
      lines: [
        'pulse --generate --verify',
        '> Reasoning chain: 4 steps',
        '> Lint check: ✓ passed',
        '> ✓ Output ready — 97.3% confidence',
      ],
    },
    metrics: [
      { label: 'Accuracy', value: '97.3%' },
      { label: 'Avg time', value: '1.4s' },
      { label: 'Lint pass', value: '94%' },
    ],
    status: 'pending',
  },
  {
    id: 'organize',
    number: '04',
    cmd: 'pulse --sync',
    title: 'Stay Organized',
    description: 'Every conversation saved, searchable, and synced. Pulse remembers so you don\'t have to.',
    detail: 'Persistent memory means Pulse knows your projects, preferences, and past decisions. Your workspace grows smarter with every session.',
    icon: <OrganizeIcon color="#f472b6" />,
    accent: '#f472b6',
    accentRgb: '244,114,182',
    terminal: {
      prefix: '$',
      lines: [
        'pulse --sync --memory=full',
        '> Indexing 1,284 messages...',
        '> Memory graph: updated',
        '> ✓ Workspace synced — all caught up',
      ],
    },
    metrics: [
      { label: 'History', value: 'Forever' },
      { label: 'Search', value: 'Full-text' },
      { label: 'Memory', value: 'Persistent' },
    ],
    status: 'pending',
  },
]

// ─── Terminal Typewriter ──────────────────────────────────────────────────────────
function TerminalTypewriter({
  lines,
  prefix,
  accentRgb,
  isActive,
}: {
  lines: string[]
  prefix: string
  accentRgb: string
  isActive: boolean
}) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [currentLineText, setCurrentLineText] = useState('')
  const [charIndex, setCharIndex] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setVisibleLines(0)
      setCurrentLineText('')
      setCharIndex(0)
      setDone(false)
      return
    }

    if (visibleLines >= lines.length) {
      setDone(true)
      return
    }

    const currentLine = lines[visibleLines]

    if (charIndex < currentLine.length) {
      const t = setTimeout(() => {
        setCurrentLineText(currentLine.slice(0, charIndex + 1))
        setCharIndex((i) => i + 1)
      }, 28)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setVisibleLines((v) => v + 1)
        setCurrentLineText('')
        setCharIndex(0)
      }, 250)
      return () => clearTimeout(t)
    }
  }, [isActive, visibleLines, charIndex, lines])

  const lineColors = [
    'text-white/50',
    `text-indigo-300/70`,
    `text-white/35`,
    `text-emerald-400/80`,
  ]

  return (
    <div className="space-y-1.5 font-mono text-[11px] leading-relaxed">
      {/* Rendered complete lines */}
      {lines.slice(0, visibleLines).map((line, i) => (
        <div key={i} className="flex items-start gap-2">
          {i === 0 && (
            <span style={{ color: `rgba(${accentRgb},0.6)` }} className="flex-shrink-0">
              {prefix}
            </span>
          )}
          {i !== 0 && <span className="w-3 flex-shrink-0" />}
          <span className={lineColors[i] ?? 'text-white/30'}>
            {line.startsWith(prefix) ? line.slice(prefix.length + 1) : line}
          </span>
        </div>
      ))}

      {/* Currently typing line */}
      {!done && visibleLines < lines.length && (
        <div className="flex items-start gap-2">
          {visibleLines === 0 && (
            <span style={{ color: `rgba(${accentRgb},0.6)` }} className="flex-shrink-0">
              {prefix}
            </span>
          )}
          {visibleLines !== 0 && <span className="w-3 flex-shrink-0" />}
          <span className={lineColors[visibleLines] ?? 'text-white/30'}>
            {currentLineText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-[7px] h-[12px] rounded-sm ml-0.5 align-middle"
              style={{ background: `rgba(${accentRgb},0.7)` }}
            />
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Step Card ────────────────────────────────────────────────────────────────────
function StepCard({
  step,
  index,
  isActive,
  isCompleted,
  onClick,
}: {
  step: Step
  index: number
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3 }}
      className="relative group cursor-pointer"
    >
      {/* Mouse spotlight */}
      {hovered && (
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${step.accentRgb},0.06), transparent 60%)`,
          }}
        />
      )}

      {/* Active / completed outer glow */}
      <div
        className="absolute -inset-px rounded-3xl blur-sm pointer-events-none transition-all duration-500"
        style={{
          background: isActive
            ? `radial-gradient(ellipse at 50% 0%, rgba(${step.accentRgb},0.2), transparent 60%)`
            : 'transparent',
        }}
      />

      <div
        className={`relative rounded-3xl border transition-all duration-400 overflow-hidden ${
          isActive
            ? 'border-white/[0.12] bg-white/[0.04]'
            : isCompleted
            ? 'border-white/[0.07] bg-white/[0.02]'
            : 'border-white/[0.05] bg-white/[0.01] hover:border-white/[0.09]'
        }`}
      >
        {/* Top accent line */}
        <motion.div
          animate={{ opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute top-0 left-[15%] right-[15%] h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${step.accentRgb},0.5), transparent)`,
          }}
        />

        {/* HUD corner */}
        <div className="absolute top-3 right-3 pointer-events-none">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M10 4V1.5C10 0.67 9.33 0 8.5 0H6"
              stroke={`rgba(${step.accentRgb},${isActive ? '0.35' : '0.12'})`}
              strokeWidth="0.8"
              className="transition-all duration-400"
            />
          </svg>
        </div>

        <div className="p-6">
          {/* Header row */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Step number badge */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold border transition-all duration-400"
                style={{
                  background: isActive || isCompleted
                    ? `rgba(${step.accentRgb},0.12)`
                    : 'rgba(255,255,255,0.03)',
                  borderColor: isActive || isCompleted
                    ? `rgba(${step.accentRgb},0.25)`
                    : 'rgba(255,255,255,0.06)',
                  color: isActive || isCompleted
                    ? step.accent
                    : 'rgba(255,255,255,0.2)',
                }}
              >
                {isCompleted ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke={step.accent} strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : step.number}
              </div>

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-400"
                style={{
                  background: `rgba(${step.accentRgb},${isActive ? '0.12' : '0.06'})`,
                  borderColor: `rgba(${step.accentRgb},${isActive ? '0.25' : '0.12'})`,
                  boxShadow: isActive ? `0 0 20px rgba(${step.accentRgb},0.15)` : 'none',
                }}
              >
                {step.icon}
              </div>
            </div>

            {/* Command chip */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[9px] transition-all duration-400"
              style={{
                background: `rgba(${step.accentRgb},0.06)`,
                borderColor: `rgba(${step.accentRgb},${isActive ? '0.2' : '0.08'})`,
                color: isActive ? step.accent : 'rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ color: `rgba(${step.accentRgb},0.5)` }}>$</span>
              {step.cmd.split(' ')[1]}
            </div>
          </div>

          {/* Title + description */}
          <h3
            className="text-base font-black font-mono mb-2 transition-colors duration-400"
            style={{ color: isActive ? step.accent : 'rgba(255,255,255,0.6)' }}
          >
            {step.title}
          </h3>
          <p className="text-xs text-white/35 leading-relaxed mb-5 font-mono">
            {step.description}
          </p>

          {/* Terminal block */}
          <div className="rounded-2xl overflow-hidden border border-white/[0.05] bg-[#050508]">
            {/* Terminal header */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.04]">
              {['bg-red-500/30', 'bg-amber-500/30', 'bg-emerald-500/30'].map((c, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${c}`} />
              ))}
              <span className="ml-2 text-[8px] font-mono text-white/15">
                {step.cmd}
              </span>
              {isActive && (
                <div className="ml-auto flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                      style={{ background: step.accent }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full"
                      style={{ background: step.accent }} />
                  </span>
                  <span className="text-[8px] font-mono" style={{ color: `rgba(${step.accentRgb},0.5)` }}>
                    running
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 min-h-[80px]">
              <TerminalTypewriter
                lines={step.terminal.lines}
                prefix={step.terminal.prefix}
                accentRgb={step.accentRgb}
                isActive={isActive}
              />

              {!isActive && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-mono text-white/15">
                    click to run
                  </span>
                  <motion.span
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block w-[5px] h-[10px] rounded-sm bg-white/10"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Metrics — show when active */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-2">
                  {step.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex flex-col items-center gap-0.5 py-2.5 rounded-xl border"
                      style={{
                        background: `rgba(${step.accentRgb},0.05)`,
                        borderColor: `rgba(${step.accentRgb},0.12)`,
                      }}
                    >
                      <span
                        className="text-sm font-black font-mono tabular-nums"
                        style={{ color: step.accent }}
                      >
                        {metric.value}
                      </span>
                      <span className="text-[8px] font-mono text-white/20 text-center leading-tight">
                        {metric.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-white/25 font-mono leading-relaxed mt-3 px-0.5">
                  {step.detail}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Connection Line ──────────────────────────────────────────────────────────────
function ConnectionLine({
  fromStep,
  toStep,
  isActive,
  index,
}: {
  fromStep: Step
  toStep: Step
  isActive: boolean
  index: number
}) {
  return (
    <div className="hidden lg:flex items-center justify-center mt-[52px] relative z-10">
      <div className="relative w-full h-px mx-2">
        {/* Base line */}
        <div className="absolute inset-0 bg-white/[0.05]" />

        {/* Animated fill */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 origin-left"
          style={{
            background: `linear-gradient(90deg, rgba(${fromStep.accentRgb},0.6), rgba(${toStep.accentRgb},0.4))`,
          }}
        />

        {/* Traveling dot */}
        {isActive && (
          <motion.div
            animate={{ x: ['0%', '100%'] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 1,
            }}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow-lg"
            style={{
              background: fromStep.accent,
              boxShadow: `0 0 8px rgba(${fromStep.accentRgb},0.6)`,
            }}
          />
        )}

        {/* Arrow tip */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path
              d="M1 1L5 5L1 9"
              stroke={isActive ? fromStep.accent : 'rgba(255,255,255,0.08)'}
              strokeWidth="1.2"
              strokeLinecap="round"
              className="transition-colors duration-400"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Timeline Sidebar (Mobile) ────────────────────────────────────────────────────
function TimelineSidebar({
  steps,
  activeIndex,
  onStepClick,
}: {
  steps: Step[]
  activeIndex: number
  onStepClick: (i: number) => void
}) {
  return (
    <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
      {steps.map((step, i) => (
        <button
          key={step.id}
          onClick={() => onStepClick(i)}
          className="flex flex-col items-center gap-1.5 group"
        >
          <motion.div
            animate={{
              scale: activeIndex === i ? 1.15 : 1,
              boxShadow: activeIndex === i ? `0 0 12px rgba(${step.accentRgb},0.4)` : '0 0 0px transparent',
            }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center border font-mono text-[9px] font-bold transition-all duration-300"
            style={{
              background: activeIndex === i ? `rgba(${step.accentRgb},0.15)` : 'rgba(255,255,255,0.03)',
              borderColor: activeIndex === i ? `rgba(${step.accentRgb},0.4)` : 'rgba(255,255,255,0.07)',
              color: activeIndex === i ? step.accent : 'rgba(255,255,255,0.2)',
            }}
          >
            {i < activeIndex ? (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke={step.accent} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : step.number}
          </motion.div>

          <span
            className="text-[8px] font-mono transition-colors duration-300"
            style={{ color: activeIndex === i ? step.accent : 'rgba(255,255,255,0.15)' }}
          >
            {step.cmd.split(' ')[1]?.replace('--', '')}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Live Progress Bar ────────────────────────────────────────────────────────────
function LiveProgressBar({ steps, activeIndex }: { steps: Step[]; activeIndex: number }) {
  const progress = ((activeIndex) / (steps.length - 1)) * 100

  return (
    <div className="flex items-center gap-4 mb-12 max-w-sm mx-auto lg:mx-0">
      <div className="flex-1 h-0.5 rounded-full bg-white/[0.05] overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"
        />
      </div>
      <span className="text-[9px] font-mono text-white/20 flex-shrink-0 tabular-nums">
        step {activeIndex + 1}/{steps.length}
      </span>
    </div>
  )
}

// ─── Auto-Advance Timer Ring ──────────────────────────────────────────────────────
function TimerRing({
  duration,
  accentRgb,
  onComplete,
  isPaused,
}: {
  duration: number
  accentRgb: string
  onComplete: () => void
  isPaused: boolean
}) {
  const [progress, setProgress] = useState(0)
  const startRef = useRef<number>(Date.now())
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = Date.now()
    setProgress(0)

    if (isPaused) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const p = Math.min(elapsed / duration, 1)
      setProgress(p)
      if (p < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        onComplete()
      }
    }
    animRef.current = requestAnimationFrame(tick)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [duration, isPaused, onComplete])

  const r = 10
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - progress)

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="rotate-[-90deg]">
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
      <circle
        cx="14" cy="14" r={r}
        fill="none"
        stroke={`rgba(${accentRgb},0.5)`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.05s linear' }}
      />
    </svg>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────────
function SectionHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="text-center mb-16 max-w-3xl mx-auto"
    >
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.06] mb-6">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-indigo-400">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/30">
          4-step boot sequence
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-indigo-400">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>

      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05] mb-5">
        From zero to{' '}
        <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          cognitive AI
        </span>
        <br />
        in four commands.
      </h2>

      <p className="text-sm sm:text-base text-white/35 max-w-xl mx-auto leading-relaxed font-mono">
        Pulse boots like a system — each step initializing a new layer of intelligence.
        Click any card to run the sequence.
      </p>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────────
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%'])

  const handleStepClick = (index: number) => {
    setActiveIndex(index)
    setAutoplay(false)
  }

  const handleTimerComplete = () => {
    if (autoplay && hoveredCard === null) {
      setActiveIndex((prev) => (prev + 1) % STEPS.length)
    }
  }

  // Resume autoplay after 8 seconds of inactivity
  useEffect(() => {
    if (!autoplay) {
      const t = setTimeout(() => setAutoplay(true), 8000)
      return () => clearTimeout(t)
    }
  }, [autoplay, activeIndex])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-24 sm:py-32 overflow-hidden bg-[#050508]"
      aria-label="How Pulse AI works"
    >
      {/* Ambient background */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: bgY }}>
        <div className="absolute top-[20%] left-[5%] w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.04), transparent 65%)', filter: 'blur(80px)' }}
        />
        <div className="absolute bottom-[15%] right-[5%] w-[500px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.04), transparent 65%)', filter: 'blur(80px)' }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '36px 36px' }}
        />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 20%, #050508 80%)' }}
        />
      </motion.div>

      {/* Left rail */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/[0.07] to-transparent hidden xl:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />

        {/* ─── Control row ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8 max-w-full">
          <LiveProgressBar steps={STEPS} activeIndex={activeIndex} />

          {/* Auto-advance controls */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setAutoplay((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all duration-200 font-mono text-[10px]"
            >
              {autoplay ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                  </svg>
                  pause
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  auto
                </>
              )}
            </button>

            <TimerRing
              key={`${activeIndex}-${autoplay}`}
              duration={5000}
              accentRgb={STEPS[activeIndex].accentRgb}
              onComplete={handleTimerComplete}
              isPaused={!autoplay || hoveredCard !== null}
            />
          </div>
        </div>

        {/* ─── Mobile timeline ───────────────────────────────── */}
        <TimelineSidebar
          steps={STEPS}
          activeIndex={activeIndex}
          onStepClick={handleStepClick}
        />

        {/* ─── Step cards grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.03] rounded-3xl overflow-hidden p-px">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 col-span-full gap-4 bg-[#050508] rounded-3xl p-1">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className="relative"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <StepCard
                  step={step}
                  index={index}
                  isActive={activeIndex === index}
                  isCompleted={index < activeIndex}
                  onClick={() => handleStepClick(index)}
                />

                {/* Connection line between cards */}
                {index < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-[52px] -right-2 w-4 z-20">
                    <ConnectionLine
                      fromStep={step}
                      toStep={STEPS[index + 1]}
                      isActive={index < activeIndex}
                      index={index}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Bottom CTA row ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-14"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-white/20">
            <span>Total setup time:</span>
            <span className="font-bold text-white/40">{'<'} 2 minutes</span>
            <span className="w-px h-3 bg-white/[0.06]" />
            <span>No config required</span>
          </div>

          <a
            href="/signup"
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-mono font-bold text-xs shadow-[0_0_24px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.45)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] overflow-hidden relative"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
            <span className="relative">$ pulse --init --now</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="relative transition-transform duration-300 group-hover:translate-x-0.5">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}