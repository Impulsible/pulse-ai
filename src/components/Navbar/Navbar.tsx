/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Navbar/Navbar.tsx
'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/utils/cn'
import { PulseRobot } from '@/components/Pulse/PulseRobot'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'

// ─── Types ──────────────────────────────────────────────────────────────────────
interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  description: string
  badge?: string
  isNew?: boolean
  status?: 'live' | 'beta' | 'new'
}

interface NavGroup {
  category: string
  color: string
  items: NavItem[]
}

// ─── Icon System ─────────────────────────────────────────────────────────────────
const Icons = {
  Features: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="3.5" />
    </svg>
  ),
  HowItWorks: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="5" cy="12" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="19" cy="18" r="2" />
      <path d="M7 11L17 7M7 13L17 17" />
    </svg>
  ),
  Pricing: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  About: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  Docs: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  API: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Blog: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Changelog: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  GitHub: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  Discord: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.03.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  ),
  Search: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Arrow: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Terminal: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  Zap: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
}

// ─── Status Badge ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'live' | 'beta' | 'new' }) {
  const cfg = {
    live: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    beta: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    new: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  }
  return (
    <span className={`text-[8px] font-bold font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-full border ${cfg[status]}`}>
      {status}
    </span>
  )
}

// ─── Terminal Cursor ──────────────────────────────────────────────────────────────
function TerminalCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
      className="inline-block w-[7px] h-[13px] bg-indigo-400 rounded-sm align-middle ml-0.5"
    />
  )
}

// ─── Kbd Key ──────────────────────────────────────────────────────────────────────
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[9px] font-mono text-white/25 leading-none select-none">
      {children}
    </kbd>
  )
}

// ─── Live Pulse Dot ───────────────────────────────────────────────────────────────
function LiveDot({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
  return (
    <span className="relative flex flex-shrink-0">
      <span className={`absolute inline-flex ${dim} rounded-full bg-emerald-400 animate-ping opacity-50`} />
      <span className={`relative inline-flex ${dim} rounded-full bg-emerald-400`} />
    </span>
  )
}

// ─── Scroll Progress Bar ──────────────────────────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])
  return (
    <motion.div
      style={{ scaleX, transformOrigin: 'left' }}
      className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 origin-left"
    />
  )
}

// ─── System Stats Bar (top of dropdown) ──────────────────────────────────────────
function SystemStatsBar() {
  const [latency, setLatency] = useState(142)
  const [uptime] = useState(99.98)

  useEffect(() => {
    const i = setInterval(() => {
      setLatency(120 + Math.floor(Math.random() * 40))
    }, 2500)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-white/[0.05] bg-white/[0.01]">
      <div className="flex items-center gap-1.5">
        <LiveDot size="sm" />
        <span className="text-[9px] font-mono text-emerald-400 font-bold">SYS:ONLINE</span>
      </div>
      <div className="w-px h-3 bg-white/[0.06]" />
      <span className="text-[9px] font-mono text-white/20">
        latency: <span className="text-indigo-400">{latency}ms</span>
      </span>
      <div className="w-px h-3 bg-white/[0.06]" />
      <span className="text-[9px] font-mono text-white/20">
        uptime: <span className="text-violet-400">{uptime}%</span>
      </span>
      <div className="ml-auto flex items-center gap-1">
        <span className="text-[9px] font-mono text-white/15">PULSE_CORE</span>
        <span className="text-[9px] font-mono text-indigo-400/60">v3.0.1</span>
      </div>
    </div>
  )
}

// ─── Mega Dropdown ────────────────────────────────────────────────────────────────
function MegaDropdown({ groups, isOpen }: { groups: NavGroup[]; isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.99 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[680px] z-50"
        >
          {/* Connector line */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-gradient-to-b from-transparent to-indigo-500/20" />
          {/* Connector dot */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500/40 border border-indigo-500/30" />

          <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#080810]/97 backdrop-blur-2xl shadow-2xl shadow-black/60">
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />

            {/* HUD corner decorations */}
            {['top-2 left-2', 'top-2 right-2 rotate-90', 'bottom-2 right-2 rotate-180', 'bottom-2 left-2 -rotate-90'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} pointer-events-none`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M0 4V1C0 0.45 0.45 0 1 0H4" stroke="rgba(99,102,241,0.2)" strokeWidth="0.8" />
                </svg>
              </div>
            ))}

            {/* System stats bar */}
            <SystemStatsBar />

            {/* Nav groups grid */}
            <div className="grid grid-cols-3 divide-x divide-white/[0.04]">
              {groups.map((group) => (
                <div key={group.category} className="p-4">
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="h-px flex-1 bg-white/[0.05]" />
                    <span className="text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-white/20">
                      {group.category}
                    </span>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>

                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group/item relative flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-all duration-200 overflow-hidden"
                      >
                        {/* Hover accent line */}
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 rounded-full group-hover/item:h-[60%] transition-all duration-300"
                          style={{ background: group.color }}
                        />

                        {/* Icon */}
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white/30 group-hover/item:text-white/70 transition-all duration-200 border border-white/[0.05] group-hover/item:border-white/[0.1]"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                          }}
                        >
                          {item.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold font-mono text-white/50 group-hover/item:text-white/90 transition-colors">
                              {item.label}
                            </span>
                            {item.status && <StatusBadge status={item.status} />}
                            {item.badge && (
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/20">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/20 leading-snug font-mono">
                            {item.description}
                          </p>
                        </div>

                        {/* Arrow */}
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          className="flex-shrink-0 text-white/20 mt-1 opacity-0 group-hover/item:opacity-100 transition-all duration-200"
                        >
                          <Icons.Arrow />
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/[0.05] bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-mono text-white/20 hover:text-white/50 transition-colors"
                >
                  <Icons.GitHub />
                  Open Source
                </a>
                <span className="w-px h-3 bg-white/[0.06]" />
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-mono text-white/20 hover:text-indigo-400/70 transition-colors"
                >
                  <Icons.Discord />
                  Community
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Kbd>↑↓</Kbd>
                <span className="text-[9px] font-mono text-white/15">navigate</span>
                <span className="mx-1 text-white/10">·</span>
                <Kbd>↵</Kbd>
                <span className="text-[9px] font-mono text-white/15">open</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Command Palette ──────────────────────────────────────────────────────────────
function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const allCommands = [
    { label: 'pulse --features', desc: 'View all AI capabilities', href: '/#features', icon: <Icons.Features /> },
    { label: 'pulse --pricing', desc: 'Compare plans & pricing', href: '/#pricing', icon: <Icons.Pricing /> },
    { label: 'pulse --docs', desc: 'Read documentation', href: '/docs', icon: <Icons.Docs /> },
    { label: 'pulse --api', desc: 'API reference guide', href: '/api-docs', icon: <Icons.API /> },
    { label: 'pulse --blog', desc: 'Latest articles & updates', href: '/blog', icon: <Icons.Blog /> },
    { label: 'pulse --changelog', desc: "What's new in v3.0", href: '/changelog', icon: <Icons.Changelog /> },
    { label: 'pulse --about', desc: 'Our mission & team', href: '/#about', icon: <Icons.About /> },
    { label: 'pulse --login', desc: 'Sign into your account', href: '/login', icon: <Icons.Terminal /> },
    { label: 'pulse --signup', desc: 'Create free account', href: '/signup', icon: <Icons.Zap /> },
  ]

  const filtered = query
    ? allCommands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.desc.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60)
    } else {
      setQuery('')
      setActiveIdx(0)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && filtered[activeIdx]) {
      window.location.href = filtered[activeIdx].href
      setOpen(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200 group"
        aria-label="Open command palette (⌘K)"
      >
        <span className="text-white/20 group-hover:text-white/50 transition-colors">
          <Icons.Search />
        </span>
        <span className="text-[11px] font-mono text-white/15 group-hover:text-white/35 transition-colors">
          pulse --search
        </span>
        <div className="flex items-center gap-0.5 ml-3">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      </button>

      {/* Palette modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -16 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-[70] px-4"
            >
              <div className="rounded-2xl bg-[#080810]/98 backdrop-blur-2xl border border-white/[0.09] shadow-2xl shadow-black/70 overflow-hidden"
                onKeyDown={handleKeyDown}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent" />

                {/* HUD corners */}
                {['top-2 left-2', 'top-2 right-2 rotate-90'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} pointer-events-none`}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M0 4V1C0 0.45 0.45 0 1 0H4" stroke="rgba(99,102,241,0.25)" strokeWidth="0.8" />
                    </svg>
                  </div>
                ))}

                {/* Input row */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                  <span className="text-indigo-400/60 font-mono text-sm flex-shrink-0">$</span>
                  <div className="flex-1 flex items-center gap-0">
                    <span className="text-[11px] font-mono text-white/20 flex-shrink-0">
                      pulse --
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setActiveIdx(0) }}
                      placeholder="search commands..."
                      className="flex-1 bg-transparent text-sm font-mono text-white/70 placeholder:text-white/15 outline-none caret-indigo-400 ml-0"
                    />
                    {!query && <TerminalCursor />}
                  </div>
                  <button onClick={() => setOpen(false)}>
                    <Kbd>ESC</Kbd>
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto py-1.5">
                  {filtered.length > 0 ? (
                    filtered.map((cmd, i) => (
                      <Link
                        key={cmd.href}
                        href={cmd.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer',
                          activeIdx === i
                            ? 'bg-indigo-500/10 border border-indigo-500/15'
                            : 'hover:bg-white/[0.03]'
                        )}
                        onMouseEnter={() => setActiveIdx(i)}
                      >
                        <span className={cn(
                          'flex-shrink-0 transition-colors duration-150',
                          activeIdx === i ? 'text-indigo-400' : 'text-white/25'
                        )}>
                          {cmd.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-xs font-mono transition-colors',
                            activeIdx === i ? 'text-white/90' : 'text-white/45'
                          )}>
                            {cmd.label}
                          </p>
                          <p className="text-[10px] font-mono text-white/20 truncate">
                            {cmd.desc}
                          </p>
                        </div>
                        {activeIdx === i && (
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-shrink-0 text-indigo-400/60"
                          >
                            <Icons.Arrow />
                          </motion.div>
                        )}
                      </Link>
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-10">
                      <div className="font-mono text-xs text-white/20">
                        <span className="text-red-400/60">ERROR:</span> command not found — &quot;{query}&quot;
                      </div>
                      <p className="text-[10px] font-mono text-white/10">
                        try a different search term
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.05] bg-white/[0.01]">
                  <div className="flex items-center gap-3 text-[9px] font-mono text-white/15">
                    <span className="flex items-center gap-1">
                      <Kbd>↑↓</Kbd> navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <Kbd>↵</Kbd> execute
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono">
                    <LiveDot size="sm" />
                    <span className="text-white/15">PULSE_SEARCH_v3</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Desktop Nav Trigger ──────────────────────────────────────────────────────────
function DesktopNavTrigger({
  label,
  href,
  groups,
  isActive,
}: {
  label: string
  href?: string
  groups?: NavGroup[]
  isActive?: boolean
}) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<NodeJS.Timeout | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const handleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 100)
  }

  if (href && !groups) {
    return (
      <Link
        href={href}
        className={cn(
          'relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-xl transition-all duration-200',
          isActive
            ? 'text-white bg-white/[0.06] border border-white/[0.08]'
            : 'text-white/35 hover:text-white/80 hover:bg-white/[0.03]'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="navActivePill"
            className="absolute inset-0 rounded-xl"
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </Link>
    )
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button
        className={cn(
          'flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-xl transition-all duration-200',
          open
            ? 'text-white/90 bg-white/[0.06] border border-white/[0.08]'
            : 'text-white/35 hover:text-white/80 hover:bg-white/[0.03]'
        )}
      >
        <span>{label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={cn('transition-colors', open ? 'text-indigo-400' : 'text-white/20')}
        >
          <Icons.ChevronDown />
        </motion.span>
      </button>

      {groups && <MegaDropdown groups={groups} isOpen={open} />}
    </div>
  )
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────────
function MobileDrawer({
  isOpen,
  onClose,
  groups,
}: {
  isOpen: boolean
  onClose: () => void
  groups: NavGroup[]
}) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Explore')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-lg md:hidden"
            onClick={onClose}
          />

          {/* Right-side drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[88vw] max-w-[340px] md:hidden"
          >
            <div className="h-full flex flex-col bg-[#070710]/98 backdrop-blur-2xl border-l border-white/[0.07] overflow-hidden">
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />

              {/* HUD corners */}
              {['bottom-3 right-3 rotate-180', 'bottom-3 left-3 -rotate-90'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} pointer-events-none`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M0 4V1C0 0.45 0.45 0 1 0H4" stroke="rgba(99,102,241,0.15)" strokeWidth="0.8" />
                  </svg>
                </div>
              ))}

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/15 flex items-center justify-center">
                      <PulseRobot size="sm" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <LiveDot size="sm" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black font-mono text-white">PULSE</span>
                      <span className="text-[9px] font-mono text-indigo-400/70">AI</span>
                    </div>
                    <p className="text-[9px] font-mono text-white/20 -mt-0.5">
                      COGNITIVE_ENTITY_v3
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Status row */}
              <div className="px-4 py-2.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.12]">
                  <LiveDot />
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    SYS:ONLINE — READY_TO_ASSIST
                  </span>
                </div>
              </div>

              {/* Scrollable nav content */}
              <div className="flex-1 overflow-y-auto py-3">
                {groups.map((group, gi) => (
                  <div key={group.category} className="mb-1">
                    {/* Group toggle */}
                    <button
                      onClick={() => setExpandedGroup(
                        expandedGroup === group.category ? null : group.category
                      )}
                      className="w-full flex items-center justify-between px-5 py-2 group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-px w-4 bg-white/[0.06]" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/20">
                          {group.category}
                        </span>
                      </div>
                      <motion.span
                        animate={{ rotate: expandedGroup === group.category ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/15"
                      >
                        <Icons.ChevronDown />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedGroup === group.category && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-2 space-y-0.5">
                            {group.items.map((item, ii) => (
                              <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: ii * 0.04, duration: 0.2 }}
                              >
                                <Link
                                  href={item.href}
                                  onClick={onClose}
                                  className="group/item flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition-all duration-150"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/25 group-hover/item:text-white/60 group-hover/item:border-white/[0.1] transition-all duration-200">
                                    {item.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-mono font-medium text-white/50 group-hover/item:text-white/80 transition-colors">
                                        {item.label}
                                      </span>
                                      {item.status && <StatusBadge status={item.status} />}
                                    </div>
                                    <p className="text-[10px] font-mono text-white/18 truncate">
                                      {item.description}
                                    </p>
                                  </div>
                                  <span className="text-white/15 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <Icons.Arrow />
                                  </span>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Divider */}
                <div className="mx-5 my-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                {/* Community links */}
                <div className="px-4">
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/15 mb-2 px-1">
                    Community
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'GitHub', icon: <Icons.GitHub />, href: 'https://github.com', color: 'hover:text-white/60' },
                      { label: 'Discord', icon: <Icons.Discord />, href: 'https://discord.com', color: 'hover:text-indigo-400' },
                    ].map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-white/25 font-mono text-[11px] ${item.color} transition-all duration-200`}
                      >
                        {item.icon}
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed bottom auth */}
              <div className="px-4 py-4 border-t border-white/[0.06] space-y-2.5">
                <Link href="/login" onClick={onClose}>
                  <button className="w-full py-3 rounded-2xl text-xs font-mono font-semibold text-white/40 bg-white/[0.02] border border-white/[0.07] hover:text-white/70 hover:bg-white/[0.05] transition-all duration-200 active:scale-[0.99]">
                    $ pulse --login
                  </button>
                </Link>
                <Link href="/signup" onClick={onClose}>
                  <button className="group relative w-full overflow-hidden py-3 rounded-2xl text-xs font-mono font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 active:scale-[0.99]">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                    <span className="relative flex items-center justify-center gap-2">
                      $ pulse --start-free
                      <Icons.Arrow />
                    </span>
                  </button>
                </Link>

                <p className="text-center text-[9px] font-mono text-white/10 pt-1">
                  press <Kbd>ESC</Kbd> to dismiss
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────────
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const navRef = useRef<HTMLDivElement>(null)

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileOpen])

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`/#${entry.target.id}`)
          }
        })
      },
      { threshold: 0.25, rootMargin: '-80px 0px 0px 0px' }
    )
    document.querySelectorAll('section[id]').forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  // Mouse spotlight
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = navRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  // Nav data
  const navGroups: NavGroup[] = [
    {
      category: 'Explore',
      color: '#6366f1',
      items: [
        {
          href: '/#features',
          label: 'features',
          icon: <Icons.Features />,
          description: '7 core AI capabilities',
          status: 'live',
        },
        {
          href: '/#how-it-works',
          label: 'how_it_works',
          icon: <Icons.HowItWorks />,
          description: 'See Pulse in action',
        },
        {
          href: '/#pricing',
          label: 'pricing',
          icon: <Icons.Pricing />,
          description: 'Plans that scale with you',
        },
      ],
    },
    {
      category: 'Developers',
      color: '#22d3ee',
      items: [
        {
          href: '/docs',
          label: 'documentation',
          icon: <Icons.Docs />,
          description: 'Guides & references',
        },
        {
          href: '/api-docs',
          label: 'api_reference',
          icon: <Icons.API />,
          description: 'REST & streaming API',
          badge: 'v3',
        },
      ],
    },
    {
      category: 'Company',
      color: '#a78bfa',
      items: [
        {
          href: '/blog',
          label: 'blog',
          icon: <Icons.Blog />,
          description: 'AI insights & updates',
        },
        {
          href: '/changelog',
          label: 'changelog',
          icon: <Icons.Changelog />,
          description: "What's new in Pulse",
          badge: 'v3.0.1',
        },
        {
          href: '/#about',
          label: 'about',
          icon: <Icons.About />,
          description: 'Our mission & team',
          status: 'new',
        },
      ],
    },
  ]

  return (
    <>
      <nav
        ref={navRef}
        onMouseMove={handleMouseMove}
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out',
          isScrolled ? 'py-1.5' : 'py-3'
        )}
      >
        {/* Background */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-500',
            isScrolled
              ? 'bg-[#050507]/90 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_0_rgba(255,255,255,0.04),0_8px_40px_rgba(0,0,0,0.3)]'
              : 'bg-transparent'
          )}
        />

        {/* Mouse spotlight */}
        {isScrolled && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(480px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99,102,241,0.05), transparent 50%)`,
            }}
          />
        )}

        {/* Scroll progress */}
        {isScrolled && <ScrollProgress />}

        {/* Left rail decoration */}
        {isScrolled && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent hidden xl:block" />
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* ─── Logo ──────────────────────────────────────── */}
            <Link
              href="/"
              className="group flex items-center gap-3 flex-shrink-0"
              aria-label="Pulse AI — Home"
            >
              {/* Glow halo */}
              <div className="absolute w-24 h-12 -translate-x-2 rounded-2xl bg-gradient-to-r from-indigo-500/8 to-violet-500/8 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 pointer-events-none" />

              <div className="relative flex-shrink-0">
                <PulseRobot size="sm" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <LiveDot size="sm" />
                </div>
              </div>

              <div className="flex flex-col leading-none">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black font-mono tracking-tight text-white">
                    PULSE
                  </span>
                  <span className="text-[8px] font-bold font-mono tracking-[0.2em] text-indigo-400/70 uppercase">
                    AI
                  </span>
                </div>
                <span className="text-[8px] font-mono text-white/15 tracking-[0.12em] hidden sm:block mt-0.5">
                  COGNITIVE_ENTITY_v3
                </span>
              </div>
            </Link>

            {/* ─── Desktop center nav ─────────────────────────── */}
            <div className="hidden md:flex items-center gap-0.5">
              <DesktopNavTrigger label="explore" groups={navGroups} />
              <DesktopNavTrigger
                label="pricing"
                href="/#pricing"
                isActive={activeSection === '/#pricing'}
              />
              <DesktopNavTrigger label="docs" href="/docs" />
              <DesktopNavTrigger label="blog" href="/blog" />
            </div>

            {/* ─── Desktop right actions ───────────────────────── */}
            <div className="hidden md:flex items-center gap-2">
              {/* Command palette */}
              <CommandPalette />

              <div className="w-px h-4 bg-white/[0.06] mx-1" />

              {/* Sign in */}
              <Link href="/login">
                <button className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200">
                  --login
                </button>
              </Link>

              {/* Get started */}
              <Link href="/signup">
                <button className="group relative overflow-hidden flex items-center gap-2 pl-5 pr-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-mono font-bold text-xs shadow-[0_0_20px_rgba(99,102,241,0.28)] hover:shadow-[0_0_32px_rgba(99,102,241,0.45)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]">
                  {/* Shimmer */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
                  <span className="relative">--start-free</span>
                  <span className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-white/[0.15] group-hover:bg-white/[0.22] transition-colors">
                    <Icons.Arrow />
                  </span>
                </button>
              </Link>
            </div>

            {/* ─── Mobile right ───────────────────────────────── */}
            <div className="flex md:hidden items-center gap-2">
              {/* Live badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/[0.07] border border-emerald-500/[0.15]">
                <LiveDot size="sm" />
                <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider">
                  LIVE
                </span>
              </div>

              {/* Menu toggle */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200',
                  isMobileOpen
                    ? 'bg-white/[0.07] border-white/[0.12] text-white/80'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/35 hover:text-white/70 hover:bg-white/[0.05]'
                )}
                aria-label="Open navigation"
                aria-expanded={isMobileOpen}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <MobileDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        groups={navGroups}
      />

      {/* Spacer */}
      <div className="h-[72px]" aria-hidden="true" />
    </>
  )
}