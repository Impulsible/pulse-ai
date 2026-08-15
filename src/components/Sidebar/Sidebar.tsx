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

// Constants
const SIDEBAR_WIDTH = 288 // px — 18rem

// Types
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

// Logo mark
function LogoMark() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.05]">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
        <svg
          width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="rgba(129,140,248,0.9)"
          strokeWidth="1.8" strokeLinecap="round"
        >
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04" />
        </svg>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-white/80 tracking-tight leading-none">
          Pulse
        </p>
        <p className="text-[9px] font-mono text-indigo-400/50 mt-0.5">
          v2.0 · Groq
        </p>
      </div>

      <div className="ml-auto flex-shrink-0">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
      </div>
    </div>
  )
}

// Conversation count badge
function ConversationCount({
  total,
  filtered,
  isFiltered,
}: {
  total: number
  filtered: number
  isFiltered: boolean
}) {
  if (total === 0) return null

  return (
    <div className="flex items-center justify-between px-4 pb-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={isFiltered ? `f-${filtered}` : `t-${total}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="text-[9px] font-mono text-white/15"
        >
          {isFiltered
            ? `${filtered} of ${total} chats`
            : `${total} conversation${total !== 1 ? 's' : ''}`}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// Resize handle
function ResizeHandle({ onResize }: { onResize: (dx: number) => void }) {
  const dragging = useRef(false)
  const startX   = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true
      startX.current   = e.clientX
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return
        onResize(me.clientX - startX.current)
        startX.current = me.clientX
      }
      const onUp = () => {
        dragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
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
        w-px h-12 rounded-full
        bg-white/[0.04] group-hover:bg-indigo-500/30
        transition-colors duration-200
      " />
    </div>
  )
}

// Main Sidebar
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
  const [searchQuery, setSearchQuery] = useState('')
  const [internalConversations, setInternalConversations] = useState<Conversation[]>([])
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH)

  // Use external conversations if provided, otherwise use internal
  const conversations = externalConversations || internalConversations

  // Clamp width between 220–400px
  const clampWidth = useCallback(
    (w: number) => Math.min(400, Math.max(220, w)),
    []
  )

  const handleResize = useCallback(
    (dx: number) => setSidebarWidth((w) => clampWidth(w + dx)),
    [clampWidth]
  )

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onToggle()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onToggle])

  // Conversation handlers
  const handleNewChat = useCallback(() => {
    const id = `conv-${Date.now()}`
    const next: Conversation = {
      id,
      title: 'New Chat',
      lastMessage: 'Start typing to begin…',
      timestamp: new Date(),
      model: 'Groq',
    }
    
    if (onConversationsUpdate) {
      onConversationsUpdate([next, ...conversations])
    } else {
      setInternalConversations((prev) => [next, ...prev])
    }
    
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
    
    if (onConversationsUpdate) {
      onConversationsUpdate(updateFn(conversations))
    } else {
      setInternalConversations(updateFn)
    }
  }, [conversations, onConversationsUpdate])

  const handleDelete = useCallback((id: string) => {
    // Call the parent delete handler if provided
    if (onDeleteConversation) {
      onDeleteConversation(id)
    } else {
      // Otherwise just remove from local state
      const updateFn = (prev: Conversation[]) => prev.filter((c) => c.id !== id)
      if (onConversationsUpdate) {
        onConversationsUpdate(updateFn(conversations))
      } else {
        setInternalConversations(updateFn)
      }
    }
  }, [conversations, onConversationsUpdate, onDeleteConversation])

  const handleRename = useCallback((id: string, title: string) => {
    const updateFn = (prev: Conversation[]) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    
    if (onConversationsUpdate) {
      onConversationsUpdate(updateFn(conversations))
    } else {
      setInternalConversations(updateFn)
    }
  }, [conversations, onConversationsUpdate])

  // Filtered count
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
        animate={{
          width: isOpen ? sidebarWidth : 0,
          opacity: isOpen ? 1 : 0.6,
        }}
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
        {/* Resize handle */}
        <div className="hidden lg:block">
          <ResizeHandle onResize={handleResize} />
        </div>

        {/* Top shimmer line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/[0.1] to-transparent pointer-events-none" />

        {/* Fixed-width inner container */}
        <div
          className="flex flex-col h-full"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          {/* Logo */}
          <LogoMark />

          {/* New chat */}
          <NewChat onClick={handleNewChat} />

          {/* Search */}
          <div className="px-3 pb-2">
            <SearchChats
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          {/* Count */}
          <ConversationCount
            total={conversations.length}
            filtered={filteredCount}
            isFiltered={isFiltered}
          />

          {/* Conversation list */}
          <div className="
            flex-1 min-h-0 overflow-y-auto
            [scrollbar-width:thin]
            [scrollbar-color:rgba(255,255,255,0.04)_transparent]
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
          <div className="flex-shrink-0 border-t border-white/[0.05]">
            <UserMenu />
          </div>
        </div>
      </motion.aside>
    </>
  )
}

// Export types
export type { SidebarProps }