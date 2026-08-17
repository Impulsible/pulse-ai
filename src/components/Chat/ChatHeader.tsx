/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Chat/ChatHeader.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/UI/Toast'
import { cn } from '@/utils/cn'

// ─── Types ───────────────────────────────────────────────────────────────────────
type AssistantState = 'idle' | 'thinking' | 'typing' | 'listening'

interface ChatHeaderProps {
  onToggleSidebar: () => void
  conversationTitle?: string
  assistantState?: AssistantState
  model?: string
  onModelChange?: (model: string) => void
  onSearch?: () => void
  onClear?: () => void
  onExport?: () => void
  onShare?: () => void
  onRename?: (newTitle: string) => void
  onNewChat?: () => void
  isSidebarOpen?: boolean
}

// ─── Available Models ────────────────────────────────────────────────────────────
const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Fastest, most capable', tag: 'Default' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', description: 'Fast & efficient', tag: 'Free' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Best for reasoning', tag: 'Pro' },
  { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', description: 'Long context (1M)', tag: 'Pro' },
] as const

// ─── Icons ───────────────────────────────────────────────────────────────────────
const I = {
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Sidebar: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  NewChat: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      <path d="M15 6l3 3" />
    </svg>
  ),
  Dots: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Share: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  Chevron: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
}

// ─── Editable Title ──────────────────────────────────────────────────────────────
function EditableTitle({
  title,
  onSave,
}: {
  title: string
  onSave?: (newTitle: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setValue(title), [title])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const save = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== title && onSave) {
      onSave(trimmed)
    } else {
      setValue(title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') { setValue(title); setIsEditing(false) }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="text-sm font-medium text-white/90 bg-white/[0.05] border border-indigo-500/30 rounded-md px-2 py-0.5 outline-none max-w-[220px] sm:max-w-[320px] focus:border-indigo-400/60"
      />
    )
  }

  return (
    <button
      onClick={() => onSave && setIsEditing(true)}
      className={cn(
        'group/title flex items-center gap-1.5 px-1.5 py-0.5 -ml-1.5 rounded-md transition-colors',
        onSave && 'hover:bg-white/[0.04] cursor-text'
      )}
    >
      <span className="text-sm font-medium text-white/90 truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[420px]">
        {title}
      </span>
      {onSave && (
        <span className="opacity-0 group-hover/title:opacity-40 transition-opacity text-white/60">
          <I.Edit />
        </span>
      )}
    </button>
  )
}

// ─── Model Selector ──────────────────────────────────────────────────────────────
function ModelSelector({
  currentModel,
  onModelChange,
}: {
  currentModel: string
  onModelChange?: (model: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const id = setTimeout(() => document.addEventListener('mousedown', h), 50)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', h) }
  }, [])

  const activeModel = MODELS.find(m => m.id === currentModel) ?? MODELS[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
          open
            ? 'bg-white/[0.06] text-white/90'
            : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
        )}
      >
        <span>{activeModel.name}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/40"
        >
          <I.Chevron />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: 'top left' }}
            className="absolute top-full left-0 mt-1.5 z-50 min-w-[260px]"
          >
            <div className="rounded-xl bg-[#0c0c14] border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden p-1">
              <div className="px-2.5 pt-2 pb-1">
                <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide">
                  Model
                </span>
              </div>

              {MODELS.map((model) => {
                const isActive = model.id === currentModel
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange?.(model.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 px-2.5 py-2 rounded-lg text-left transition-colors',
                      isActive
                        ? 'bg-white/[0.04]'
                        : 'hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-medium text-white/90">
                          {model.name}
                        </span>
                        <span className={cn(
                          'text-[9px] font-semibold px-1.5 py-0.5 rounded-full border',
                          model.tag === 'Pro'
                            ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                            : model.tag === 'Free'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-white/50 bg-white/[0.04] border-white/[0.08]'
                        )}>
                          {model.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 leading-tight">
                        {model.description}
                      </p>
                    </div>

                    {isActive && (
                      <span className="text-indigo-400 flex-shrink-0 mt-0.5">
                        <I.Check />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Overflow Menu ───────────────────────────────────────────────────────────────
interface MenuItem {
  label: string
  icon: React.ReactNode
  onClick: () => void
  destructive?: boolean
  shortcut?: string
  divider?: boolean
}

function OverflowMenu({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', h), 50)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', h) }
  }, [onClose])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -4 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="absolute right-0 top-full mt-1.5 z-50 min-w-[200px]"
      style={{ transformOrigin: 'top right' }}
    >
      <div className="rounded-xl bg-[#0c0c14] border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden p-1">
        {items.map((item, i) => (
          <div key={item.label}>
            {item.divider && i > 0 && (
              <div className="my-1 mx-1 h-px bg-white/[0.05]" />
            )}
            <button
              onClick={() => { item.onClick(); onClose() }}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors',
                item.destructive
                  ? 'text-red-400/80 hover:bg-red-500/[0.08] hover:text-red-400'
                  : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
              )}
            >
              <span className={cn(
                'flex-shrink-0',
                item.destructive ? 'text-red-400/60' : 'text-white/40'
              )}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <kbd className="text-[10px] text-white/30 font-mono px-1 py-0.5 rounded bg-white/[0.03]">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Icon Button ─────────────────────────────────────────────────────────────────
function IconButton({
  onClick,
  tooltip,
  children,
  active = false,
  className,
  'aria-label': ariaLabel,
}: {
  onClick?: () => void
  tooltip?: string
  children: React.ReactNode
  active?: boolean
  className?: string
  'aria-label': string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={tooltip}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        active
          ? 'text-white/90 bg-white/[0.06]'
          : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]',
        className
      )}
    >
      {children}
    </button>
  )
}

// ─── Streaming Indicator ─────────────────────────────────────────────────────────
function StreamingIndicator({ state }: { state: AssistantState }) {
  if (state === 'idle') return null

  const config = {
    thinking: { label: 'Thinking', color: 'text-indigo-400' },
    typing: { label: 'Typing', color: 'text-indigo-400' },
    listening: { label: 'Listening', color: 'text-violet-400' },
  }[state]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-1.5 ml-2"
    >
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            className={cn('w-1 h-1 rounded-full', config.color.replace('text-', 'bg-'))}
          />
        ))}
      </div>
      <span className={cn('text-[11px] font-medium', config.color)}>
        {config.label}
      </span>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN HEADER
// ═══════════════════════════════════════════════════════════════════════════════════
export function ChatHeader({
  onToggleSidebar,
  conversationTitle = 'New Chat',
  assistantState = 'idle',
  model = 'gpt-4o',
  onModelChange,
  onSearch,
  onClear,
  onExport,
  onShare,
  onRename,
  onNewChat,
  isSidebarOpen = true,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { addToast } = useToast()

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear()
      addToast({ title: 'Conversation cleared', type: 'success' })
    }
  }, [onClear, addToast])

  const handleShare = useCallback(() => {
    if (onShare) onShare()
    else addToast({ title: 'Share link copied', type: 'success' })
  }, [onShare, addToast])

  const handleExport = useCallback(() => {
    if (onExport) onExport()
    else addToast({ title: 'Export coming soon', type: 'info' })
  }, [onExport, addToast])

  const menuItems: MenuItem[] = [
    {
      label: 'Share',
      icon: <I.Share />,
      onClick: handleShare,
      shortcut: '⌘⇧S',
    },
    {
      label: 'Export as Markdown',
      icon: <I.Download />,
      onClick: handleExport,
      shortcut: '⌘E',
    },
    {
      label: 'Clear conversation',
      icon: <I.Trash />,
      onClick: handleClear,
      destructive: true,
      divider: true,
    },
  ]

  return (
    <header className="sticky top-0 z-30 flex h-12 flex-shrink-0 items-center justify-between gap-2 px-3 sm:px-4 bg-[#0a0a0f]/85 backdrop-blur-xl">
      {/* ── Left cluster ────────────────────────────────── */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Sidebar toggle */}
        <IconButton
          onClick={onToggleSidebar}
          tooltip={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-label="Toggle sidebar"
          className="lg:hidden"
        >
          <I.Menu />
        </IconButton>

        <IconButton
          onClick={onToggleSidebar}
          tooltip={`${isSidebarOpen ? 'Close' : 'Open'} sidebar (⌘\\)`}
          aria-label="Toggle sidebar"
          className="hidden lg:flex"
          active={isSidebarOpen}
        >
          <I.Sidebar />
        </IconButton>

        {/* New chat (mobile only — desktop has it in sidebar) */}
        {onNewChat && (
          <IconButton
            onClick={onNewChat}
            tooltip="New chat"
            aria-label="New chat"
            className="lg:hidden"
          >
            <I.NewChat />
          </IconButton>
        )}

        {/* Title */}
        <div className="flex items-center min-w-0 ml-1">
          <EditableTitle
            title={conversationTitle}
            onSave={onRename}
          />
          <AnimatePresence>
            <StreamingIndicator state={assistantState} />
          </AnimatePresence>
        </div>
      </div>

      {/* ── Center: Model selector (desktop) ─────────────── */}
      <div className="hidden sm:block">
        <ModelSelector
          currentModel={model}
          onModelChange={onModelChange}
        />
      </div>

      {/* ── Right cluster ────────────────────────────────── */}
      <div className="flex items-center gap-0.5">
        {onSearch && (
          <IconButton
            onClick={onSearch}
            tooltip="Search (⌘K)"
            aria-label="Search"
          >
            <I.Search />
          </IconButton>
        )}

        <div className="relative">
          <IconButton
            onClick={() => setMenuOpen(v => !v)}
            tooltip="More options"
            aria-label="More options"
            active={menuOpen}
          >
            <I.Dots />
          </IconButton>

          <AnimatePresence>
            {menuOpen && (
              <OverflowMenu
                items={menuItems}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}