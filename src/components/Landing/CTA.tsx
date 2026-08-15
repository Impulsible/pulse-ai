/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Landing/CTA.tsx
'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
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
import { PulseGlow } from '@/components/Pulse/PulseGlow'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: PlanFeature[]
  cta: string
  href: string
  badge?: string
  accent: string
  featured: boolean
}

// Animated Number
function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
}: {
  value: number
  suffix?: string
  prefix?: string
}) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          const start = Date.now()
          const duration = 1800
          const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 4)
            setCount(Math.floor(eased * value))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, started])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// Orbiting Particle Ring - FIXED for hydration
function OrbitRing({
  radius,
  duration,
  dotCount = 3,
  reverse = false,
  color = 'bg-indigo-400',
  opacity = 0.4,
}: {
  radius: number
  duration: number
  dotCount?: number
  reverse?: boolean
  color?: string
  opacity?: number
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calculate positions only on the client to avoid hydration mismatches
  const getDotPositions = () => {
    return Array.from({ length: dotCount }).map((_, i) => {
      const angle = (i / dotCount) * 360
      const rad = (angle * Math.PI) / 180
      return {
        x: Math.round(radius + Math.cos(rad) * radius - 4),
        y: Math.round(radius + Math.sin(rad) * radius - 4),
      }
    })
  }

  const positions = isClient ? getDotPositions() : []

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 rounded-full border border-white/[0.04]"
      style={{
        width: radius * 2,
        height: radius * 2,
        marginLeft: -radius,
        marginTop: -radius,
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      suppressHydrationWarning
    >
      {positions.map((pos, i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${color}`}
          style={{
            left: pos.x,
            top: pos.y,
            opacity,
            boxShadow: '0 0 8px currentColor',
          }}
          suppressHydrationWarning
        />
      ))}
    </motion.div>
  )
}

// Floating Social Proof Card
function SocialProofCard({
  avatar,
  name,
  role,
  quote,
  delay,
  className,
}: {
  avatar: string
  name: string
  role: string
  quote: string
  delay: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, delay % 2 === 0 ? -8 : 8, 0] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className="group relative"
      >
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500" />

        <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] p-4 shadow-2xl shadow-black/30">
          <div className="flex gap-0.5 mb-2.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>

          <p className="text-[11px] text-white/50 leading-relaxed mb-3 max-w-[180px]">
            &ldquo;{quote}&rdquo;
          </p>

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {avatar}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-white/80 leading-none">{name}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{role}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Plan Card
function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group"
    >
      {plan.featured && (
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-purple-500/30 opacity-70 blur-sm" />
      )}

      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-md"
      />

      <div
        className={`relative rounded-3xl overflow-hidden border transition-all duration-300 ${
          plan.featured
            ? 'bg-gradient-to-b from-indigo-950/80 to-[#0a0a14]/90 border-indigo-500/30 shadow-2xl shadow-indigo-500/10'
            : 'bg-white/[0.02] border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.04]'
        }`}
      >
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${plan.accent}`} />

        {plan.badge && (
          <div className="absolute top-4 right-4">
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              {plan.badge}
            </span>
          </div>
        )}

        <div className="p-7">
          <div className="mb-6">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/30 mb-2 font-mono">
              {plan.name}
            </p>
            <div className="flex items-end gap-1.5 mb-2">
              <span className="text-4xl font-black text-white tracking-tight">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-sm text-white/30 mb-1.5 font-medium">
                  {plan.period}
                </span>
              )}
            </div>
            <p className="text-xs text-white/35 leading-relaxed">{plan.description}</p>
          </div>

          <div className="h-px bg-white/[0.06] mb-6" />

          <ul className="space-y-3 mb-8">
            {plan.features.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + i * 0.05, duration: 0.4 }}
                className="flex items-start gap-2.5"
              >
                <span
                  className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                    feature.included
                      ? 'bg-indigo-500/15 border border-indigo-500/30'
                      : 'bg-white/[0.03] border border-white/[0.06]'
                  }`}
                >
                  {feature.included ? (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="6" height="6" viewBox="0 0 12 12" fill="none">
                      <path d="M3 3L9 9M9 3L3 9" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-xs leading-relaxed ${
                    feature.included ? 'text-white/60' : 'text-white/20 line-through'
                  }`}
                >
                  {feature.text}
                </span>
              </motion.li>
            ))}
          </ul>

          <Link href={plan.href}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative w-full overflow-hidden py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                plan.featured
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-400 hover:to-violet-500'
                  : 'bg-white/[0.04] border border-white/[0.09] text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.18]'
              }`}
            >
              {plan.featured && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {plan.cta}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// Interactive Input Teaser
function InputTeaser() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [response, setResponse] = useState('')
  const placeholders = [
    'Write a Python script to analyze CSV data...',
    'Explain how transformers work in AI...',
    'Help me debug this React component...',
    'Summarize this 20-page document...',
  ]
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    if (focused || value) return
    const interval = setInterval(() => {
      setPlaceholderIndex((p) => (p + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [focused, value, placeholders.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setSubmitted(true)
    const replies = [
      'Great question! I can help with that. Sign up to get my full response →',
      'I\'d love to tackle this for you. Create your free account to continue →',
      'Interesting! Let me work on that. Join Pulse to see the full answer →',
    ]
    let i = 0
    const reply = replies[Math.floor(Math.random() * replies.length)]
    const interval = setInterval(() => {
      i++
      setResponse(reply.slice(0, i))
      if (i >= reply.length) clearInterval(interval)
    }, 25)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="relative max-w-2xl mx-auto"
    >
      <div
        className={`relative rounded-3xl transition-all duration-500 ${
          focused
            ? 'shadow-[0_0_60px_rgba(99,102,241,0.2)]'
            : 'shadow-[0_0_30px_rgba(0,0,0,0.3)]'
        }`}
      >
        <div
          className={`absolute -inset-px rounded-3xl transition-opacity duration-500 ${
            focused ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.2), rgba(99,102,241,0.1))',
          }}
        />

        <div className="relative rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
            <div className="relative">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <PulseRobot size="sm" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/80">Pulse AI</p>
              <p className="text-[10px] text-emerald-400">Ready · Try me free</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-white/20">GPT-4o</span>
              <div className="w-px h-3 bg-white/[0.08]" />
              <span className="text-[10px] font-mono text-white/20">128k ctx</span>
            </div>
          </div>

          <AnimatePresence>
            {submitted && response && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 py-4 border-b border-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                      <path d="M9.5 2A1.5 1.5 0 0 1 11 3.5v1A1.5 1.5 0 0 1 9.5 6h-1A1.5 1.5 0 0 1 7 4.5v-1A1.5 1.5 0 0 1 8.5 2h1zM12 2h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2V2zM4 8a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {response}
                      {response.length < 60 && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="inline-block w-1 h-3 bg-indigo-400 ml-0.5 align-middle"
                        />
                      )}
                    </p>
                    {response.length >= 60 && (
                      <Link href="/signup">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Create free account
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </motion.span>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <div className="px-5 py-4">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholders[placeholderIndex]}
                    rows={3}
                    className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none resize-none leading-relaxed"
                  />
                ) : (
                  <div className="flex items-center gap-2 py-1">
                    <p className="text-sm text-white/40 italic truncate">&ldquo;{value}&rdquo;</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.05] bg-white/[0.01]">
              <div className="flex items-center gap-3 text-[11px] text-white/20">
                <span className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Encrypted
                </span>
                <span className="w-px h-3 bg-white/[0.06]" />
                <span>No account needed to try</span>
              </div>

              {!submitted ? (
                <button
                  type="submit"
                  disabled={!value.trim()}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Ask Pulse
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              ) : (
                <Link href="/signup">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:scale-[1.02]">
                    Get Full Access
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}

// Counter Strip
function CounterStrip() {
  const stats = [
    { value: 50000, suffix: '+', label: 'Active Users', icon: '👥', color: 'text-indigo-400' },
    { value: 99, suffix: '.9%', label: 'Uptime SLA', icon: '🟢', color: 'text-emerald-400' },
    { value: 12000000, suffix: '+', label: 'Queries Answered', icon: '⚡', color: 'text-violet-400' },
    { value: 150, suffix: 'ms', label: 'Avg Response', icon: '🚀', color: 'text-amber-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] rounded-3xl overflow-hidden border border-white/[0.06]"
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-1 py-6 px-4 bg-[#050508] hover:bg-white/[0.02] transition-colors duration-300"
        >
          <span className="text-xl mb-1">{stat.icon}</span>
          <span className={`text-2xl sm:text-3xl font-black ${stat.color} font-mono`}>
            <AnimatedNumber value={stat.value} suffix={stat.suffix} />
          </span>
          <span className="text-[11px] text-white/30 font-medium text-center">{stat.label}</span>
        </div>
      ))}
    </motion.div>
  )
}

// Trust Logos
function TrustLogos() {
  const companies = [
    { name: 'Vercel', color: '#fff' },
    { name: 'Stripe', color: '#635bff' },
    { name: 'Linear', color: '#5e6ad2' },
    { name: 'Notion', color: '#fff' },
    { name: 'Figma', color: '#a259ff' },
    { name: 'GitHub', color: '#fff' },
    { name: 'Supabase', color: '#3ecf8e' },
    { name: 'Resend', color: '#fff' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative overflow-hidden"
    >
      <p className="text-center text-[11px] font-mono uppercase tracking-[0.25em] text-white/20 mb-6">
        Trusted by teams building at
      </p>

      <div className="flex gap-12 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050508] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050508] to-transparent z-10 pointer-events-none" />

        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 flex-shrink-0"
        >
          {[...companies, ...companies].map((company, i) => (
            <div
              key={`${company.name}-${i}`}
              className="flex items-center gap-2 flex-shrink-0 opacity-25 hover:opacity-50 transition-opacity duration-300"
            >
              <span
                className="text-sm font-bold tracking-wide"
                style={{ color: company.color }}
              >
                {company.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

// Final Push Section
function FinalPush() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 40, damping: 18 })
  const springY = useSpring(mouseY, { stiffness: 40, damping: 18 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = sectionRef.current?.getBoundingClientRect()
      if (!rect) return
      mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 20)
      mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 20)
    },
    [mouseX, mouseY]
  )

  return (
    <div
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative rounded-3xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-[#0a0a14] to-violet-950/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.12),transparent)]" />

      <div className="absolute inset-0 rounded-3xl border border-indigo-500/[0.15]" />
      <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-30">
        <OrbitRing radius={180} duration={30} dotCount={2} color="bg-indigo-400" opacity={0.3} />
        <OrbitRing radius={280} duration={45} dotCount={3} reverse color="bg-violet-400" opacity={0.2} />
        <OrbitRing radius={380} duration={60} dotCount={4} color="bg-purple-400" opacity={0.1} />
      </div>

      {['top-4 left-4 rotate-0', 'top-4 right-4 rotate-90', 'bottom-4 right-4 rotate-180', 'bottom-4 left-4 -rotate-90'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} pointer-events-none`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M0 7V2C0 0.9 0.9 0 2 0H7" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          </svg>
        </div>
      ))}

      <div className="relative z-10 px-8 sm:px-12 lg:px-20 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            style={{ x: springX, y: springY }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-3xl" />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 -m-4 rounded-full border border-dashed border-indigo-500/20"
              />

              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                <PulseRobot size="md" state="idle" />
              </div>

              <div className="absolute -bottom-1 -right-1">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0a0a14]" />
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
              </span>
              <span className="text-[11px] font-semibold text-indigo-300 tracking-wide">
                Join 50,000+ builders
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05] mb-5">
              Your AI entity
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                awaits activation.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-white/40 max-w-xl mx-auto leading-relaxed mb-10">
              Stop fighting with basic chatbots. Pulse thinks, remembers, and grows with you.
              Start free — no credit card, no commitment.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          >
            <Link href="/signup">
              <button className="group relative overflow-hidden flex items-center gap-3 pl-7 pr-4 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-[0_0_40px_rgba(99,102,241,0.35)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
                <span className="relative">Activate Pulse Free</span>
                <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.15] group-hover:bg-white/[0.22] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </Link>

            <Link href="/#pricing">
              <button className="flex items-center gap-2.5 px-7 py-4 rounded-2xl text-sm font-semibold text-white/50 hover:text-white/90 border border-white/[0.07] hover:border-white/[0.18] hover:bg-white/[0.03] transition-all duration-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                Compare plans
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {[
              { icon: '✓', text: 'Free plan forever' },
              { icon: '✓', text: 'No credit card' },
              { icon: '✓', text: 'Cancel anytime' },
              { icon: '✓', text: 'GDPR compliant' },
            ].map((item) => (
              <span key={item.text} className="flex items-center gap-1.5 text-[11px] text-white/25">
                <span className="text-emerald-400/60 font-bold">{item.icon}</span>
                {item.text}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Main CTA Section
export function CTA() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['5%', '-5%'])

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Starter',
      price: '$0',
      period: '/ month',
      description: 'Everything you need to get started with AI assistance.',
      badge: undefined,
      featured: false,
      accent: 'from-transparent via-white/10 to-transparent',
      cta: 'Start Free',
      href: '/signup',
      features: [
        { text: '50 messages per day', included: true },
        { text: 'GPT-3.5 access', included: true },
        { text: 'Basic chat interface', included: true },
        { text: 'File upload (5MB)', included: true },
        { text: 'GPT-4o access', included: false },
        { text: 'Voice mode', included: false },
        { text: 'Persistent memory', included: false },
        { text: 'API access', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: '/ month',
      description: 'For power users and professionals who demand more.',
      badge: 'Most Popular',
      featured: true,
      accent: 'from-transparent via-indigo-500/60 to-transparent',
      cta: 'Start Pro Trial',
      href: '/signup?plan=pro',
      features: [
        { text: 'Unlimited messages', included: true },
        { text: 'GPT-4o + Claude 3.5', included: true },
        { text: 'Real-time voice mode', included: true },
        { text: 'Vision & image analysis', included: true },
        { text: '128k context window', included: true },
        { text: 'Persistent memory', included: true },
        { text: 'File upload (50MB)', included: true },
        { text: 'API access (1k req/day)', included: false },
      ],
    },
    {
      id: 'team',
      name: 'Team',
      price: '$49',
      period: '/ month',
      description: 'Advanced capabilities for growing teams.',
      badge: undefined,
      featured: false,
      accent: 'from-transparent via-violet-500/30 to-transparent',
      cta: 'Start Team Trial',
      href: '/signup?plan=team',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Up to 10 team members', included: true },
        { text: 'Shared workspaces', included: true },
        { text: 'Full API access', included: true },
        { text: 'Priority support', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Admin dashboard', included: true },
        { text: 'SSO / SAML', included: true },
      ],
    },
  ]

  const testimonials = [
    {
      avatar: 'SL',
      name: 'Sarah Lin',
      role: 'Senior Engineer',
      quote: 'Pulse replaced 3 tools for me. The context retention alone is worth it.',
      delay: 0.2,
    },
    {
      avatar: 'MK',
      name: 'Marcus Kim',
      role: 'Product Designer',
      quote: 'Voice mode changed how I brainstorm. It feels like a real collaborator.',
      delay: 0.4,
    },
    {
      avatar: 'AR',
      name: 'Aria Rodriguez',
      role: 'Startup Founder',
      quote: 'We onboarded our whole team in a day. ROI was immediate.',
      delay: 0.6,
    },
  ]

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative py-24 sm:py-32 overflow-hidden bg-[#050508]"
      aria-label="Pricing and CTA"
      suppressHydrationWarning
    >
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: bgY }}>
        <PulseGlow className="top-[10%] left-[10%] w-[500px] h-[500px]" intensity="low" />
        <PulseGlow className="bottom-[10%] right-[10%] w-[400px] h-[400px]" color="#7c3aed" intensity="low" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(99,102,241,0.03),transparent)]" />
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07] mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-[11px] font-semibold text-white/40 tracking-wide uppercase font-mono">
              Simple, transparent pricing
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-5">
            Start free.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Scale when ready.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            No hidden fees, no surprise bills. Every plan includes Pulse&apos;s core AI identity engine.
          </p>
        </motion.div>

        <div className="mb-16">
          <CounterStrip />
        </div>

        <div className="mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-xs font-mono text-white/20 uppercase tracking-[0.2em] mb-5"
          >
            Try Pulse before signing up ↓
          </motion.p>
          <InputTeaser />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-20">
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-20">
          {testimonials.map((t) => (
            <SocialProofCard key={t.name} {...t} />
          ))}
        </div>

        <div className="mb-20">
          <TrustLogos />
        </div>

        <FinalPush />
      </div>
    </section>
  )
}