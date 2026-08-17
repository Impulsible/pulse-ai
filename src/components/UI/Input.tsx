// src/components/UI/Input.tsx
'use client'

import { forwardRef, useState, useCallback, useId } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type InputSize = 'sm' | 'md' | 'lg'

// Omit the conflicting drag event props that Framer Motion uses
type MotionInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onDrag' | 'onDragStart' | 'onDragEnd'>

interface InputProps extends MotionInputProps {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: InputSize
  showClearButton?: boolean
  onClear?: () => void
}

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
function ClearIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function ErrorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

/* ─── Sizes ──────────────────────────────────────────────────────────────────── */
const SIZES: Record<InputSize, { input: string; icon: string; padding: string }> = {
  sm: { input: 'h-8 text-[12px] rounded-lg',  icon: 'w-3.5 h-3.5', padding: 'px-3' },
  md: { input: 'h-10 text-[13px] rounded-xl', icon: 'w-4 h-4',     padding: 'px-3.5' },
  lg: { input: 'h-12 text-[14px] rounded-xl', icon: 'w-4 h-4',     padding: 'px-4' },
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      showClearButton = false,
      onClear,
      id,
      onFocus,
      onBlur,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const autoId = useId()
    const inputId = id || `input-${autoId}`

    const [isFocused, setIsFocused] = useState(false)
    const [internalValue, setInternalValue] = useState('')

    const currentValue = value !== undefined ? String(value) : internalValue
    const hasValue = currentValue.length > 0
    const hasError = !!error

    const sizeCfg = SIZES[inputSize]

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }, [onFocus])

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }, [onBlur])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) setInternalValue(e.target.value)
      onChange?.(e)
    }, [onChange, value])

    const handleClear = useCallback(() => {
      if (value === undefined) setInternalValue('')
      onClear?.()
    }, [onClear, value])

    // Calculate left/right padding based on icons
    const paddingLeft = leftIcon ? 'pl-9' : sizeCfg.padding.replace('px-', 'pl-')
    const paddingRight = (rightIcon || (showClearButton && hasValue))
      ? 'pr-9'
      : sizeCfg.padding.replace('px-', 'pr-')

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11.5px] font-semibold text-white/70 mb-1.5 tracking-tight"
          >
            {label}
          </label>
        )}

        {/* Input wrapper with focus glow */}
        <div className="relative group">
          {/* Ambient glow (focus) */}
          <AnimatePresence>
            {isFocused && !hasError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute -inset-1 rounded-2xl bg-indigo-500/[0.1] blur-md pointer-events-none -z-10"
              />
            )}
          </AnimatePresence>

          {/* Left icon */}
          {leftIcon && (
            <span className={clsx(
              'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
              'transition-colors duration-200',
              hasError ? 'text-red-400' : isFocused ? 'text-indigo-400' : 'text-white/30',
              sizeCfg.icon
            )}>
              {leftIcon}
            </span>
          )}

          {/* Input - using regular input with motion wrapper for animation */}
          <div className="relative">
            <motion.div
              animate={{
                borderColor: hasError
                  ? 'rgba(239,68,68,0.5)'
                  : isFocused
                  ? 'rgba(99,102,241,0.5)'
                  : 'rgba(255,255,255,0.08)',
              }}
              transition={{ duration: 0.2 }}
              className={twMerge(
                clsx(
                  'w-full',
                  sizeCfg.input,
                  paddingLeft,
                  paddingRight,
                  'bg-gradient-to-b from-white/[0.02] to-white/[0.01]',
                  'border',
                  'text-white/90 placeholder:text-white/25 placeholder:font-normal font-medium',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]',
                  'focus-within:outline-none',
                  'transition-shadow duration-200',
                  'flex items-center',
                  isFocused && !hasError && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_3px_rgba(99,102,241,0.08)]',
                  hasError && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_0_0_3px_rgba(239,68,68,0.1)]',
                  className
                )
              )}
            >
              <input
                ref={ref}
                id={inputId}
                value={value !== undefined ? value : internalValue}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleChange}
                className="w-full h-full bg-transparent outline-none text-white/90 placeholder:text-white/25 placeholder:font-normal font-medium"
                {...props}
              />
            </motion.div>
          </div>

          {/* Right side: clear button / right icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <AnimatePresence mode="wait">
              {showClearButton && hasValue && !hasError ? (
                <motion.button
                  key="clear"
                  type="button"
                  initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 30 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleClear}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-5 h-5 rounded-md flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/40 hover:text-white/70 transition-colors"
                  aria-label="Clear input"
                >
                  <ClearIcon />
                </motion.button>
              ) : rightIcon ? (
                <motion.span
                  key="right-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={clsx(
                    'pointer-events-none',
                    hasError ? 'text-red-400' : isFocused ? 'text-indigo-400' : 'text-white/30',
                    sizeCfg.icon
                  )}
                >
                  {rightIcon}
                </motion.span>
              ) : hasError ? (
                <motion.span
                  key="error-icon"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="text-red-400 pointer-events-none"
                >
                  <ErrorIcon />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Focus underline */}
          <AnimatePresence>
            {isFocused && !hasError && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="absolute -bottom-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent origin-center pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error / Hint */}
        <AnimatePresence mode="wait">
          {hasError ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-1.5 text-[11px] font-medium text-red-400 flex items-center gap-1"
            >
              <ErrorIcon />
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 text-[10.5px] font-mono text-white/30"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'
export type { InputProps }