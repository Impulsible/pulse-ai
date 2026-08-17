// src/components/UI/Tooltip.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
type TooltipVariant = 'default' | 'accent' | 'destructive'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: TooltipPosition
  variant?: TooltipVariant
  delay?: number
  shortcut?: string
  disabled?: boolean
  className?: string
}

/* ─── Variants ───────────────────────────────────────────────────────────────── */
const VARIANTS: Record<TooltipVariant, string> = {
  default: 'bg-[#0a0a12] border-white/[0.1] text-white/85',
  accent:  'bg-indigo-500/95 border-indigo-400/40 text-white',
  destructive: 'bg-red-500/95 border-red-400/40 text-white',
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export function Tooltip({
  children,
  content,
  position = 'top',
  variant = 'default',
  delay = 500,
  shortcut,
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (disabled) return
    timerRef.current = setTimeout(() => setIsVisible(true), delay)
  }, [disabled, delay])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsVisible(false)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const positionClasses: Record<TooltipPosition, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const initialOffset: Record<TooltipPosition, { x?: number; y?: number }> = {
    top:    { y: 4 },
    bottom: { y: -4 },
    left:   { x: 4 },
    right:  { x: -4 },
  }

  const arrowClasses: Record<TooltipPosition, string> = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-4 border-x-4 border-x-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-4 border-x-4 border-x-transparent',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-4 border-y-4 border-y-transparent',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-4 border-y-4 border-y-transparent',
  }

  const arrowBorderColor: Record<TooltipVariant, string> = {
    default:     '#0a0a12',
    accent:      'rgb(99 102 241 / 0.95)',
    destructive: 'rgb(239 68 68 / 0.95)',
  }

  const arrowSide: Record<TooltipPosition, string> = {
    top:    'borderTopColor',
    bottom: 'borderBottomColor',
    left:   'borderLeftColor',
    right:  'borderRightColor',
  }

  return (
    <span
      className={clsx('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9, ...initialOffset[position] }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, ...initialOffset[position] }}
            transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
            role="tooltip"
            className={clsx(
              'absolute z-[9999] pointer-events-none',
              positionClasses[position]
            )}
          >
            <span className={clsx(
              'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
              'border backdrop-blur-md',
              'shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5)]',
              'whitespace-nowrap',
              VARIANTS[variant]
            )}>
              <span className="text-[11px] font-medium tracking-tight">
                {content}
              </span>

              {shortcut && (
                <span className="text-[9px] font-mono font-semibold text-white/50 px-1 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] tracking-wider">
                  {shortcut}
                </span>
              )}
            </span>

            {/* Arrow */}
            <span
              className={clsx('absolute w-0 h-0', arrowClasses[position])}
              style={{ [arrowSide[position]]: arrowBorderColor[variant] }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export type { TooltipProps, TooltipPosition, TooltipVariant }