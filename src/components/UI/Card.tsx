// src/components/UI/Card.tsx
'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion, type HTMLMotionProps } from 'framer-motion'

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type CardVariant = 'default' | 'glass' | 'outline' | 'gradient' | 'elevated'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant
  padding?: CardPadding
  hover?: boolean
  interactive?: boolean
  glow?: boolean
  children?: React.ReactNode
}

/* ─── Variants ───────────────────────────────────────────────────────────────── */
const VARIANTS: Record<CardVariant, string> = {
  default: clsx(
    'bg-gradient-to-b from-white/[0.03] to-white/[0.01]',
    'border border-white/[0.06]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
  ),
  glass: clsx(
    'bg-[#0a0a12]/60 backdrop-blur-2xl',
    'border border-white/[0.08]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.4)]',
  ),
  outline: clsx(
    'bg-transparent',
    'border border-white/[0.1]',
  ),
  gradient: clsx(
    'bg-gradient-to-br from-indigo-500/[0.08] via-transparent to-violet-500/[0.05]',
    'border border-indigo-500/[0.15]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  ),
  elevated: clsx(
    'bg-[#0e0e16]',
    'border border-white/[0.06]',
    'shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]',
  ),
}

const PADDINGS: Record<CardPadding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      interactive = false,
      glow = false,
      children,
      ...props
    },
    ref
  ) => {
    const isInteractive = interactive || hover

    return (
      <motion.div
        ref={ref}
        whileHover={isInteractive ? { y: -2 } : {}}
        whileTap={interactive ? { scale: 0.99 } : {}}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className={twMerge(
          clsx(
            'relative rounded-2xl overflow-hidden',
            'transition-[border-color,box-shadow] duration-250',
            VARIANTS[variant],
            PADDINGS[padding],
            isInteractive && [
              'cursor-pointer',
              'hover:border-indigo-500/[0.25]',
              'hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]',
            ],
            className
          )
        )}
        {...props}
      >
        {/* Ambient glow */}
        {glow && (
          <div className="absolute -inset-4 rounded-3xl bg-indigo-500/10 blur-2xl pointer-events-none -z-10" />
        )}

        {/* Top glint */}
        <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />

        <div className="relative">
          {children}
        </div>
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

/* ─── Sub-components ─────────────────────────────────────────────────────────── */
export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge(clsx('mb-4 pb-4 border-b border-white/[0.05]', className))}
      {...props}
    >
      {children}
    </div>
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={twMerge(clsx('text-[15px] font-bold text-white/90 tracking-tight', className))}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={twMerge(clsx('text-[12px] text-white/50 mt-1 leading-relaxed', className))}
      {...props}
    >
      {children}
    </p>
  )
)
CardDescription.displayName = 'CardDescription'

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge(clsx('mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-2', className))}
      {...props}
    >
      {children}
    </div>
  )
)
CardFooter.displayName = 'CardFooter'

export type { CardProps, CardVariant }