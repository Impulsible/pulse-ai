// src/components/Sidebar/UserMenu.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/UI/Toast'

// ─── Types ───────────────────────────────────────────────────────────────────────
interface UserMenuProps {
  onProfile?: () => void
  onSettings?: () => void
  onHelp?: () => void
}

// ─── Icons ───────────────────────────────────────────────────────────────────────
function ProfileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function KeyboardIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

// ─── Plan badge ───────────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const config = {
    free: { label: 'Free',  cls: 'text-white/30 bg-white/[0.04] border-white/[0.08]' },
    pro:  { label: 'Pro',   cls: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' },
    team: { label: 'Team',  cls: 'text-violet-300 bg-violet-500/10 border-violet-500/20' },
  }
  const planKey = plan as 'free' | 'pro' | 'team' || 'free'
  const { label, cls } = config[planKey] || config.free
  return (
    <span className={`text-[8px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded-full border uppercase ${cls}`}>
      {label}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="relative w-8 h-8 rounded-xl flex-shrink-0 border border-white/[0.08] bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
      <span className="text-xs font-bold text-indigo-300">
        {initials}
      </span>
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#080810] flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      </div>
    </div>
  )
}

// ─── Menu item ────────────────────────────────────────────────────────────────────
interface MenuItem {
  icon: React.ReactNode
  label: string
  onClick: () => void
  shortcut?: string
  destructive?: boolean
  external?: boolean
}

function MenuRow({
  item,
  index,
  onClose,
}: {
  item: MenuItem
  index: number
  onClose: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.18 }}
      whileHover={{ x: 2 }}
      onClick={() => { item.onClick(); onClose() }}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'text-xs font-mono font-medium transition-all duration-150 group',
        item.destructive
          ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.08]'
          : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]',
      ].join(' ')}
    >
      <span className={[
        'transition-colors flex-shrink-0',
        item.destructive
          ? 'text-red-400/40 group-hover:text-red-400'
          : 'text-white/20 group-hover:text-white/60',
      ].join(' ')}>
        {item.icon}
      </span>

      <span className="flex-1 text-left">{item.label}</span>

      {item.shortcut && (
        <span className="text-[9px] text-white/15 bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 rounded-md font-mono">
          {item.shortcut}
        </span>
      )}

      {item.external && (
        <span className="text-white/20 group-hover:text-white/40 transition-colors">
          <ExternalLinkIcon />
        </span>
      )}
    </motion.button>
  )
}

// ─── Dropdown panel ───────────────────────────────────────────────────────────────
function MenuPanel({
  user,
  onClose,
  onProfile,
  onSettings,
  onHelp,
  onLogout,
}: {
  user: { name: string; email: string; plan?: string }
  onClose: () => void
  onProfile?: () => void
  onSettings?: () => void
  onHelp?: () => void
  onLogout?: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Outside click
  useEffect(() => {
    const id = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose()
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, 50)
    return () => clearTimeout(id)
  }, [onClose])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const topItems: MenuItem[] = [
    {
      icon: <ProfileIcon />,
      label: 'Profile',
      onClick: onProfile ?? (() => {}),
      shortcut: '⌘P',
    },
    {
      icon: <SettingsIcon />,
      label: 'Settings',
      onClick: onSettings ?? (() => {}),
      shortcut: '⌘,',
    },
    {
      icon: <KeyboardIcon />,
      label: 'Keyboard Shortcuts',
      onClick: () => {
        // Show shortcuts modal or navigate to shortcuts page
        window.dispatchEvent(new CustomEvent('openShortcuts'))
      },
      shortcut: '⌘/',
    },
  ]

  const bottomItems: MenuItem[] = [
    {
      icon: <HelpIcon />,
      label: 'Help & Support',
      onClick: onHelp ?? (() => {}),
      external: true,
    },
    {
      icon: <LogoutIcon />,
      label: 'Sign out',
      onClick: onLogout ?? (() => {}),
      destructive: true,
    },
  ]

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.93, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.91, y: 6 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      style={{ transformOrigin: 'bottom left' }}
      className="absolute bottom-full left-0 right-0 mb-2 z-50"
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

      <div className="relative rounded-2xl bg-[#0e0e16]/95 border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-2xl overflow-hidden">

        {/* User info header */}
        <div className="px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/70 truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] font-mono text-white/25 truncate mt-0.5">
                {user.email}
              </p>
            </div>
            {user.plan && <PlanBadge plan={user.plan} />}
          </div>

          {/* Usage bar — free only */}
          {user.plan === 'free' && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/20">
                  Monthly usage
                </span>
                <span className="text-[9px] font-mono text-white/20">
                  42 / 100 msgs
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '42%' }}
                  transition={{ delay: 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                />
              </div>
              <button className="text-[9px] font-mono text-indigo-400/60 hover:text-indigo-400 transition-colors">
                Upgrade to Pro →
              </button>
            </div>
          )}
        </div>

        {/* Top items */}
        <div className="p-1.5">
          {topItems.map((item, i) => (
            <MenuRow key={item.label} item={item} index={i} onClose={onClose} />
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-white/[0.05]" />

        {/* Bottom items */}
        <div className="p-1.5">
          {bottomItems.map((item, i) => (
            <MenuRow key={item.label} item={item} index={topItems.length + i} onClose={onClose} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────────
export function UserMenu({
  onProfile,
  onSettings,
  onHelp,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()

  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close  = useCallback(() => setOpen(false),    [])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      addToast({
        title: 'Signed out successfully',
        type: 'success',
      })
      router.push('/login')
    } catch (error) {
      addToast({
        title: 'Sign out failed',
        description: error instanceof Error ? error.message : 'Please try again',
        type: 'error',
      })
    }
  }, [logout, router, addToast])

  const handleProfile = useCallback(() => {
    if (onProfile) {
      onProfile()
    } else {
      router.push('/settings/profile')
    }
  }, [onProfile, router])

  const handleSettings = useCallback(() => {
    if (onSettings) {
      onSettings()
    } else {
      router.push('/settings')
    }
  }, [onSettings, router])

  const handleHelp = useCallback(() => {
    if (onHelp) {
      onHelp()
    } else {
      // Open help center or support page
      window.open('https://docs.pulse-ai.dev', '_blank')
    }
  }, [onHelp])

  const userData = {
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    plan: 'free' as 'free' | 'pro' | 'team',
  }

  if (loading) {
    return (
      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-2 w-28 bg-white/[0.03] rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative px-3 py-3">
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={[
          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl',
          'transition-all duration-200 group',
          open
            ? 'bg-white/[0.06] border border-white/[0.1]'
            : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08]',
        ].join(' ')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        <Avatar name={userData.name} />

        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-white/60 group-hover:text-white/80 truncate leading-tight transition-colors">
            {userData.name}
          </p>
          <p className="text-[10px] font-mono text-white/20 truncate mt-0.5">
            {userData.email}
          </p>
        </div>

        <motion.span
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ duration: 0.22 }}
          className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0"
        >
          <ChevronUpIcon />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <MenuPanel
            user={userData}
            onClose={close}
            onProfile={handleProfile}
            onSettings={handleSettings}
            onHelp={handleHelp}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  )
}