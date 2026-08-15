// src/components/Chat/ChatHeader.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PulseRobot } from '@/components/Pulse/PulseRobot'
import { useToast } from '@/components/UI/Toast'

// Types
interface ChatHeaderProps {
  onToggleSidebar: () => void
  conversationTitle?: string
  assistantState?: 'idle' | 'thinking' | 'typing' | 'listening'
  onSearch?: () => void
  onClear?: () => void
  onExport?: () => void
  onSettings?: () => void
}

// Map assistant state to PulseRobot state
const mapToRobotState = (state: ChatHeaderProps['assistantState']): 'idle' | 'thinking' | 'speaking' | 'error' => {
  switch (state) {
    case 'listening':
      return 'speaking'
    case 'typing':
      return 'thinking'
    default:
      return state || 'idle'
  }
}

// Icons
function MenuIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round"
    >
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function SidebarCollapseIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11 19l-7-7 7-7" />
      <path d="M19 19l-7-7 7-7" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="5"  cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// Icon Button
function IconButton({
  onClick,
  tooltip,
  children,
  className = '',
  'aria-label': ariaLabel,
}: {
  onClick?: () => void
  tooltip: string
  children: React.ReactNode
  className?: string
  'aria-label': string
}) {
  const [showTip, setShowTip] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowTip(true), 600)
  }
  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setShowTip(false)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <motion.button
        onClick={onClick}
        aria-label={ariaLabel}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className={`
          relative w-8 h-8 rounded-xl flex items-center justify-center
          text-white/30 hover:text-white/70
          bg-white/[0.02] hover:bg-white/[0.06]
          border border-white/[0.05] hover:border-white/[0.1]
          transition-colors duration-200
          ${className}
        `}
      >
        {children}
      </motion.button>

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none"
          >
            <div className="px-2.5 py-1.5 rounded-lg bg-[#111118] border border-white/[0.08] shadow-xl shadow-black/40">
              <p className="text-[11px] font-medium text-white/60 whitespace-nowrap">{tooltip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Overflow Menu
interface MenuItem {
  label: string
  icon: React.ReactNode
  onClick: () => void
  destructive?: boolean
}

function OverflowMenu({
  items,
  onClose,
}: {
  items: MenuItem[]
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.90, y: -4 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="absolute right-0 top-full mt-2 z-50 min-w-[180px]"
      style={{ transformOrigin: 'top right' }}
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

      <div className="relative rounded-2xl bg-[#0e0e16]/95 border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-2xl overflow-hidden p-1.5">
        {items.map((item, i) => (
          <motion.button
            key={item.label}
            onClick={() => {
              item.onClick()
              onClose()
            }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.18 }}
            whileHover={{ x: 2 }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-xs font-medium font-mono
              transition-all duration-150 group
              ${
                item.destructive
                  ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
              }
            `}
          >
            <span
              className={`transition-colors ${
                item.destructive
                  ? 'text-red-400/50 group-hover:text-red-400'
                  : 'text-white/25 group-hover:text-white/60'
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// Title with edit-in-place hint
function ConversationTitle({ title }: { title: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <motion.h1
        key={title}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="text-sm font-semibold text-white/80 truncate max-w-[160px] sm:max-w-[280px] lg:max-w-[400px] leading-tight"
      >
        {title}
      </motion.h1>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-mono text-white/30">Groq ·</span>
        <span className="text-[10px] font-mono text-emerald-400/60">Online</span>
      </div>
    </div>
  )
}

// Main Header
export function ChatHeader({
  onToggleSidebar,
  conversationTitle = 'New Chat',
  assistantState = 'idle',
  onSearch,
  onClear,
  onExport,
  onSettings,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear()
      addToast({
        title: 'Conversation cleared',
        type: 'success',
      })
    }
  }, [onClear, addToast])

  const menuItems: MenuItem[] = [
    {
      label: 'Clear Conversation',
      icon: <TrashIcon />,
      onClick: handleClear,
      destructive: true,
    },
    {
      label: 'Export Chat',
      icon: <ExportIcon />,
      onClick: () => {
        if (onExport) {
          onExport()
        } else {
          addToast({
            title: 'Export feature coming soon',
            type: 'info',
          })
        }
      },
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      onClick: () => {
        if (onSettings) {
          onSettings()
        } else {
          addToast({
            title: 'Settings coming soon',
            type: 'info',
          })
        }
      },
    },
  ]

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const robotState = mapToRobotState(assistantState)

  return (
    <header className="relative h-14 flex items-center justify-between px-3 sm:px-4 border-b border-white/[0.05] bg-[#080810]/80 backdrop-blur-xl z-30">
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-indigo-500/[0.12] to-transparent pointer-events-none" />

      <div className="flex items-center gap-2.5">
        <motion.button
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-colors duration-200"
        >
          <MenuIcon />
        </motion.button>

        <IconButton
          onClick={onToggleSidebar}
          tooltip="Toggle sidebar"
          aria-label="Toggle sidebar"
          className="hidden lg:flex"
        >
          <SidebarCollapseIcon />
        </IconButton>

        <div className="w-px h-5 bg-white/[0.07] hidden sm:block" />

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0">
            <PulseRobot size="sm" state={robotState} />
          </div>
          <ConversationTitle title={conversationTitle} />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <IconButton
          onClick={onSearch}
          tooltip="Search"
          aria-label="Search conversations"
        >
          <SearchIcon />
        </IconButton>

        <div ref={menuTriggerRef} className="relative">
          <IconButton
            onClick={toggleMenu}
            tooltip="More options"
            aria-label="More options"
            className={menuOpen ? 'text-white/70 bg-white/[0.07] border-white/[0.12]' : ''}
          >
            <DotsIcon />
          </IconButton>

          <AnimatePresence>
            {menuOpen && (
              <OverflowMenu items={menuItems} onClose={closeMenu} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}