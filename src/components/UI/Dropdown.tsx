// src/components/UI/Dropdown.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

/* ─── Types ──────────────────────────────────────────────────────────────────── */
export type DropdownItem =
  | {
      label: string
      onClick?: () => void
      icon?: React.ReactNode
      shortcut?: string
      disabled?: boolean
      destructive?: boolean
      badge?: string
    }
  | { divider: true }
  | { heading: string }

type DropdownPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  position?: DropdownPosition
  className?: string
  minWidth?: number
  closeOnClick?: boolean
}

/* ─── Type guards ────────────────────────────────────────────────────────────── */
function isDivider(item: DropdownItem): item is { divider: true } {
  return 'divider' in item && item.divider === true
}
function isHeading(item: DropdownItem): item is { heading: string } {
  return 'heading' in item
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export function Dropdown({
  trigger,
  items,
  position = 'bottom-left',
  className = '',
  minWidth = 220,
  closeOnClick = true,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setFocusedIndex(-1)
  }, [])

  // Outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [close])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const clickableIndexes = items
      .map((item, i) => (!isDivider(item) && !isHeading(item) && !item.disabled ? i : -1))
      .filter((i) => i !== -1)

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close() }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const currentIdx = clickableIndexes.indexOf(focusedIndex)
        const next = clickableIndexes[(currentIdx + 1) % clickableIndexes.length]
        setFocusedIndex(next ?? clickableIndexes[0])
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const currentIdx = clickableIndexes.indexOf(focusedIndex)
        const prev = currentIdx <= 0
          ? clickableIndexes[clickableIndexes.length - 1]
          : clickableIndexes[currentIdx - 1]
        setFocusedIndex(prev)
      }

      if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        const item = items[focusedIndex]
        if (!isDivider(item) && !isHeading(item) && !item.disabled) {
          item.onClick?.()
          if (closeOnClick) close()
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, focusedIndex, items, close, closeOnClick])

  const positionClasses: Record<DropdownPosition, string> = {
    'bottom-left':  'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left':     'bottom-full left-0 mb-2',
    'top-right':    'bottom-full right-0 mb-2',
  }

  const transformOrigin: Record<DropdownPosition, string> = {
    'bottom-left':  'top left',
    'bottom-right': 'top right',
    'top-left':     'bottom left',
    'top-right':    'bottom right',
  }

  return (
    <div className={clsx('relative inline-block', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen((v) => !v)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: position.startsWith('top') ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: position.startsWith('top') ? 4 : -4 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: transformOrigin[position], minWidth }}
            className={clsx(
              'absolute z-50',
              positionClasses[position],
              'rounded-xl bg-[#0a0a12]/95 backdrop-blur-2xl',
              'border border-white/[0.08]',
              'shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]',
              'p-1 overflow-hidden'
            )}
            role="menu"
          >
            {/* Top glint */}
            <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent pointer-events-none" />

            {items.map((item, index) => {
              if (isDivider(item)) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="mx-2 my-1 h-px bg-white/[0.05]"
                    role="separator"
                  />
                )
              }

              if (isHeading(item)) {
                return (
                  <div
                    key={`heading-${index}`}
                    className="px-3 pt-2.5 pb-1 text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-white/30"
                  >
                    {item.heading}
                  </div>
                )
              }

              const isFocused = focusedIndex === index

              return (
                <motion.button
                  key={`${item.label}-${index}`}
                  onClick={() => {
                    if (item.disabled) return
                    item.onClick?.()
                    if (closeOnClick) close()
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  disabled={item.disabled}
                  role="menuitem"
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg',
                    'text-[12.5px] font-medium transition-colors duration-100',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    item.destructive
                      ? [
                          'text-red-400/70',
                          isFocused && 'text-red-300 bg-red-500/[0.08]',
                          !isFocused && 'hover:text-red-300 hover:bg-red-500/[0.08]',
                        ]
                      : [
                          'text-white/60',
                          isFocused && 'text-white/90 bg-white/[0.06]',
                          !isFocused && 'hover:text-white/90 hover:bg-white/[0.06]',
                        ]
                  )}
                >
                  {item.icon && (
                    <span className={clsx(
                      'flex-shrink-0 flex items-center',
                      item.destructive
                        ? 'text-red-400/60'
                        : 'text-white/40',
                    )}>
                      {item.icon}
                    </span>
                  )}

                  <span className="flex-1 text-left truncate">{item.label}</span>

                  {item.badge && (
                    <span className="text-[9px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-indigo-300">
                      {item.badge}
                    </span>
                  )}

                  {item.shortcut && (
                    <span className="text-[9.5px] font-mono text-white/30 tracking-wider">
                      {item.shortcut}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}