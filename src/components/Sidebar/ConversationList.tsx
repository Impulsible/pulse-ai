/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/use-memo */
// src/components/Sidebar/ConversationList.tsx
'use client'

import { useMemo, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConversationItem, type Conversation } from './ConversationItem'

// Types
interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  onPin: (id: string) => void
  onDelete: (id: string) => void
  onRename?: (id: string, title: string) => void
  searchQuery?: string
}

// Time grouping
type TimeGroup = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'older'

const GROUP_LABELS: Record<TimeGroup, string> = {
  today:      'Today',
  yesterday:  'Yesterday',
  this_week:  'This week',
  this_month: 'This month',
  older:      'Older',
}

const GROUP_ORDER: TimeGroup[] = [
  'today',
  'yesterday',
  'this_week',
  'this_month',
  'older',
]

function getTimeGroup(date: Date): TimeGroup {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff  = (today.getTime() - d.getTime()) / 86_400_000

  if (diff === 0)        return 'today'
  if (diff === 1)        return 'yesterday'
  if (diff <= 7)         return 'this_week'
  if (diff <= 30)        return 'this_month'
  return 'older'
}

// Section label
function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-4 pb-1.5">
      <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white/20">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.05]" />
      <span className="text-[9px] font-mono text-white/15 tabular-nums">
        {count}
      </span>
    </div>
  )
}

// Pin section label
function PinLabel({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
      <span className="text-indigo-400/50">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
        </svg>
      </span>
      <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-indigo-400/50">
        Pinned
      </span>
      <div className="flex-1 h-px bg-indigo-500/[0.12]" />
      <span className="text-[9px] font-mono text-white/15 tabular-nums">{count}</span>
    </div>
  )
}

// Empty state
function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
        {isFiltered ? (
          <svg width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-white/30">
          {isFiltered ? 'No results found' : 'No conversations yet'}
        </p>
        <p className="text-[10px] font-mono text-white/15 max-w-[160px] leading-relaxed">
          {isFiltered
            ? 'Try a different search term'
            : 'Start a new chat to begin your journey with Pulse'}
        </p>
      </div>
    </motion.div>
  )
}

// Search highlight
function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-indigo-500/20 text-indigo-300 rounded-sm px-px"
        style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}
      >
        {part}
      </mark>
    ) : part
  )
}

// Filter conversations by search query
function filterConversations(
  conversations: Conversation[],
  query: string
): Conversation[] {
  if (!query.trim()) return conversations
  const q = query.toLowerCase()
  return conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
  )
}

// Main component
export const ConversationList = memo(function ConversationList({
  conversations,
  activeId,
  onSelect,
  onPin,
  onDelete,
  onRename,
  searchQuery = '',
}: ConversationListProps) {
  // Filter
  const filtered = useMemo(
    () => filterConversations(conversations, searchQuery),
    [conversations, searchQuery]
  )

  // Split pinned / unpinned
  const pinned   = useMemo(() => filtered.filter((c) => c.isPinned),  [filtered])
  const unpinned = useMemo(() => filtered.filter((c) => !c.isPinned), [filtered])

  // Group unpinned by time
  const grouped = useMemo(() => {
    const map = new Map<TimeGroup, Conversation[]>()
    unpinned.forEach((c) => {
      const g = getTimeGroup(c.timestamp)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(c)
    })
    return map
  }, [unpinned])

  // Stable callbacks
  const handleSelect = useCallback(onSelect, [onSelect])
  const handlePin    = useCallback(onPin,    [onPin])
  const handleDelete = useCallback(onDelete, [onDelete])

  // Empty
  if (filtered.length === 0) {
    return <EmptyState isFiltered={searchQuery.trim().length > 0} />
  }

  return (
    <div className="flex flex-col min-h-0">
      <AnimatePresence initial={false}>

        {/* Pinned section */}
        {pinned.length > 0 && (
          <motion.div
            key="pinned-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PinLabel count={pinned.length} />
            <div className="px-2 space-y-0.5">
              <AnimatePresence initial={false}>
                {pinned.map((conv, i) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeId}
                    index={i}
                    onSelect={handleSelect}
                    onPin={handlePin}
                    onDelete={handleDelete}
                    onRename={onRename}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Time-grouped sections */}
        {GROUP_ORDER.map((group) => {
          const items = grouped.get(group)
          if (!items || items.length === 0) return null

          return (
            <motion.div
              key={group}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SectionLabel
                label={GROUP_LABELS[group]}
                count={items.length}
              />
              <div className="px-2 space-y-0.5">
                <AnimatePresence initial={false}>
                  {items.map((conv, i) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeId}
                      index={i}
                      onSelect={handleSelect}
                      onPin={handlePin}
                      onDelete={handleDelete}
                      onRename={onRename}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}

      </AnimatePresence>
    </div>
  )
})