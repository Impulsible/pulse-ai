// src/components/Sidebar/NewChat.tsx
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Types
interface NewChatProps {
  onClick: () => void
  disabled?: boolean
  shortcut?: string // e.g. "⌘N"
}

// Icons
function PlusIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round"
    >
      <line x1="7" y1="1" x2="7" y2="13" />
      <line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}

// Ripple effect
interface Ripple {
  id: number
  x: number
  y: number
}

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
    }, 600)
  }, [])

  return { ripples, trigger }
}

// Main Component
export function NewChat({
  onClick,
  disabled = false,
  shortcut = '⌘N',
}: NewChatProps) {
  const [isPressed, setIsPressed] = useState(false)
  const { ripples, trigger } = useRipple()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      trigger(e)
      onClick()
    },
    [disabled, onClick, trigger]
  )

  return (
    <div className="px-3 py-3">
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        whileHover={disabled ? {} : { scale: 1.015 }}
        whileTap={disabled ? {} : { scale: 0.975 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className="
          group relative w-full overflow-hidden
          flex items-center justify-between gap-2
          px-4 py-2.5 rounded-xl
          bg-gradient-to-r from-indigo-500/[0.12] to-violet-500/[0.08]
          hover:from-indigo-500/[0.18] hover:to-violet-500/[0.14]
          border border-indigo-500/[0.18] hover:border-indigo-500/[0.3]
          transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-1
          focus-visible:ring-indigo-500/50
        "
        style={{
          boxShadow: isPressed
            ? 'none'
            : '0 0 20px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        aria-label="Start a new chat"
      >
        {/* Shimmer sweep on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[600ms] ease-out bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

        {/* Top glint */}
        <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent pointer-events-none" />

        {/* Ripples */}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ width: 0, height: 0, opacity: 0.3, x: r.x, y: r.y }}
              animate={{ width: 200, height: 200, opacity: 0, x: r.x - 100, y: r.y - 100 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="absolute rounded-full bg-indigo-400/20 pointer-events-none"
              style={{ translateX: '-50%', translateY: '-50%' }}
            />
          ))}
        </AnimatePresence>

        {/* Left: icon + label */}
        <div className="relative flex items-center gap-2.5 z-10">
          {/* Icon bubble */}
          <div className="
            w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
            bg-indigo-500/20 border border-indigo-500/25
            group-hover:bg-indigo-500/30 group-hover:border-indigo-500/40
            transition-all duration-200
          ">
            <motion.span
              animate={isPressed ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.2 }}
              className="text-indigo-300 group-hover:text-indigo-200 transition-colors"
            >
              <PlusIcon />
            </motion.span>
          </div>

          <span className="text-sm font-semibold text-white/60 group-hover:text-white/80 transition-colors duration-200">
            New chat
          </span>
        </div>

        {/* Right: shortcut key + sparkle */}
        <div className="relative z-10 flex items-center gap-2">
          <AnimatePresence>
            {!disabled && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="
                  text-[9px] font-mono font-bold
                  px-1.5 py-0.5 rounded-md
                  bg-white/[0.04] border border-white/[0.07]
                  text-white/20 group-hover:text-white/35
                  transition-colors duration-200
                  hidden sm:block
                "
              >
                {shortcut}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.span
            animate={{
              opacity: [0.4, 0.9, 0.4],
              scale:   [0.9, 1.05, 0.9],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-indigo-400/50 group-hover:text-indigo-300/70 transition-colors duration-200"
          >
            <SparkleIcon />
          </motion.span>
        </div>
      </motion.button>
    </div>
  )
}