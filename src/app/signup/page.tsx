/* eslint-disable react-hooks/exhaustive-deps */
// src/app/signup/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { PulseRobot } from '@/components/Pulse/PulseRobot'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/UI/Toast'
import { cn } from '@/utils/cn'

// ─── Icons ───────────────────────────────────────────────────────────────────────
const I = {
  User: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>,
  Lock: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Eye: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Arrow: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  ArrowLeft: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Google: () => <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  GitHub: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>,
  Shield: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  Check: () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>,
  Star: () => <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Sparkle: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5L12 0z"/></svg>,
  Cpu: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  Voice: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
  Memory: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Bolt: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
}

// ─── Back to Home Button ─────────────────────────────────────────────────────────
function BackToHome() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="fixed top-6 left-6 z-20"
    >
      <Link
        href="/"
        className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-[#0c0c16] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200"
      >
        <motion.span
          className="text-white/40 group-hover:text-white/70 transition-colors"
          animate={{ x: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <I.ArrowLeft />
        </motion.span>
        <span className="text-[11px] font-mono font-semibold text-white/40 group-hover:text-white/70 tracking-wide transition-colors">
          Back to home
        </span>
      </Link>
    </motion.div>
  )
}

// ─── Hex Grid Background ──────────────────────────────────────────────────────────
function HexGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="hex" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
            <path d="M28 66L0 50V16L28 0l28 16v34L28 66zM28 100L0 84V50l28-16 28 16v34L28 100z"
              fill="none" stroke="rgba(120,130,255,0.5)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
      </svg>
    </div>
  )
}

// ─── Orbit Rings ──────────────────────────────────────────────────────────────────
function OrbitSystem() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[180, 260, 340, 420].map((size, i) => (
        <motion.div key={i}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 30 + i * 15, repeat: Infinity, ease: 'linear' }}
          className="absolute rounded-full border"
          style={{
            width: size, height: size,
            borderColor: `rgba(120,130,255,${0.06 - i * 0.012})`,
            borderStyle: i % 2 === 0 ? 'solid' : 'dashed',
          }}
        >
          <div className="absolute rounded-full"
            style={{
              width: 4 + i, height: 4 + i,
              top: -2, left: '50%', marginLeft: -(2 + i / 2),
              background: `rgba(120,130,255,${0.4 - i * 0.08})`,
              boxShadow: `0 0 ${6 + i * 2}px rgba(120,130,255,${0.3 - i * 0.06})`,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

// ─── Noise Overlay ────────────────────────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }}
    />
  )
}

// ─── Live Clock ───────────────────────────────────────────────────────────────────
function Clock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [])
  return <span className="tabular-nums">{t}</span>
}

// ─── Password Strength ───────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Symbol', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length

  if (!password) return null

  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-2 pt-1"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: i < score ? '100%' : '0%' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={cn('h-full rounded-full', i < score ? colors[score - 1] : '')}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('text-[9px] font-mono', score <= 1 ? 'text-red-400/60' : score <= 2 ? 'text-yellow-400/60' : 'text-emerald-400/60')}>
          {labels[score - 1] || 'Too short'}
        </span>
        <div className="flex gap-2">
          {checks.map((c) => (
            <span key={c.label} className={cn('text-[8px] font-mono transition-colors', c.pass ? 'text-emerald-400/50' : 'text-white/10')}>
              {c.pass ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────────────────
function TestimonialCarousel() {
  const testimonials = [
    { name: 'Sarah Chen', role: 'Staff Eng · Vercel', text: 'Setting up took 2 minutes. The AI understood my workflow instantly.', avatar: 'SC' },
    { name: 'Alex Rivera', role: 'CTO · Raycast', text: 'The onboarding experience is the smoothest I\'ve seen in any AI tool.', avatar: 'AR' },
    { name: 'Mika Patel', role: 'ML Lead · Stripe', text: 'From signup to first useful output in under 60 seconds. Incredible.', avatar: 'MP' },
  ]
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % testimonials.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative h-[130px]">
      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex gap-0.5 mb-2.5">
              {[...Array(5)].map((_, i) => <I.Star key={i} />)}
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed mb-3 italic">
              &ldquo;{testimonials[active].text}&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[8px] font-black text-white">
                {testimonials[active].avatar}
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-white/50">{testimonials[active].name}</p>
                <p className="text-[8px] font-mono text-white/20">{testimonials[active].role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {testimonials.map((_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={cn('h-1.5 rounded-full transition-all duration-300',
              i === active ? 'bg-indigo-400 w-4' : 'bg-white/15 w-1.5 hover:bg-white/25'
            )} />
        ))}
      </div>
    </div>
  )
}

// ─── Signup Benefits ──────────────────────────────────────────────────────────────
function SignupBenefits() {
  const benefits = [
    'Unlimited AI conversations',
    'Voice & text interface',
    'Persistent memory across sessions',
    'Access to 200+ integrations',
    'Priority model access',
  ]

  return (
    <div className="space-y-2">
      {benefits.map((b, i) => (
        <motion.div key={b}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.08 }}
          className="flex items-center gap-2.5"
        >
          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <I.Check />
          </div>
          <span className="text-[11px] font-mono text-white/35">{b}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Feature Pills ────────────────────────────────────────────────────────────────
function FeatureRow() {
  const items = [
    { icon: <I.Cpu />, label: 'Reasoning', color: '#818cf8' },
    { icon: <I.Voice />, label: 'Voice', color: '#34d399' },
    { icon: <I.Memory />, label: 'Memory', color: '#a78bfa' },
    { icon: <I.Bolt />, label: 'Actions', color: '#fbbf24' },
  ]
  return (
    <div className="flex gap-2 flex-wrap">
      {items.map((f, i) => (
        <motion.div key={f.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.07 }}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02]"
        >
          <span style={{ color: f.color }}>{f.icon}</span>
          <span className="text-[9px] font-mono text-white/35">{f.label}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Input Field ──────────────────────────────────────────────────────────────────
function Field({ id, label, type, value, onChange, icon, error, autoComplete, right, placeholder }: {
  id: string; label: string; type: string; value: string; onChange: (v: string) => void
  icon: React.ReactNode; error?: string; autoComplete?: string; right?: React.ReactNode; placeholder?: string
}) {
  const [f, setF] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 text-[11px] font-medium text-white/35">{label}</label>
      <div className="relative">
        <div className={cn(
          'relative flex items-center rounded-xl border transition-all duration-200',
          error ? 'border-red-500/25 bg-red-500/[0.03]'
            : f ? 'border-indigo-500/40 bg-white/[0.03] shadow-[0_0_0_3px_rgba(99,102,241,0.08)]'
              : 'border-white/[0.07] bg-white/[0.015] hover:border-white/[0.12]'
        )}>
          <span className={cn('pl-3.5 flex-shrink-0 transition-colors', f ? 'text-indigo-400' : 'text-white/20')}>{icon}</span>
          <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
            onFocus={() => setF(true)} onBlur={() => setF(false)}
            autoComplete={autoComplete} placeholder={placeholder}
            className="flex-1 px-3 py-3 bg-transparent text-[13px] text-white/90 placeholder:text-white/12 outline-none font-mono caret-indigo-400 autofill-fix"
          />
          {right && <div className="pr-3 flex-shrink-0">{right}</div>}
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-[10px] font-mono text-red-400/70 px-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN — Blur-Free
// ═══════════════════════════════════════════════════════════════════════════════════
export default function SignupPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { addToast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string; terms?: string }>({})

  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = `
      .autofill-fix:-webkit-autofill,
      .autofill-fix:-webkit-autofill:hover,
      .autofill-fix:-webkit-autofill:focus,
      .autofill-fix:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #0c0c16 inset !important;
        -webkit-text-fill-color: rgba(255,255,255,0.9) !important;
        caret-color: #818cf8 !important;
        transition: background-color 9999s ease-in-out 0s !important;
      }
    `
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [])

  const validate = () => {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid format'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Min 8 characters'
    if (!confirmPassword) e.confirm = 'Please confirm'
    else if (password !== confirmPassword) e.confirm = 'Passwords don\'t match'
    if (!agreed) e.terms = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({ email, password, name })
      addToast({ title: 'Account created!', description: 'Welcome to Pulse AI', type: 'success' })
      router.push('/chat')
    } catch (err) {
      addToast({ title: 'Registration failed', description: err instanceof Error ? err.message : 'Please try again', type: 'error' })
    } finally { setLoading(false) }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    try {
      const result = await signIn(provider, {
        callbackUrl: '/chat',
        redirect: true,
      })
      if (result?.error) throw new Error(result.error)
    } catch (err) {
      addToast({
        title: `${provider === 'google' ? 'Google' : 'GitHub'} sign-up failed`,
        description: err instanceof Error ? err.message : 'Please try again',
        type: 'error',
      })
      setOauthLoading(null)
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-[#08080e] overflow-hidden px-4 py-8">

      <BackToHome />

      <HexGrid />
      <OrbitSystem />
      <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07), transparent 60%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 60%)', filter: 'blur(70px)' }} />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.04), transparent 50%)', filter: 'blur(100px)' }} />
      <NoiseOverlay />

      {/* Card — no tilt, no backdrop-blur = crystal clear */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-[920px]"
      >
        <div className="relative rounded-[24px] border border-white/[0.07] bg-[#0c0c16] shadow-2xl shadow-black/50 overflow-hidden">
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent" />

          <div className="flex flex-col lg:flex-row">
            {/* LEFT */}
            <div className="lg:w-[45%] p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.05]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center">
                      <PulseRobot size="sm" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 border border-[#0c0c16]" />
                    </span>
                  </div>
                  <span className="text-sm font-black font-mono text-white tracking-tight">PULSE</span>
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 tracking-[0.1em]">AI</span>
                </Link>
              </motion.div>

              <div className="flex-1 flex flex-col justify-center">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/12">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="text-indigo-400">
                      <I.Sparkle />
                    </motion.span>
                    <span className="text-[10px] font-mono font-semibold text-indigo-300/70 tracking-wide">Free to start · No credit card</span>
                  </div>

                  <h1 className="text-[26px] lg:text-[32px] font-black text-white tracking-tight leading-[1.1] mb-4">
                    Start building
                    <br />
                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)' }}>
                      something
                    </span>{' '}
                    brilliant.
                  </h1>
                  <p className="text-[13px] text-white/30 leading-relaxed max-w-[300px] mb-6">
                    Create your account and get instant access to the most advanced AI workspace.
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-6">
                  <FeatureRow />
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-6">
                  <p className="text-[9px] font-mono text-white/15 uppercase tracking-[0.15em] mb-3">What you get</p>
                  <SignupBenefits />
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                  <TestimonialCarousel />
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 text-[9px] font-mono text-white/15">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  52K+ USERS ONBOARDED
                </div>
                <span className="text-[9px] font-mono text-white/12"><Clock /></span>
              </motion.div>
            </div>

            {/* RIGHT — Form */}
            <div className="lg:w-[55%] p-8 lg:p-10 flex flex-col justify-center">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="mb-7">
                <h2 className="text-[22px] font-black text-white tracking-tight mb-1.5">Create account</h2>
                <p className="text-[12px] font-mono text-white/22">Fill in your details to get started</p>
              </motion.div>

              {/* OAuth */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-2.5 mb-5">
                <motion.button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={oauthLoading !== null || loading}
                  whileHover={{ y: oauthLoading || loading ? 0 : -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] text-[12px] font-mono text-white/45 hover:text-white/70 hover:border-white/[0.14] hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {oauthLoading === 'google' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                        className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full"
                      />
                      <span>Connecting…</span>
                    </>
                  ) : (
                    <>
                      <I.Google />
                      <span>Google</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={oauthLoading !== null || loading}
                  whileHover={{ y: oauthLoading || loading ? 0 : -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015] text-[12px] font-mono text-white/45 hover:text-white/70 hover:border-white/[0.14] hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {oauthLoading === 'github' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                        className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full"
                      />
                      <span>Connecting…</span>
                    </>
                  ) : (
                    <>
                      <I.GitHub />
                      <span>GitHub</span>
                    </>
                  )}
                </motion.button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/[0.05]" />
                <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </motion.div>

              <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                onSubmit={submit} className="space-y-3.5">

                <Field id="name" label="Full name" type="text" value={name}
                  onChange={(v) => { setName(v); setErrors((p) => ({ ...p, name: undefined })) }}
                  icon={<I.User />} error={errors.name} autoComplete="name" placeholder="John Doe" />

                <Field id="email" label="Email address" type="email" value={email}
                  onChange={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: undefined })) }}
                  icon={<I.Mail />} error={errors.email} autoComplete="email" placeholder="you@company.com" />

                <div>
                  <Field id="password" label="Password" type={showPw ? 'text' : 'password'} value={password}
                    onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })) }}
                    icon={<I.Lock />} error={errors.password} autoComplete="new-password" placeholder="Min 8 characters"
                    right={
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="text-white/18 hover:text-white/45 transition-colors" aria-label={showPw ? 'Hide' : 'Show'}>
                        {showPw ? <I.EyeOff /> : <I.Eye />}
                      </button>
                    } />
                  <PasswordStrength password={password} />
                </div>

                <Field id="confirm" label="Confirm password" type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={(v) => { setConfirmPassword(v); setErrors((p) => ({ ...p, confirm: undefined })) }}
                  icon={<I.Lock />} error={errors.confirm} autoComplete="new-password" placeholder="Re-enter password"
                  right={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="text-white/18 hover:text-white/45 transition-colors" aria-label={showConfirm ? 'Hide' : 'Show'}>
                      {showConfirm ? <I.EyeOff /> : <I.Eye />}
                    </button>
                  } />

                <div className="pt-1">
                  <label className="group flex items-start gap-2.5 cursor-pointer">
                    <div className="relative mt-0.5">
                      <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((p) => ({ ...p, terms: undefined })) }} className="sr-only peer" />
                      <div className={cn(
                        'h-4 w-4 rounded border transition-all',
                        errors.terms ? 'border-red-500/40 bg-red-500/10' : 'border-white/[0.1] bg-white/[0.02] peer-checked:border-indigo-500/40 peer-checked:bg-indigo-500/15'
                      )} />
                      <motion.div initial={false} animate={{ scale: agreed ? 1 : 0, opacity: agreed ? 1 : 0 }}
                        className="absolute inset-0 flex items-center justify-center text-indigo-400">
                        <I.Check />
                      </motion.div>
                    </div>
                    <span className="text-[11px] text-white/25 group-hover:text-white/40 transition-colors leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" className="text-indigo-400/50 hover:text-indigo-300 underline underline-offset-2">Terms</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-indigo-400/50 hover:text-indigo-300 underline underline-offset-2">Privacy Policy</Link>
                    </span>
                  </label>
                  <AnimatePresence>
                    {errors.terms && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-1 text-[10px] font-mono text-red-400/70 px-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />Please accept to continue
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button type="submit" disabled={loading || oauthLoading !== null}
                  whileHover={{ scale: loading || oauthLoading ? 1 : 1.008 }}
                  whileTap={{ scale: loading || oauthLoading ? 1 : 0.995 }}
                  className={cn(
                    'group relative w-full overflow-hidden rounded-xl py-3 font-semibold text-[13px] transition-all duration-300 mt-1',
                    'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white',
                    'shadow-[0_2px_16px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_28px_rgba(99,102,241,0.35)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}>
                  {!loading && <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />}
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                          className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full" />
                        <span className="font-mono text-[12px]">Creating account...</span>
                      </>
                    ) : (
                      <>
                        Create account
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/15 group-hover:bg-white/25 transition-colors">
                          <I.Arrow />
                        </span>
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.form>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                className="mt-6 space-y-4">
                <p className="text-center text-[12px] text-white/18">
                  Already have an account?{' '}
                  <Link href="/login" className="text-indigo-400/55 hover:text-indigo-300 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>

                <div className="flex items-center justify-center gap-4">
                  {['E2E Encrypted', 'SOC2', 'GDPR'].map((b) => (
                    <span key={b} className="flex items-center gap-1 text-[9px] font-mono text-white/10">
                      <span className="text-emerald-400/30"><I.Shield /></span>{b}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}