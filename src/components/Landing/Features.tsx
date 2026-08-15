/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/exhaustive-deps */
// src/components/Landing/Features.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  AnimatePresence,
} from 'framer-motion'

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Feature {
  id: string
  icon: React.ReactNode
  label: string
  title: string
  description: string
  detail: string
  stats: { label: string; value: string }[]
  tags: string[]
  accent: string
  accentRgb: string
  demo: React.ReactNode
  status: 'live' | 'beta' | 'new'
}

// ─── Icons ───────────────────────────────────────────────────────────────────────
function ConversationIcon({ color }: { color: string }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="9"  cy="10" r="1" fill={color} stroke="none" />
      <circle cx="12" cy="10" r="1" fill={color} stroke="none" />
      <circle cx="15" cy="10" r="1" fill={color} stroke="none" />
    </svg>
  )
}

function CodeIcon({ color }: { color: string }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="12" y1="2" x2="12" y2="22" strokeOpacity="0.4" />
    </svg>
  )
}

function ContentIcon({ color }: { color: string }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function ResearchIcon({ color }: { color: string }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8"  x2="11"   y2="14" />
      <line x1="8"  y1="11" x2="14"   y2="11" />
    </svg>
  )
}

function FileIcon({ color }: { color: string }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function MemoryIcon({ color }: { color: string }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04" />
    </svg>
  )
}

function VoiceIcon({ color }: { color: string }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8"  y1="22" x2="16" y2="22" />
    </svg>
  )
}

// ─── Demo Components ──────────────────────────────────────────────────────────────
// Every demo is self-contained. Timers are stored in refs and cleaned up
// on unmount. Because the parent passes key={demoKey}, each open triggers
// a full remount — so animations always replay from the start.

function ConversationDemo() {
  const [step, setStep] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const messages = [
    { role: 'user', text: 'Explain async/await simply' },
    {
      role: 'ai',
      text: "Think of it like ordering food. You place an order (async), then wait (await) without blocking the whole restaurant...",
    },
  ]

  useEffect(() => {
    timers.current = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 2000),
    ]
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="space-y-2 p-3">
      <AnimatePresence mode="popLayout">
        {step >= 1 && (
          <motion.div
            key="user-msg"
            initial={{ opacity: 0, x: 8, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="flex justify-end"
          >
            <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-br-sm bg-indigo-500/20 border border-indigo-500/20 text-[11px] text-indigo-100 leading-relaxed">
              {messages[0].text}
            </div>
          </motion.div>
        )}

        {step >= 1 && step < 2 && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-1 pl-7"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                className="w-1 h-1 rounded-full bg-indigo-400/50"
              />
            ))}
          </motion.div>
        )}

        {step >= 2 && (
          <motion.div
            key="ai-msg"
            initial={{ opacity: 0, x: -8, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="flex justify-start gap-2"
          >
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 mt-0.5" />
            <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-sm bg-white/[0.05] border border-white/[0.07] text-[11px] text-white/60 leading-relaxed">
              {messages[1].text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CodeDemo() {
  const lines = [
    { text: 'async function fetchUser(id) {',              color: 'text-violet-300' },
    { text: '  const res = await api.get(`/users/${id}`)', color: 'text-indigo-300' },
    { text: '  if (!res.ok) throw new Error(res.status)',  color: 'text-red-400/70' },
    { text: '  return res.json()',                         color: 'text-emerald-300' },
    { text: '}',                                           color: 'text-violet-300' },
  ]
  const [visible, setVisible] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current = lines.map((_, i) =>
      setTimeout(() => setVisible(i + 1), 400 + i * 350)
    )
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="p-3 font-mono">
      <div className="flex items-center gap-1.5 mb-3">
        {['bg-red-500/40', 'bg-amber-500/40', 'bg-emerald-500/40'].map((c, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${c}`} />
        ))}
        <span className="ml-2 text-[9px] text-white/20">fetchUser.ts</span>
      </div>

      <div className="space-y-0.5">
        {lines.map((line, i) => (
          <AnimatePresence key={i}>
            {visible > i && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={`text-[10px] leading-relaxed ${line.color}`}
              >
                {line.text}
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {visible < lines.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-1.5 h-3 bg-indigo-400 align-middle"
          />
        )}
      </div>
    </div>
  )
}

function ContentDemo() {
  const words =
    'Crafting a compelling brand story that resonates with your audience requires understanding their deepest motivations and aspirations...'
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let i = 0
    intervalRef.current = setInterval(() => {
      i += 2
      setProgress(Math.min(i, words.length))
      if (i >= words.length && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 40)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          {['Blog', 'Email', 'Tweet', 'Script'].map((t, i) => (
            <span
              key={t}
              className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                i === 0
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20'
                  : 'text-white/20 border border-white/[0.05]'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-white/50 leading-relaxed">
        {words.slice(0, progress)}
        {progress < words.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-px h-3 bg-violet-400 ml-0.5 align-middle"
          />
        )}
      </p>
    </div>
  )
}

function ResearchDemo() {
  const sources = [
    { title: 'Nature — AI & Climate', match: 97, color: 'text-emerald-400' },
    { title: 'MIT Review 2024',        match: 91, color: 'text-indigo-400' },
    { title: 'Stanford AI Report',     match: 88, color: 'text-violet-400' },
  ]
  const [shown, setShown] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current = sources.map((_, i) =>
      setTimeout(() => setShown(i + 1), 600 + i * 500)
    )
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="p-3 space-y-2">
      {/* Search bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-6 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center px-2.5">
          <span className="text-[10px] text-white/20">AI impact on climate research</span>
        </div>
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <svg
            width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider">
          Top matches
        </p>
        {sources.slice(0, shown).map((s) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.match}%` }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              />
            </div>
            <span className={`text-[10px] font-mono font-bold ${s.color} w-8 text-right`}>
              {s.match}%
            </span>
            <span className="text-[10px] text-white/30 truncate max-w-[80px]">
              {s.title}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function FileDemo() {
  const [phase, setPhase] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const insights = ['Revenue up 23% YoY', 'Q4 strongest quarter', 'Risk: supply chain']

  useEffect(() => {
    timers.current = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2800),
    ]
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="p-3 space-y-2">
      {/* File row */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="w-8 h-10 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <svg
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-white/60 font-medium">Q4_Annual_Report.pdf</p>
          <p className="text-[9px] text-white/25">2.4 MB · 48 pages</p>
        </div>
        {phase >= 1 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"
          >
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Insights */}
      {phase >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider">
            AI Insights
          </p>
          {insights.slice(0, phase >= 3 ? 3 : 1).map((ins, i) => (
            <motion.div
              key={ins}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="w-1 h-1 rounded-full bg-amber-400" />
              <span className="text-[10px] text-white/50">{ins}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function MemoryDemo() {
  const memories = [
    { label: 'Prefers TypeScript',    time: '3d ago', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    { label: 'Works in fintech',      time: '1w ago', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { label: 'Likes concise replies', time: '2w ago', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
  ]
  const [shown, setShown] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current = memories.map((_, i) =>
      setTimeout(() => setShown(i + 1), 400 + i * 600)
    )
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
        <span className="text-[10px] font-mono text-white/30">memory.recall(user)</span>
      </div>

      {memories.slice(0, shown).map((m) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className={`flex items-center justify-between px-3 py-2 rounded-xl border ${m.color} text-[10px] font-medium`}
        >
          <span>{m.label}</span>
          <span className="opacity-50">{m.time}</span>
        </motion.div>
      ))}
    </div>
  )
}

function VoiceDemo() {
  const [active, setActive] = useState(false)
  const [transcript, setTranscript] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const BARS = 20

  useEffect(() => {
    const text = 'Hey Pulse, set a reminder for my standup at 9am...'

    timers.current.push(
      setTimeout(() => {
        setActive(true)
        let i = 0
        intervalRef.current = setInterval(() => {
          i++
          setTranscript(text.slice(0, i))
          if (i >= text.length && intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }, 60)
      }, 800)
    )

    return () => {
      timers.current.forEach(clearTimeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="p-3 space-y-3">
      {/* Waveform bars */}
      <div className="flex items-center justify-center gap-[3px] h-10">
        {Array.from({ length: BARS }).map((_, i) => (
          <motion.div
            key={i}
            className="w-[2px] rounded-full bg-gradient-to-t from-indigo-500 to-violet-400"
            animate={
              active
                ? {
                    height: [
                      `${6 + Math.random() * 18}px`,
                      `${6 + Math.random() * 28}px`,
                      `${6 + Math.random() * 10}px`,
                    ],
                  }
                : { height: '4px' }
            }
            transition={{
              duration: 0.35 + Math.random() * 0.3,
              repeat: Infinity,
              repeatType: 'mirror',
              delay: i * 0.04,
            }}
          />
        ))}
      </div>

      {/* Transcript */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]"
        >
          <p className="text-[11px] text-white/50 leading-relaxed italic">
            &ldquo;{transcript}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-px h-3 bg-indigo-400 ml-0.5 align-middle"
            />
            &rdquo;
          </p>
        </motion.div>
      )}
    </div>
  )
}

// ─── Feature Data ─────────────────────────────────────────────────────────────────
const FEATURES: Feature[] = [
  {
    id: 'conversation',
    icon: <ConversationIcon color="#818cf8" />,
    label: 'Core',
    title: 'Natural Conversations',
    description:
      'Human-like dialogue with deep context awareness, emotional intelligence, and persistent personality across every session.',
    detail:
      'Pulse maintains conversation context across thousands of tokens, adapts its tone to your communication style, and builds genuine rapport over time — unlike any other AI assistant.',
    stats: [
      { label: 'Context Window', value: '128k' },
      { label: 'Languages',      value: '95+'  },
      { label: 'Accuracy',       value: '97.3%'},
    ],
    tags: ['Multi-turn', 'Emotional IQ', 'Tone Adapt'],
    accent: '#6366f1',
    accentRgb: '99,102,241',
    demo: <ConversationDemo />,
    status: 'live',
  },
  {
    id: 'code',
    icon: <CodeIcon color="#22d3ee" />,
    label: 'Dev Tools',
    title: 'Code Generation',
    description:
      'Write, debug, refactor, and explain code across 50+ languages with production-ready output and architectural guidance.',
    detail:
      'From simple scripts to full-stack architectures. Pulse understands your existing codebase, follows your conventions, and generates code that actually ships.',
    stats: [
      { label: 'Languages',      value: '50+'  },
      { label: 'Lint Pass Rate', value: '94%'  },
      { label: 'Test Coverage',  value: 'Auto' },
    ],
    tags: ['TypeScript', 'Python', 'Rust', 'Go'],
    accent: '#22d3ee',
    accentRgb: '34,211,238',
    demo: <CodeDemo />,
    status: 'live',
  },
  {
    id: 'content',
    icon: <ContentIcon color="#a78bfa" />,
    label: 'Creative',
    title: 'Content Creation',
    description:
      'Generate blog posts, marketing copy, scripts, and creative writing with your brand voice and style guidelines.',
    detail:
      'Pulse learns your tone of voice, brand guidelines, and content goals — then produces on-brand content that reads like you wrote it on your best day.',
    stats: [
      { label: 'Formats',       value: '30+'    },
      { label: 'Brand Accuracy',value: '91%'    },
      { label: 'Time Saved',    value: '4h/day' },
    ],
    tags: ['Blog', 'Email', 'Social', 'Scripts'],
    accent: '#a78bfa',
    accentRgb: '167,139,250',
    demo: <ContentDemo />,
    status: 'live',
  },
  {
    id: 'research',
    icon: <ResearchIcon color="#34d399" />,
    label: 'Intelligence',
    title: 'Research Assistant',
    description:
      'Search, synthesize, and surface insights from the web, your documents, and connected data sources in seconds.',
    detail:
      'Connect Pulse to your knowledge base, internal docs, or the live web. Get cited summaries, competitor analysis, and actionable insights — not just raw search results.',
    stats: [
      { label: 'Source Types',     value: '12+' },
      { label: 'Synthesis Speed',  value: '<5s' },
      { label: 'Citation Rate',    value: '100%'},
    ],
    tags: ['Web Search', 'Citations', 'Synthesis'],
    accent: '#34d399',
    accentRgb: '52,211,153',
    demo: <ResearchDemo />,
    status: 'live',
  },
  {
    id: 'files',
    icon: <FileIcon color="#f59e0b" />,
    label: 'Analysis',
    title: 'File Analysis',
    description:
      'Upload PDFs, spreadsheets, images, and documents. Get instant summaries, data extraction, and visual analysis.',
    detail:
      'Drop in financial reports, legal docs, research papers, or images. Pulse extracts key information, identifies patterns, and answers specific questions about your files.',
    stats: [
      { label: 'File Types', value: '40+'   },
      { label: 'Max Size',   value: '100MB' },
      { label: 'Image OCR',  value: '99.1%' },
    ],
    tags: ['PDF', 'Excel', 'Images', 'CSV'],
    accent: '#f59e0b',
    accentRgb: '245,158,11',
    demo: <FileDemo />,
    status: 'beta',
  },
  {
    id: 'memory',
    icon: <MemoryIcon color="#ec4899" />,
    label: 'Personalization',
    title: 'Persistent Memory',
    description:
      'Pulse remembers your preferences, projects, and context across every session — no need to repeat yourself.',
    detail:
      'Unlike stateless chatbots, Pulse builds a knowledge graph of your preferences, projects, team, and goals. Every conversation gets smarter because Pulse knows you.',
    stats: [
      { label: 'Memory Nodes', value: '∞'      },
      { label: 'Retention',    value: 'Forever' },
      { label: 'Privacy',      value: 'E2E'     },
    ],
    tags: ['Context Graph', 'User Prefs', 'Projects'],
    accent: '#ec4899',
    accentRgb: '236,72,153',
    demo: <MemoryDemo />,
    status: 'live',
  },
  {
    id: 'voice',
    icon: <VoiceIcon color="#38bdf8" />,
    label: 'Voice',
    title: 'Real-time Voice',
    description:
      'Speak naturally with Pulse using low-latency voice synthesis and recognition with emotion detection.',
    detail:
      'Sub-200ms response times, natural prosody, and multilingual support. Pulse hears nuance, understands context, and responds with appropriate emotional tone.',
    stats: [
      { label: 'Latency',      value: '<200ms' },
      { label: 'Languages',    value: '40+'    },
      { label: 'Emotion Tags', value: '12'     },
    ],
    tags: ['Real-time', 'Multilingual', 'Emotion AI'],
    accent: '#38bdf8',
    accentRgb: '56,189,248',
    demo: <VoiceDemo />,
    status: 'new',
  },
]

// ─── Status Badge ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Feature['status'] }) {
  const config = {
    live: { label: 'LIVE', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    beta: { label: 'BETA', cls: 'text-amber-400  bg-amber-400/10  border-amber-400/20'  },
    new:  { label: 'NEW',  cls: 'text-sky-400    bg-sky-400/10    border-sky-400/20'    },
  }
  const { label, cls } = config[status]
  return (
    <span className={`text-[9px] font-bold font-mono tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────────
// Each card is 100% independent:
//   • isExpanded  — tracks open/closed state locally
//   • demoKey     — increments on every open, forcing the demo to remount
//                   so all its timers / useState fire fresh every time
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [demoKey,    setDemoKey]    = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX  = useMotionValue(0)
  const mouseY  = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const handleClick = () => {
    const next = !isExpanded
    setIsExpanded(next)
    // Bump key only when opening so demo always replays from scratch
    if (next) setDemoKey((k) => k + 1)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3 }}
      className="group relative cursor-pointer h-full"
    >
      {/* Outer glow when expanded */}
      <motion.div
        animate={{ opacity: isExpanded ? 0.8 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute -inset-px rounded-3xl blur-sm pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${feature.accent}30, transparent 70%)`,
        }}
      />

      {/* Mouse-follow spotlight */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(${feature.accentRgb},0.06), transparent 60%)`,
        }}
      />

      {/* Card surface */}
      <div
        className={`relative h-full rounded-3xl overflow-hidden border transition-all duration-300 ${
          isExpanded
            ? 'bg-white/[0.04] border-white/[0.15]'
            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'
        }`}
      >
        {/* Top shimmer line when expanded */}
        <motion.div
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${feature.accent}80, transparent)`,
          }}
        />

        <div className="p-6">
          {/* ── Header ───────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, rgba(${feature.accentRgb},0.15), rgba(${feature.accentRgb},0.05))`,
                  border: `1px solid rgba(${feature.accentRgb},0.2)`,
                  boxShadow: isExpanded ? `0 0 20px rgba(${feature.accentRgb},0.2)` : 'none',
                }}
              >
                {feature.icon}
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white/25 mb-0.5">
                  {feature.label}
                </p>
                <StatusBadge status={feature.status} />
              </div>
            </div>

            {/* +/× toggle */}
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0, opacity: isExpanded ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </motion.div>
          </div>

          {/* ── Title ────────────────────────────────────────────── */}
          <h3
            className="text-lg font-bold mb-2 transition-colors duration-300"
            style={{ color: isExpanded ? feature.accent : 'rgba(255,255,255,0.9)' }}
          >
            {feature.title}
          </h3>

          {/* ── Description ──────────────────────────────────────── */}
          <p className="text-sm text-white/40 leading-relaxed mb-5 line-clamp-2">
            {feature.description}
          </p>

          {/* ── Tags ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {feature.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* ── Demo window ──────────────────────────────────────── */}
          <div
            className={`rounded-2xl overflow-hidden border transition-colors duration-500 ${
              isExpanded
                ? 'border-white/[0.1] bg-white/[0.02]'
                : 'border-white/[0.05] bg-white/[0.01]'
            }`}
          >
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.04]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/[0.08]" />
              ))}
              <span className="ml-1 text-[9px] font-mono text-white/15">live preview</span>
            </div>

            {/*
              AnimatePresence swaps between placeholder and live demo.
              key={`demo-open-${demoKey}`} guarantees a full unmount/remount
              of the demo component every time the card is opened, so all
              internal timers and state are completely fresh.
            */}
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key={`demo-open-${demoKey}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                >
                  {feature.demo}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center h-[100px]"
                >
                  <div className="flex flex-col items-center gap-2">
                    {/* Tinted play button */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        background: `rgba(${feature.accentRgb},0.08)`,
                        border:     `1px solid rgba(${feature.accentRgb},0.15)`,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M8.5 4.134a1 1 0 0 1 0 1.732L2.5 9.33A1 1 0 0 1 1 8.464V1.536A1 1 0 0 1 2.5.67l6 3.464Z"
                          fill={feature.accent}
                          fillOpacity="0.6"
                        />
                      </svg>
                    </div>
                    <p className="text-[10px] text-white/15 font-mono">click to preview</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Stats + Detail (slide open) ───────────────────────── */}
          <div className="overflow-hidden">
            <motion.div
              initial={false}
              animate={{
                opacity:    isExpanded ? 1 : 0,
                height:     isExpanded ? 'auto' : 0,
                marginTop:  isExpanded ? 16 : 0,
              }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="grid grid-cols-3 gap-2">
                {feature.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-0.5 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
                  >
                    <span
                      className="text-lg font-black font-mono tabular-nums"
                      style={{ color: feature.accent }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-[9px] text-white/25 font-medium text-center leading-tight">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-white/35 leading-relaxed mt-3 px-1">
                {feature.detail}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Comparison Table ─────────────────────────────────────────────────────────────
function ComparisonTable() {
  const rows = [
    { feature: 'Context window',        pulse: '128k tokens',  others: '~4k tokens' },
    { feature: 'Persistent memory',     pulse: '✓ Full',       others: '✗ None'     },
    { feature: 'Voice mode',            pulse: '✓ <200ms',     others: 'Limited'    },
    { feature: 'Multi-model switching', pulse: '✓ Instant',    others: '✗ Locked'   },
    { feature: 'File analysis',         pulse: '✓ 40+ types',  others: 'PDF only'   },
    { feature: 'Custom persona',        pulse: '✓ Deep',       others: 'Basic'      },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl"
    >
      {/* Table header */}
      <div className="grid grid-cols-3 border-b border-white/[0.06]">
        <div className="px-6 py-4">
          <p className="text-xs font-mono text-white/20 uppercase tracking-wider">Capability</p>
        </div>
        <div className="px-6 py-4 border-l border-white/[0.06] bg-indigo-500/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600" />
            <p className="text-xs font-bold text-white/70">Pulse AI</p>
          </div>
        </div>
        <div className="px-6 py-4 border-l border-white/[0.06]">
          <p className="text-xs font-mono text-white/20">Others</p>
        </div>
      </div>

      {rows.map((row, i) => (
        <motion.div
          key={row.feature}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="grid grid-cols-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors"
        >
          <div className="px-6 py-3.5">
            <p className="text-xs text-white/40">{row.feature}</p>
          </div>
          <div className="px-6 py-3.5 border-l border-white/[0.04] bg-indigo-500/[0.02]">
            <p className="text-xs font-semibold text-emerald-400">{row.pulse}</p>
          </div>
          <div className="px-6 py-3.5 border-l border-white/[0.04]">
            <p className="text-xs text-white/25">{row.others}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────────
function SectionHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="text-center mb-16 max-w-3xl mx-auto"
    >
      {/* Eyebrow pill */}
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm mb-6">
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [1, 2.5, 1] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              className="w-0.5 h-3 bg-indigo-400 rounded-full origin-bottom"
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-white/40 tracking-wide font-mono uppercase">
          7 Core Capabilities
        </span>
      </div>

      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05] mb-5">
        Everything an AI
        <br />
        <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          entity should be.
        </span>
      </h2>

      <p className="text-base sm:text-lg text-white/40 leading-relaxed">
        Pulse isn&apos;t a wrapper around another chatbot. It&apos;s a purpose-built AI entity
        with its own identity, capabilities, and the intelligence to know when to use them.
      </p>
    </motion.div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────────
export function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-24 sm:py-32 overflow-hidden bg-[#050508]"
      aria-label="Pulse AI Features"
    >
      {/* ── Parallax background ────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: bgY }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 20%, #050508 75%)',
          }}
        />
        {/* Ambient blobs */}
        <div
          className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.05), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.05), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </motion.div>

      {/* Left edge rule */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/[0.08] to-transparent hidden xl:block" />

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />

        {/* Feature grid — each card is fully self-contained */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-20">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <p className="text-center text-xs font-mono uppercase tracking-[0.2em] text-white/20 mb-8">
            How Pulse compares
          </p>
          <ComparisonTable />
        </motion.div>

        {/* Bottom CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16"
        >
          <p className="text-sm text-white/30">
            All features available on the{' '}
            <span className="text-white/60 font-semibold">Pro plan</span>
          </p>
          <div className="w-px h-4 bg-white/[0.08] hidden sm:block" />
          <a
            href="/signup?plan=pro"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Start 14-day free trial
            <svg
              width="14" height="14" viewBox="0 0 16 16" fill="none"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <path
                d="M3 8H13M13 8L9 4M13 8L9 12"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}