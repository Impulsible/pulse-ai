// src/components/Sidebar/SearchChats.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────────────────── */
interface SearchChatsProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  shortcut?: string
}

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
   ───────────────────────────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.5" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
export function SearchChats({
  value,
  onChange,
  placeholder = 'Search conversations…',
  shortcut = '⌘K',
}: SearchChatsProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasValue = value.length > 0

  /* ⌘K / Ctrl+K to focus search */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      /* Escape clears + blurs */
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        if (hasValue) {
          onChange('')
        } else {
          inputRef.current?.blur()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [hasValue, onChange])

  const handleClear = useCallback(() => {
    onChange('')
    inputRef.current?.focus()
  }, [onChange])

  return (
    <div className="relative group">
      {/* ── Ambient focus glow (behind input) ── */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute -inset-1.5 rounded-2xl bg-indigo-500/[0.12] blur-lg pointer-events-none -z-10"
          />
        )}
      </AnimatePresence>

      {/* ── Input container ── */}
      <motion.div
        animate={{
          borderColor: focused
            ? 'rgba(99,102,241,0.4)'
            : hasValue
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(255,255,255,0.06)',
        }}
        transition={{ duration: 0.2 }}
        className="
          relative flex items-center
          h-10 rounded-xl
          bg-gradient-to-b from-white/[0.025] to-white/[0.015]
          border
          shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
          transition-shadow duration-200
        "
        style={{
          boxShadow: focused
            ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 3px rgba(99,102,241,0.08)'
            : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* ── Search icon (animates on focus) ── */}
        <motion.div
          animate={{
            scale: focused ? 1.05 : 1,
            color: focused
              ? 'rgba(165,180,252,0.9)'
              : hasValue
              ? 'rgba(255,255,255,0.55)'
              : 'rgba(255,255,255,0.3)',
          }}
          transition={{ duration: 0.2 }}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <SearchIcon />
        </motion.div>

        {/* ── Input ── */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className="
            w-full h-full
            pl-9 pr-20
            bg-transparent
            text-[12.5px] font-medium text-white/85
            placeholder:text-white/25 placeholder:font-normal
            focus:outline-none
            caret-indigo-400
          "
        />

        {/* ── Right side: clear button OR shortcut ── */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <AnimatePresence mode="wait">
            {hasValue ? (
              /* CLEAR BUTTON */
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                onClick={handleClear}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="
                  w-5 h-5 rounded-md
                  flex items-center justify-center
                  bg-white/[0.06] hover:bg-red-500/20 hover:border-red-500/30
                  border border-white/[0.08]
                  text-white/40 hover:text-red-300
                  transition-colors
                "
                aria-label="Clear search"
                title="Clear (Esc)"
              >
                <ClearIcon />
              </motion.button>
            ) : (
              /* KEYBOARD SHORTCUT */
              <motion.div
                key="shortcut"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: focused ? 0 : 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-0.5 pointer-events-none"
              >
                {shortcut.split('').map((ch, i) => (
                  <kbd
                    key={i}
                    className="
                      text-[9px] font-mono font-bold
                      min-w-[16px] h-[16px]
                      flex items-center justify-center px-1
                      rounded-[5px]
                      bg-white/[0.05] border border-white/[0.08]
                      text-white/35
                      shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)]
                    "
                  >
                    {ch}
                  </kbd>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom gradient underline (appears on focus) ── */}
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="absolute -bottom-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent origin-center pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Live search indicator ── */}
      <AnimatePresence>
        {hasValue && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18 }}
            className="absolute -bottom-[18px] left-2 flex items-center gap-1"
          >
            <span className="relative flex h-1 w-1">
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 animate-ping opacity-75" />
              <span className="relative inline-flex h-1 w-1 rounded-full bg-indigo-400" />
            </span>
            <span className="text-[8.5px] font-mono text-indigo-300/60 uppercase tracking-wider">
              searching
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}