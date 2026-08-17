// src/components/Sidebar/NewChat.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────────────────── */
interface NewChatProps {
  onClick: () => void
  disabled?: boolean
  shortcut?: string // e.g. "⌘N"
}

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
   ───────────────────────────────────────────────────────────────────────────── */
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14"
      fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round">
      <line x1="7" y1="2" x2="7" y2="12" />
      <line x1="2" y1="7" x2="12" y2="7" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   RIPPLE HOOK
   ───────────────────────────────────────────────────────────────────────────── */
interface Ripple { id: number; x: number; y: number }

function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const trigger = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples((prev) => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 650)
  }, [])
  return { ripples, trigger }
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
export function NewChat({
  onClick,
  disabled = false,
  shortcut = '⌘N',
}: NewChatProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { ripples, trigger } = useRipple()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      trigger(e)
      onClick()
    },
    [disabled, onClick, trigger]
  )

  /* ⌘N / Ctrl+N keyboard shortcut */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !disabled) {
        e.preventDefault()
        onClick()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClick, disabled])

  return (
    <div className="px-3 pt-3 pb-2">
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={()   => setIsPressed(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsPressed(false); setIsHovered(false) }}
        whileHover={disabled ? {} : { y: -1 }}
        whileTap={disabled ? {} : { scale: 0.98, y: 0 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="
          group relative w-full overflow-hidden
          flex items-center justify-between gap-2
          px-3.5 py-3 rounded-2xl
          bg-gradient-to-b from-indigo-500/[0.14] via-indigo-500/[0.08] to-violet-500/[0.10]
          hover:from-indigo-500/[0.22] hover:via-indigo-500/[0.14] hover:to-violet-500/[0.18]
          border border-indigo-500/[0.2] hover:border-indigo-400/[0.4]
          transition-colors duration-250
          disabled:opacity-40 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]
        "
        style={{
          boxShadow: isPressed
            ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 rgba(99,102,241,0)'
            : isHovered
            ? '0 8px 24px -4px rgba(99,102,241,0.25), 0 0 0 1px rgba(99,102,241,0.05), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 4px 12px -4px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        aria-label="Start a new chat"
        title={`Start a new chat (${shortcut})`}
      >
        {/* ── Ambient outer glow when hovered ── */}
        <AnimatePresence>
          {isHovered && !disabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute -inset-2 rounded-3xl bg-indigo-500/15 blur-xl pointer-events-none -z-10"
            />
          )}
        </AnimatePresence>

        {/* ── Animated gradient wash (background) ── */}
        <motion.div
          animate={{
            backgroundPosition: isHovered ? ['0% 50%', '100% 50%'] : '0% 50%',
          }}
          transition={{
            duration: 3,
            repeat: isHovered ? Infinity : 0,
            ease: 'linear',
            repeatType: 'reverse',
          }}
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.08) 25%, rgba(139,92,246,0.08) 50%, rgba(99,102,241,0.08) 75%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />

        {/* ── Shimmer sweep ── */}
        <div className="
          absolute inset-0 -translate-x-full
          group-hover:translate-x-full
          transition-transform duration-[900ms] ease-out
          bg-gradient-to-r from-transparent via-white/[0.08] to-transparent
          pointer-events-none
        " />

        {/* ── Top glint line ── */}
        <div className="
          absolute top-0 left-[15%] right-[15%] h-px
          bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent
          pointer-events-none
        " />

        {/* ── Bottom subtle line ── */}
        <div className="
          absolute bottom-0 left-[20%] right-[20%] h-px
          bg-gradient-to-r from-transparent via-violet-400/20 to-transparent
          pointer-events-none
        " />

        {/* ── Ripples ── */}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ width: 0, height: 0, opacity: 0.4, x: r.x, y: r.y }}
              animate={{ width: 240, height: 240, opacity: 0, x: r.x - 120, y: r.y - 120 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute rounded-full bg-indigo-300/25 pointer-events-none blur-[1px]"
              style={{ translateX: '-50%', translateY: '-50%' }}
            />
          ))}
        </AnimatePresence>

        {/* ── LEFT: icon + label ── */}
        <div className="relative flex items-center gap-2.5 z-10 min-w-0">
          {/* Icon in glowing tile */}
          <div className="relative flex-shrink-0">
            {/* Icon glow when hovered */}
            <AnimatePresence>
              {isHovered && !disabled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 rounded-lg bg-indigo-400/40 blur-md"
                />
              )}
            </AnimatePresence>

            <div className="
              relative w-7 h-7 rounded-lg flex items-center justify-center
              bg-gradient-to-br from-indigo-500/30 to-violet-500/20
              border border-indigo-400/30
              group-hover:from-indigo-500/40 group-hover:to-violet-500/30
              group-hover:border-indigo-400/50
              transition-colors duration-200
              shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
            ">
              <motion.span
                animate={isPressed ? { rotate: 90, scale: 0.9 } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="text-indigo-200 group-hover:text-white transition-colors"
              >
                <PlusIcon />
              </motion.span>
            </div>
          </div>

          {/* Label + subtitle */}
          <div className="flex flex-col items-start min-w-0 leading-none">
            <span className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors duration-200 tracking-tight">
              New chat
            </span>
            <span className="text-[9.5px] font-mono text-white/25 group-hover:text-indigo-300/60 transition-colors duration-200 mt-0.5 tracking-wider">
              Start fresh
            </span>
          </div>
        </div>

        {/* ── RIGHT: shortcut + sparkle ── */}
        <div className="relative z-10 flex items-center gap-1.5 flex-shrink-0">
          {/* Keyboard shortcut */}
          <AnimatePresence>
            {!disabled && (
              <motion.div
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                className="hidden sm:flex items-center gap-0.5"
              >
                {shortcut.split('').map((ch, i) => (
                  <kbd
                    key={i}
                    className="
                      text-[9px] font-mono font-bold min-w-[16px] h-[16px]
                      flex items-center justify-center px-1 rounded-[5px]
                      bg-white/[0.06] border border-white/[0.1]
                      text-white/40 group-hover:text-white/70 group-hover:bg-white/[0.09]
                      shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)]
                      transition-colors duration-200
                    "
                  >
                    {ch}
                  </kbd>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="hidden sm:block w-px h-3 bg-white/[0.08] group-hover:bg-indigo-400/20 transition-colors" />

          {/* Pulsing sparkle */}
          <motion.span
            animate={{
              opacity: [0.5, 1, 0.5],
              scale:   [0.9, 1.1, 0.9],
              rotate:  isHovered ? [0, 15, -15, 0] : 0,
            }}
            transition={{
              opacity: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
              scale:   { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
              rotate:  { duration: 0.6, ease: 'easeInOut' },
            }}
            className="text-indigo-300/70 group-hover:text-indigo-200 transition-colors duration-200"
          >
            <SparkleIcon />
          </motion.span>
        </div>
      </motion.button>
    </div>
  )
}