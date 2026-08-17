/* eslint-disable react-hooks/use-memo */
// src/components/Sidebar/ConversationList.tsx
'use client'

import { useMemo, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConversationItem, type Conversation } from './ConversationItem'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────────────────── */
interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  onPin: (id: string) => void
  onDelete: (id: string) => void
  onRename?: (id: string, title: string) => void
  searchQuery?: string
}

type TimeGroup = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'older'

const GROUP_META: Record<TimeGroup, { label: string; hue: string; dotColor: string }> = {
  today:      { label: 'Today',      hue: 'from-emerald-500/40 to-transparent', dotColor: 'bg-emerald-400' },
  yesterday:  { label: 'Yesterday',  hue: 'from-sky-500/40 to-transparent',     dotColor: 'bg-sky-400'     },
  this_week:  { label: 'This week',  hue: 'from-indigo-500/40 to-transparent',  dotColor: 'bg-indigo-400'  },
  this_month: { label: 'This month', hue: 'from-violet-500/40 to-transparent',  dotColor: 'bg-violet-400'  },
  older:      { label: 'Older',      hue: 'from-white/20 to-transparent',       dotColor: 'bg-white/40'    },
}

const GROUP_ORDER: TimeGroup[] = ['today', 'yesterday', 'this_week', 'this_month', 'older']

function getTimeGroup(date: Date): TimeGroup {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff  = (today.getTime() - d.getTime()) / 86_400_000

  if (diff === 0)  return 'today'
  if (diff === 1)  return 'yesterday'
  if (diff <= 7)   return 'this_week'
  if (diff <= 30)  return 'this_month'
  return 'older'
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION LABEL — modern, with colored dot + gradient divider (no border)
   ───────────────────────────────────────────────────────────────────────────── */
function SectionLabel({
  label,
  count,
  dotColor,
  hue,
}: {
  label: string
  count: number
  dotColor: string
  hue: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2 px-4 pt-5 pb-2"
    >
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        <span className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-40 blur-[2px]`} />
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
      </span>

      <span className="text-[9.5px] font-mono font-semibold uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>

      <div className={`flex-1 h-px bg-gradient-to-r ${hue}`} />

      <span className="
        text-[9px] font-mono tabular-nums
        px-1.5 py-0.5 rounded-md
        bg-white/[0.03]
        text-white/35
      ">
        {count}
      </span>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PINNED LABEL
   ───────────────────────────────────────────────────────────────────────────── */
function PinLabel({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative flex items-center gap-2 px-4 pt-3 pb-2"
    >
      <div className="absolute inset-x-3 top-0 h-full pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(ellipse at 15% 50%, rgba(99,102,241,0.08), transparent 60%)'
        }}
      />

      <div className="relative flex items-center justify-center w-4 h-4 rounded-md bg-indigo-500/15 flex-shrink-0">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-300">
          <path d="M12 17v5" strokeWidth="0" />
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" />
        </svg>
      </div>

      <span className="relative text-[9.5px] font-mono font-semibold uppercase tracking-[0.2em] text-indigo-300/70">
        Pinned
      </span>

      <div className="relative flex-1 h-px bg-gradient-to-r from-indigo-500/25 to-transparent" />

      <span className="relative text-[9px] font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300/70">
        {count}
      </span>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE
   ───────────────────────────────────────────────────────────────────────────── */
function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center py-14 px-6 text-center"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-3xl bg-indigo-500/10 blur-2xl scale-125" />

        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="
            relative w-14 h-14 rounded-2xl
            bg-gradient-to-br from-white/[0.05] to-white/[0.02]
            flex items-center justify-center
          "
        >
          {isFiltered ? (
            <svg width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.6" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="rgba(129,140,248,0.5)"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </motion.div>

        {!isFiltered && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute top-0 w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
          </motion.div>
        )}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-[13px] font-semibold text-white/70 mb-1.5 tracking-tight"
      >
        {isFiltered ? 'No matches' : 'No conversations yet'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-[10.5px] font-mono text-white/25 max-w-[180px] leading-relaxed"
      >
        {isFiltered
          ? 'Try a different keyword or clear your search'
          : 'Tap  ⌘  +  new chat  to begin'}
      </motion.p>

      {!isFiltered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-5 flex items-center gap-1.5"
        >
          <kbd className="
            text-[9px] font-mono px-1.5 py-0.5 rounded-md
            bg-white/[0.04]
            text-white/40
          ">
            ⌘
          </kbd>
          <kbd className="
            text-[9px] font-mono px-1.5 py-0.5 rounded-md
            bg-white/[0.04]
            text-white/40
          ">
            K
          </kbd>
          <span className="text-[9px] font-mono text-white/20 ml-1">
            to start
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER HELPER
   ───────────────────────────────────────────────────────────────────────────── */
function filterConversations(conversations: Conversation[], query: string): Conversation[] {
  if (!query.trim()) return conversations
  const q = query.toLowerCase()
  return conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
export const ConversationList = memo(function ConversationList({
  conversations,
  activeId,
  onSelect,
  onPin,
  onDelete,
  onRename,
  searchQuery = '',
}: ConversationListProps) {
  const filtered = useMemo(
    () => filterConversations(conversations, searchQuery),
    [conversations, searchQuery]
  )

  const pinned   = useMemo(() => filtered.filter((c) =>  c.isPinned), [filtered])
  const unpinned = useMemo(() => filtered.filter((c) => !c.isPinned), [filtered])

  const grouped = useMemo(() => {
    const map = new Map<TimeGroup, Conversation[]>()
    unpinned.forEach((c) => {
      const g = getTimeGroup(c.timestamp)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(c)
    })
    return map
  }, [unpinned])

  const handleSelect = useCallback(onSelect, [onSelect])
  const handlePin    = useCallback(onPin,    [onPin])
  const handleDelete = useCallback(onDelete, [onDelete])

  if (filtered.length === 0) {
    return <EmptyState isFiltered={searchQuery.trim().length > 0} />
  }

  return (
    <div className="flex flex-col min-h-0 pb-4">
      <AnimatePresence initial={false}>

        {pinned.length > 0 && (
          <motion.div
            key="pinned-section"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
          >
            <PinLabel count={pinned.length} />
            <div className="space-y-0.5">
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

            <div className="mx-4 mt-2 h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
          </motion.div>
        )}

        {GROUP_ORDER.map((group) => {
          const items = grouped.get(group)
          if (!items || items.length === 0) return null
          const meta = GROUP_META[group]

          return (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
            >
              <SectionLabel
                label={meta.label}
                count={items.length}
                dotColor={meta.dotColor}
                hue={meta.hue}
              />
              <div className="space-y-0.5">
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