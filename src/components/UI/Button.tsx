// src/components/UI/Button.tsx
'use client'

import { forwardRef, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────────────────── */
type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'gradient'

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: React.ReactNode
  /** Show loading spinner + disable interaction */
  loading?: boolean
  /** Icon rendered before children */
  leftIcon?: React.ReactNode
  /** Icon rendered after children */
  rightIcon?: React.ReactNode
  /** Full width */
  fullWidth?: boolean
  /** Renders an animated shimmer sweep on hover (for hero CTAs) */
  shimmer?: boolean
  /** Renders as icon-only (square, no padding for text) */
  iconOnly?: boolean
  /** Accessible label when iconOnly */
  'aria-label'?: string
}

/* ─────────────────────────────────────────────────────────────────────────────
   VARIANTS — cohesive design system
   ───────────────────────────────────────────────────────────────────────────── */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: clsx(
    'bg-gradient-to-b from-indigo-500 to-indigo-600',
    'hover:from-indigo-400 hover:to-indigo-500',
    'text-white',
    'border border-indigo-400/30',
    'shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_4px_12px_-2px_rgba(99,102,241,0.4)]',
    'hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_6px_18px_-2px_rgba(99,102,241,0.55)]',
    'active:shadow-[0_1px_2px_rgba(0,0,0,0.3)_inset]',
  ),
  secondary: clsx(
    'bg-white/[0.04]',
    'hover:bg-white/[0.08]',
    'text-white/80 hover:text-white',
    'border border-white/[0.08] hover:border-white/[0.15]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
  ),
  outline: clsx(
    'bg-transparent',
    'hover:bg-white/[0.04]',
    'text-white/70 hover:text-white',
    'border border-white/[0.15] hover:border-white/[0.3]',
  ),
  ghost: clsx(
    'bg-transparent',
    'hover:bg-white/[0.05]',
    'text-white/60 hover:text-white/90',
    'border border-transparent',
  ),
  destructive: clsx(
    'bg-gradient-to-b from-red-500/90 to-red-600/90',
    'hover:from-red-500 hover:to-red-600',
    'text-white',
    'border border-red-400/30',
    'shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_4px_12px_-2px_rgba(239,68,68,0.4)]',
    'hover:shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_6px_18px_-2px_rgba(239,68,68,0.55)]',
  ),
  gradient: clsx(
    'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500',
    'hover:from-indigo-400 hover:via-violet-400 hover:to-fuchsia-400',
    'text-white',
    'border border-white/[0.1]',
    'shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_6px_20px_-4px_rgba(139,92,246,0.5)]',
    'hover:shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_28px_-4px_rgba(139,92,246,0.65)]',
    'bg-[length:200%_100%] bg-left hover:bg-right',
  ),
}

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] rounded-lg gap-1.5',
  sm: 'h-8 px-3 text-[12px] rounded-lg gap-2',
  md: 'h-10 px-4 text-[13px] rounded-xl gap-2',
  lg: 'h-11 px-5 text-[14px] rounded-xl gap-2.5',
  xl: 'h-12 px-6 text-[15px] rounded-2xl gap-3',
}

const ICON_ONLY_SIZES: Record<ButtonSize, string> = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-11 h-11 rounded-xl',
  xl: 'w-12 h-12 rounded-2xl',
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOADING SPINNER
   ───────────────────────────────────────────────────────────────────────────── */
function Spinner({ size }: { size: ButtonSize }) {
  const dim = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
  }[size]

  return (
    <motion.svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
      className="flex-shrink-0"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </motion.svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   RIPPLE HOOK
   ───────────────────────────────────────────────────────────────────────────── */
interface Ripple { id: number; x: number; y: number; size: number }

function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const trigger = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now() + Math.random()

    setRipples((prev) => [...prev, { id, x, y, size }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 700)
  }, [])

  return { ripples, trigger }
}

/* ─────────────────────────────────────────────────────────────────────────────
   BUTTON COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      children,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      shimmer = false,
      iconOnly = false,
      disabled,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const { ripples, trigger } = useRipple()
    const isDisabled = disabled || loading

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled) return
        trigger(e)
        onClick?.(e)
      },
      [isDisabled, onClick, trigger]
    )

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={handleClick}
        whileHover={isDisabled ? {} : { y: -1 }}
        whileTap={isDisabled ? {} : { scale: 0.97, y: 0 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className={twMerge(
          clsx(
            /* Base */
            'relative inline-flex items-center justify-center',
            'font-semibold tracking-tight',
            'transition-[background,border-color,box-shadow,color] duration-200',
            'select-none whitespace-nowrap overflow-hidden',
            'focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]',

            /* Sizing */
            iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size],

            /* Variant */
            VARIANTS[variant],

            /* States */
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
            loading && 'cursor-wait',

            /* Full width */
            fullWidth && 'w-full',

            className
          )
        )}
        {...props}
      >
        {/* Gradient wash animation (for gradient variant) */}
        {variant === 'gradient' && !isDisabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
        )}

        {/* Shimmer sweep on hover */}
        {shimmer && !isDisabled && (
          <div className="
            absolute inset-0 -translate-x-full
            hover:translate-x-full
            transition-transform duration-[800ms] ease-out
            bg-gradient-to-r from-transparent via-white/[0.12] to-transparent
            pointer-events-none
          " />
        )}

        {/* Ripples */}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ scale: 0, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="absolute rounded-full bg-white/30 pointer-events-none"
              style={{
                left: r.x - r.size / 2,
                top: r.y - r.size / 2,
                width: r.size,
                height: r.size,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Content layer */}
        <span className={clsx(
          'relative flex items-center justify-center',
          iconOnly ? '' : 'gap-inherit',
          'transition-opacity duration-200',
          loading && 'opacity-0'
        )}
          style={{ gap: 'inherit' }}
        >
          {leftIcon && !loading && (
            <span className="flex-shrink-0 inline-flex items-center">
              {leftIcon}
            </span>
          )}

          {children && !iconOnly && (
            <span className="inline-flex items-center leading-none">
              {children}
            </span>
          )}

          {iconOnly && children && (
            <span className="flex-shrink-0 inline-flex items-center">
              {children}
            </span>
          )}

          {rightIcon && !loading && (
            <span className="flex-shrink-0 inline-flex items-center">
              {rightIcon}
            </span>
          )}
        </span>

        {/* Loading spinner overlay */}
        <AnimatePresence>
          {loading && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Spinner size={size} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

/* ─────────────────────────────────────────────────────────────────────────────
   EXPORT TYPES
   ───────────────────────────────────────────────────────────────────────────── */
export type { ButtonProps, ButtonVariant, ButtonSize }