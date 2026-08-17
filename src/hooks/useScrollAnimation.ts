/* eslint-disable react-hooks/set-state-in-effect */
// src/hooks/useScrollAnimation.ts
'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useInView, type UseInViewOptions } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type AnimationVariant =
  | 'fade-in'
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-up'
  | 'slide-down'
  | 'blur-in'

export interface ScrollAnimationOptions {
  /** Only trigger once (default: true) */
  once?: boolean
  /** Distance from viewport edge before triggering */
  margin?: UseInViewOptions['margin']
  /** How much of the element must be visible (0-1) */
  amount?: UseInViewOptions['amount']
  /** Animation variant preset */
  variant?: AnimationVariant
  /** Delay in ms before animation starts */
  delay?: number
  /** Custom CSS class to add when in view */
  className?: string
  /** Custom CSS class to add when out of view */
  offClassName?: string
  /** Callback fired when element enters viewport */
  onEnter?: () => void
  /** Callback fired when element leaves viewport */
  onLeave?: () => void
  /** Respect user's reduced-motion preference */
  respectReducedMotion?: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION PRESETS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const ANIMATION_STYLES: Record<AnimationVariant, {
  initial: React.CSSProperties
  animate: React.CSSProperties
}> = {
  'fade-in': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  'fade-up': {
    initial: { opacity: 0, transform: 'translateY(24px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-down': {
    initial: { opacity: 0, transform: 'translateY(-24px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-left': {
    initial: { opacity: 0, transform: 'translateX(24px)' },
    animate: { opacity: 1, transform: 'translateX(0)' },
  },
  'fade-right': {
    initial: { opacity: 0, transform: 'translateX(-24px)' },
    animate: { opacity: 1, transform: 'translateX(0)' },
  },
  'zoom-in': {
    initial: { opacity: 0, transform: 'scale(0.9)' },
    animate: { opacity: 1, transform: 'scale(1)' },
  },
  'zoom-out': {
    initial: { opacity: 0, transform: 'scale(1.1)' },
    animate: { opacity: 1, transform: 'scale(1)' },
  },
  'slide-up': {
    initial: { transform: 'translateY(100%)' },
    animate: { transform: 'translateY(0)' },
  },
  'slide-down': {
    initial: { transform: 'translateY(-100%)' },
    animate: { transform: 'translateY(0)' },
  },
  'blur-in': {
    initial: { opacity: 0, filter: 'blur(12px)' },
    animate: { opacity: 1, filter: 'blur(0)' },
  },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useScrollAnimation — element-level scroll trigger
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Enhanced scroll animation hook with variants, delays, and reduced-motion support.
 *
 * @example
 * // Basic usage with CSS class
 * const ref = useScrollAnimation()
 * <div ref={ref}>...</div>
 *
 * @example
 * // With variant preset (auto-styles)
 * const { ref, style, isInView } = useScrollAnimation({
 *   variant: 'fade-up',
 *   delay: 200,
 * })
 * <div ref={ref} style={style}>...</div>
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
) {
  const {
    once = true,
    margin = '-100px' as UseInViewOptions['margin'],
    amount = 'some',
    variant,
    delay = 0,
    className = 'animate-in',
    offClassName,
    onEnter,
    onLeave,
    respectReducedMotion = true,
  } = options

  const ref = useRef<T>(null)
  const isInView = useInView(ref, { once, margin, amount })
  const [hasAnimated, setHasAnimated] = useState(false)

  // Check reduced-motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    if (!respectReducedMotion || typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [respectReducedMotion])

  // Trigger animation
  useEffect(() => {
    if (!ref.current) return

    if (isInView) {
      const timer = setTimeout(() => {
        if (!ref.current) return
        if (className) ref.current.classList.add(className)
        if (offClassName) ref.current.classList.remove(offClassName)
        setHasAnimated(true)
        onEnter?.()
      }, delay)
      return () => clearTimeout(timer)
    } else if (!once) {
      if (className) ref.current.classList.remove(className)
      if (offClassName) ref.current.classList.add(offClassName)
      onLeave?.()
    }
  }, [isInView, once, className, offClassName, delay, onEnter, onLeave])

  // Compute inline style if variant is provided
  const style = useMemo<React.CSSProperties | undefined>(() => {
    if (!variant) return undefined

    // If reduced motion — skip animation, show final state
    if (prefersReducedMotion) {
      return { ...ANIMATION_STYLES[variant].animate }
    }

    const shouldAnimate = isInView || (once && hasAnimated)
    return {
      ...(shouldAnimate ? ANIMATION_STYLES[variant].animate : ANIMATION_STYLES[variant].initial),
      transition: `opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms, transform 0.7s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms, filter 0.7s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`,
      willChange: shouldAnimate ? 'auto' : 'opacity, transform, filter',
    }
  }, [variant, isInView, hasAnimated, once, delay, prefersReducedMotion])

  return { ref, isInView, hasAnimated, style }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useScrollProgress — track page scroll progress (0-1)
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Returns page scroll progress as a value between 0 and 1.
 * Uses requestAnimationFrame for smoothness.
 *
 * @example
 * const progress = useScrollProgress()
 * <div style={{ width: `${progress * 100}%` }} className="progress-bar" />
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let rafId: number

    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const percent = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0
      setProgress(percent)
    }

    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return progress
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useScrollDirection — track scroll direction ('up' | 'down' | null)
   ═══════════════════════════════════════════════════════════════════════════════ */

export type ScrollDirection = 'up' | 'down' | null

/**
 * Detects scroll direction with threshold to prevent jitter.
 *
 * @example
 * // Hide/show header based on scroll direction
 * const dir = useScrollDirection()
 * <header className={dir === 'down' ? 'hidden' : 'visible'} />
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null)
  const lastScrollYRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    lastScrollYRef.current = window.scrollY

    const updateDirection = () => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollYRef.current

      if (Math.abs(diff) < threshold) return

      setDirection(diff > 0 ? 'down' : 'up')
      lastScrollYRef.current = currentY
    }

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateDirection)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [threshold])

  return direction
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useStaggeredScrollAnimation — for animating lists with staggered delays
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Get a stagger delay for a list item based on its index.
 *
 * @example
 * {items.map((item, i) => {
 *   const { ref, style } = useScrollAnimation({
 *     variant: 'fade-up',
 *     delay: getStaggerDelay(i, 80),
 *   })
 *   return <div ref={ref} style={style}>{item}</div>
 * })}
 */
export function getStaggerDelay(index: number, baseDelay = 60, maxDelay = 500): number {
  return Math.min(index * baseDelay, maxDelay)
}