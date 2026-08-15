// src/components/Landing/Footer.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { PulseRobot } from '@/components/Pulse/PulseRobot'

// Types
interface FooterLink {
  label: string
  href: string
  badge?: string
  isNew?: boolean
  isExternal?: boolean
}

interface FooterSection {
  category: string
  icon: React.ReactNode
  links: FooterLink[]
}

// Social Icons
function TwitterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.03.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

// System Status
type SystemStatusType = 'operational' | 'degraded' | 'outage'

interface SystemStatusState {
  status: SystemStatusType
  label: string
  latency: number
  uptime: number
}

function SystemStatus() {
  const [status, setStatus] = useState<SystemStatusState>({
    status: 'operational',
    label: 'All systems operational',
    latency: 142,
    uptime: 99.98,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        latency: 120 + Math.floor(Math.random() * 40),
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const statusConfig: Record<SystemStatusType, { dot: string; text: string; bg: string }> = {
    operational: {
      dot: 'bg-emerald-400',
      text: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
    },
    degraded: {
      dot: 'bg-amber-400',
      text: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/20',
    },
    outage: {
      dot: 'bg-red-400',
      text: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/20',
    },
  }
  const cfg = statusConfig[status.status]

  return (
    <Link href="/status" className="group">
      <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border ${cfg.bg} transition-all duration-300 hover:scale-[1.02]`}>
        <span className="relative flex h-2 w-2">
          {status.status === 'operational' && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-60`} />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
        </span>
        <span className={`text-xs font-semibold ${cfg.text}`}>
          {status.label}
        </span>
        <span className="text-[10px] font-mono text-white/20">
          {status.latency}ms
        </span>
      </div>
    </Link>
  )
}

// Newsletter Widget
function NewsletterWidget() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [focused, setFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    await new Promise((r) => setTimeout(r, 1200))
    setState('success')
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 font-mono mb-1">
          Stay in the loop
        </p>
        <p className="text-[11px] text-white/25 leading-relaxed">
          Product updates, AI insights, and early access — no spam.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {state === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400">You&apos;re subscribed!</p>
              <p className="text-[10px] text-emerald-400/50">Check your inbox to confirm.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="relative"
          >
            <div
              className={`relative rounded-2xl transition-all duration-300 ${
                focused
                  ? 'shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                  : ''
              }`}
            >
              <div
                className={`absolute -inset-px rounded-2xl transition-opacity duration-300 pointer-events-none ${
                  focused ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.15))',
                }}
              />
              <div className="relative flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-white/20 flex-shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="you@company.com"
                  className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/20 outline-none"
                  disabled={state === 'loading'}
                />
                <button
                  type="submit"
                  disabled={!email.trim() || state === 'loading'}
                  className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {state === 'loading' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-3 h-3 border border-indigo-400/40 border-t-indigo-400 rounded-full"
                    />
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#818cf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

// Live Pulse Stats
function LivePulseStats() {
  const [stats, setStats] = useState({
    users: 50_284,
    messages: 12_847_293,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        users: prev.users + Math.floor(Math.random() * 2),
        messages: prev.messages + Math.floor(Math.random() * 12) + 3,
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-4 pt-2">
      {[
        { label: 'users', value: stats.users.toLocaleString(), color: 'text-indigo-400' },
        { label: 'messages', value: stats.messages.toLocaleString(), color: 'text-violet-400' },
      ].map((stat) => (
        <div key={stat.label} className="flex flex-col">
          <AnimatePresence mode="wait">
            <motion.span
              key={stat.value}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-sm font-bold font-mono tabular-nums ${stat.color}`}
            >
              {stat.value}
            </motion.span>
          </AnimatePresence>
          <span className="text-[10px] text-white/20">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

// Footer Link
function FooterLink({ link }: { link: FooterLink }) {
  return (
    <li>
      <Link
        href={link.href}
        target={link.isExternal ? '_blank' : undefined}
        rel={link.isExternal ? 'noopener noreferrer' : undefined}
        className="group flex items-center gap-2 text-sm text-white/30 hover:text-white/80 transition-all duration-200"
      >
        <span className="relative">
          {link.label}
          <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-indigo-400/60 to-violet-400/60 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </span>
        {link.isNew && (
          <span className="text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
            NEW
          </span>
        )}
        {link.badge && (
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/25">
            {link.badge}
          </span>
        )}
        {link.isExternal && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className="opacity-30 group-hover:opacity-70 transition-opacity">
            <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </Link>
    </li>
  )
}

// Social Button
function SocialButton({
  href,
  label,
  icon,
  color,
}: {
  href: string
  label: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="group relative w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.07] text-white/35 hover:text-white/80 transition-all duration-300 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${color}15, transparent 70%)` }}
      />
      <span className="relative z-10">{icon}</span>
    </motion.a>
  )
}

// Animated Background Grid
function FooterGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050508] to-transparent" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(99,102,241,0.04), transparent 60%)',
        }}
      />
    </div>
  )
}

// Main Footer
export function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ['start end', 'end end'],
  })
  const logoY = useTransform(scrollYProgress, [0, 1], [20, 0])
  const logoOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 1])

  // Navigation Data
  const footerSections: FooterSection[] = [
    {
      category: 'Product',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'How It Works', href: '/#how-it-works' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'Roadmap', href: '/roadmap', isNew: true },
        { label: 'Changelog', href: '/changelog', badge: 'v3.0' },
      ],
    },
    {
      category: 'Developers',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/api-docs' },
        { label: 'SDKs & Libraries', href: '/sdks' },
        { label: 'GitHub', href: 'https://github.com/pulse-ai', isExternal: true },
        { label: 'Status Page', href: '/status' },
      ],
    },
    {
      category: 'Company',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      links: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers', isNew: true },
        { label: 'Press Kit', href: '/press' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      category: 'Legal',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Security', href: '/security' },
        { label: 'GDPR', href: '/gdpr' },
      ],
    },
  ]

  const socials = [
    { href: 'https://twitter.com/pulse_ai', label: 'Twitter / X', icon: <TwitterIcon />, color: '#1d9bf0' },
    { href: 'https://github.com/pulse-ai', label: 'GitHub', icon: <GitHubIcon />, color: '#ffffff' },
    { href: 'https://discord.gg/pulse-ai', label: 'Discord', icon: <DiscordIcon />, color: '#5865f2' },
    { href: 'https://linkedin.com/company/pulse-ai', label: 'LinkedIn', icon: <LinkedInIcon />, color: '#0a66c2' },
    { href: 'https://youtube.com/@pulse-ai', label: 'YouTube', icon: <YoutubeIcon />, color: '#ff0000' },
  ]

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#050508] overflow-hidden"
      aria-label="Site footer"
    >
      <FooterGrid />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Pre-footer CTA strip */}
      <div className="relative z-10 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="text-center lg:text-left"
            >
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                Ready to meet your{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  AI entity?
                </span>
              </h3>
              <p className="text-sm text-white/35">
                Join 50,000+ teams already building with Pulse.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col sm:flex-row items-center gap-3"
            >
              <Link href="/signup">
                <button className="group relative overflow-hidden flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.45)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                  </svg>
                  <span className="relative">Start Free Today</span>
                </button>
              </Link>
              <Link href="/docs">
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white/40 hover:text-white/80 border border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-300">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Read the docs
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Brand column */}
          <motion.div
            style={{ y: logoY, opacity: logoOpacity }}
            className="lg:col-span-4 flex flex-col gap-6"
          >
            <div>
              <Link href="/" className="group inline-flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-indigo-500/15 to-violet-500/15 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                  <div className="relative">
                    <PulseRobot size="sm" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-white">PULSE</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
                      AI
                    </span>
                  </div>
                  <p className="text-[10px] text-white/25 font-mono tracking-wider -mt-0.5">
                    Cognitive AI Entity
                  </p>
                </div>
              </Link>

              <p className="text-sm text-white/35 leading-relaxed max-w-xs">
                Pulse is an AI entity with its own identity — built for deep reasoning,
                real-time voice, and genuinely useful conversations.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/20 mb-2">
                Live Activity
              </p>
              <LivePulseStats />
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/20 mb-3">
                Follow Pulse
              </p>
              <div className="flex items-center gap-2">
                {socials.map((s) => (
                  <SocialButton key={s.label} {...s} />
                ))}
              </div>
            </div>

            <NewsletterWidget />
          </motion.div>

          {/* Navigation columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: sectionIndex * 0.08,
                  duration: 0.5,
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-white/20">{section.icon}</span>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 font-mono">
                    {section.category}
                  </h3>
                </div>

                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <FooterLink key={link.label} link={link} />
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-3 text-xs text-white/20"
            >
              <span>© {new Date().getFullYear()} Pulse AI, Inc.</span>
              <span className="w-px h-3 bg-white/[0.08]" />
              <span className="font-mono">v3.0.1</span>
              <span className="w-px h-3 bg-white/[0.08]" />
              <span>Made with ♥ by humans + AI</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <SystemStatus />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-4"
            >
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Security', href: '/security' },
              ].map((link, i) => (
                <span key={link.label} className="flex items-center gap-4">
                  <Link
                    href={link.href}
                    className="text-xs text-white/20 hover:text-white/60 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                  {i < 2 && <span className="w-px h-3 bg-white/[0.06]" />}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
        }}
      />
    </footer>
  )
}