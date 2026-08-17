/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Sidebar/Sidebar.tsx
'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { NewChat } from './NewChat'
import { SearchChats } from './SearchChats'
import { ConversationList } from './ConversationList'
import { UserMenu } from './UserMenu'
import { type Conversation } from './ConversationItem'

const SIDEBAR_WIDTH = 288

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeConversationId?: string
  onConversationSelect?: (id: string) => void
  onNewChat?: () => void
  onDeleteConversation?: (id: string) => void
  className?: string
  conversations?: Conversation[]
  onConversationsUpdate?: (conversations: Conversation[]) => void
}

/* ─────────────────────────────────────────────────────────────────────────────
   PULSE ROBOT AVATAR
   Matches the exact style from the chat: circular dark-navy face,
   two glowing indigo eyes, subtle rim light, ambient pulse.
   ───────────────────────────────────────────────────────────────────────────── */
function PulseRobotAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Ambient glow ring */}
      <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />

      {/* Outer conic gradient ring */}
      <div
        className="absolute inset-0 rounded-full opacity-70"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(99,102,241,0.6), rgba(139,92,246,0.3), rgba(99,102,241,0.6))',
          padding: 1.5,
        }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a14]" />
      </div>

      {/* Robot face */}
      <div
        className="
          absolute inset-[2px] rounded-full
          bg-gradient-to-br from-[#1a1a2e] via-[#0f0f1e] to-[#050510]
          border border-indigo-400/20
          flex items-center justify-center
          shadow-[inset_0_0_12px_rgba(99,102,241,0.15)]
          overflow-hidden
        "
      >
        {/* Inner highlight (top gloss) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1/2 h-1/3 rounded-full bg-white/[0.04] blur-sm" />

        {/* Eyes */}
        <div className="relative flex items-center gap-[15%]" style={{ width: '60%' }}>
          {/* Left eye */}
          <div className="relative flex-1 aspect-square">
            <div className="absolute inset-0 rounded-full bg-indigo-400/30 blur-[3px]" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-[0_0_6px_rgba(129,140,248,0.9)]">
              <div className="absolute top-[15%] left-[15%] w-1/3 h-1/3 rounded-full bg-white/60" />
            </div>
          </div>
          {/* Right eye */}
          <div className="relative flex-1 aspect-square">
            <div className="absolute inset-0 rounded-full bg-indigo-400/30 blur-[3px]" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-[0_0_6px_rgba(129,140,248,0.9)]">
              <div className="absolute top-[15%] left-[15%] w-1/3 h-1/3 rounded-full bg-white/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Online status dot */}
      <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#080810]" />
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   HEADER — Pulse robot sits on TOP of the wordmark
   ───────────────────────────────────────────────────────────────────────────── */
function SidebarHeader() {
  return (
    <div className="relative px-4 pt-5 pb-4 border-b border-white/[0.05]">
      {/* Subtle radial glow behind header */}
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-2.5">
        {/* Robot ON TOP */}
        <PulseRobotAvatar size={44} />

        {/* Wordmark BELOW */}
        <div className="flex flex-col items-center leading-none">
          <p className="text-[15px] font-bold text-white/90 tracking-tight">
            Pulse
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] font-mono text-indigo-400/50 uppercase tracking-wider">
              v2.0
            </span>
            <span className="text-white/20 text-[9px]">•</span>
            <span className="text-[9px] font-mono text-emerald-400/60 uppercase tracking-wider">
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONVERSATION COUNT
   ───────────────────────────────────────────────────────────────────────────── */
function ConversationCount({
  total,
  filtered,
  isFiltered,
}: {
  total: number
  filtered: number
  isFiltered: boolean
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (total === 0) return null

  const countText = isFiltered
    ? `${filtered} of ${total} chats`
    : `${total} conversation${total !== 1 ? 's' : ''}`

  return (
    <div className="flex items-center justify-between px-4 pb-1.5 pt-1">
      <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
        {mounted ? countText : ''}
      </span>
      {mounted && isFiltered && (
        <span className="text-[9px] font-mono text-indigo-400/60">
          filtered
        </span>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   RESIZE HANDLE
   ───────────────────────────────────────────────────────────────────────────── */
function ResizeHandle({ onResize }: { onResize: (dx: number) => void }) {
  const dragging = useRef(false)
  const startX   = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true
      startX.current   = e.clientX
      document.body.style.cursor     = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return
        onResize(me.clientX - startX.current)
        startX.current = me.clientX
      }
      const onUp = () => {
        dragging.current = false
        document.body.style.cursor     = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup',  onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup',  onUp)
    },
    [onResize]
  )

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group z-10"
      aria-hidden="true"
    >
      <div className="
        absolute right-0 top-1/2 -translate-y-1/2
        w-px h-16 rounded-full
        bg-white/[0.04] group-hover:bg-indigo-500/40 group-hover:h-24 group-hover:w-[2px]
        transition-all duration-300
      " />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SIDEBAR
   ───────────────────────────────────────────────────────────────────────────── */
export function Sidebar({
  isOpen,
  onToggle,
  activeConversationId,
  onConversationSelect,
  onNewChat,
  onDeleteConversation,
  className,
  conversations: externalConversations,
  onConversationsUpdate,
}: SidebarProps) {
  const [searchQuery,           setSearchQuery]           = useState('')
  const [internalConversations, setInternalConversations] = useState<Conversation[]>([])
  const [sidebarWidth,          setSidebarWidth]          = useState(SIDEBAR_WIDTH)
  const [mounted,               setMounted]               = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const conversations = externalConversations ?? internalConversations

  const clampWidth = useCallback((w: number) => Math.min(400, Math.max(220, w)), [])
  const handleResize = useCallback(
    (dx: number) => setSidebarWidth((w) => clampWidth(w + dx)),
    [clampWidth]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onToggle()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onToggle])

  const handleNewChat = useCallback(() => {
    const id = `conv-${Date.now()}`
    const next: Conversation = {
      id,
      title:       'New Chat',
      lastMessage: 'Start typing to begin…',
      timestamp:   new Date(),
      model:       'Pulse AI',
    }
    if (onConversationsUpdate) onConversationsUpdate([next, ...conversations])
    else setInternalConversations((prev) => [next, ...prev])
    onConversationSelect?.(id)
    onNewChat?.()
  }, [conversations, onConversationSelect, onNewChat, onConversationsUpdate])

  const handleSelect = useCallback(
    (id: string) => {
      onConversationSelect?.(id)
      if (window.innerWidth < 1024) onToggle()
    },
    [onConversationSelect, onToggle]
  )

  const handlePin = useCallback((id: string) => {
    const updateFn = (prev: Conversation[]) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    if (onConversationsUpdate) onConversationsUpdate(updateFn(conversations))
    else setInternalConversations(updateFn)
  }, [conversations, onConversationsUpdate])

  const handleDelete = useCallback((id: string) => {
    if (onDeleteConversation) {
      onDeleteConversation(id)
    } else {
      const updateFn = (prev: Conversation[]) => prev.filter((c) => c.id !== id)
      if (onConversationsUpdate) onConversationsUpdate(updateFn(conversations))
      else setInternalConversations(updateFn)
    }
  }, [conversations, onConversationsUpdate, onDeleteConversation])

  const handleRename = useCallback((id: string, title: string) => {
    const updateFn = (prev: Conversation[]) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    if (onConversationsUpdate) onConversationsUpdate(updateFn(conversations))
    else setInternalConversations(updateFn)
  }, [conversations, onConversationsUpdate])

  const filteredCount = useMemo(() => {
    if (!searchQuery.trim()) return conversations.length
    const q = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    ).length
  }, [conversations, searchQuery])

  const isFiltered = searchQuery.trim().length > 0

  if (!mounted) return null

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? sidebarWidth : 0, opacity: isOpen ? 1 : 0.6 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'relative z-50 flex-shrink-0 flex flex-col',
          'bg-[#080810]/95 backdrop-blur-xl',
          'border-r border-white/[0.05]',
          'overflow-hidden',
          'fixed lg:relative',
          'top-0 left-0 bottom-0 lg:top-auto lg:left-auto lg:bottom-auto',
          className
        )}
        style={{ height: '100dvh' }}
        aria-label="Conversation sidebar"
        role="navigation"
      >
        {/* Desktop resize handle */}
        <div className="hidden lg:block">
          <ResizeHandle onResize={handleResize} />
        </div>

        {/* Top shimmer accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent pointer-events-none" />

        {/* Vertical accent line on right edge */}
        <div className="absolute top-16 right-0 bottom-16 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none" />

        {/* Inner container (locked width, avoids reflow during resize) */}
        <div
          className="flex flex-col h-full"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          {/* HEADER — robot on top of "Pulse" */}
          <SidebarHeader />

          {/* New chat button */}
          <div className="px-3 pt-3">
            <NewChat onClick={handleNewChat} />
          </div>

          {/* Search */}
          <div className="px-3 pt-2 pb-1">
            <SearchChats value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Count badge */}
          <ConversationCount
            total={conversations.length}
            filtered={filteredCount}
            isFiltered={isFiltered}
          />

          {/* Conversation list */}
          <div className="
            flex-1 min-h-0 overflow-y-auto
            [scrollbar-width:thin]
            [scrollbar-color:rgba(255,255,255,0.06)_transparent]
          ">
            <ConversationList
              conversations={conversations}
              activeId={activeConversationId}
              searchQuery={searchQuery}
              onSelect={handleSelect}
              onPin={handlePin}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          </div>

          {/* User menu */}
          <div className="flex-shrink-0 border-t border-white/[0.05] bg-gradient-to-b from-transparent to-black/20">
            <UserMenu />
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export type { SidebarProps }
export default Sidebar