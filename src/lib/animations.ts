// src/lib/animations.ts
import type { Variants, Transition } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════════
   EASING CURVES — reusable cubic-beziers matching your design system
   ═══════════════════════════════════════════════════════════════════════════════ */

export const EASE = {
  /** Signature Pulse curve — smooth in-out */
  out:      [0.23, 1, 0.32, 1] as const,
  inOut:    [0.4, 0, 0.2, 1] as const,
  in:       [0.4, 0, 1, 1] as const,
  spring:   [0.34, 1.56, 0.64, 1] as const,  // bouncy
  anticipate: [0.68, -0.55, 0.27, 1.55] as const,
} as const

/* ═══════════════════════════════════════════════════════════════════════════════
   DURATIONS — consistent timing scale
   ═══════════════════════════════════════════════════════════════════════════════ */

export const DURATION = {
  instant: 0.1,
  fast:    0.18,
  normal:  0.28,
  slow:    0.4,
  slower:  0.6,
} as const

/* ═══════════════════════════════════════════════════════════════════════════════
   TRANSITION PRESETS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const transitions = {
  smooth:  { duration: DURATION.normal, ease: EASE.out } as Transition,
  quick:   { duration: DURATION.fast,   ease: EASE.out } as Transition,
  slow:    { duration: DURATION.slow,   ease: EASE.out } as Transition,
  spring:  { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as Transition,
  bounce:  { type: 'spring', stiffness: 300, damping: 15 } as Transition,
  elastic: { type: 'spring', stiffness: 500, damping: 12, mass: 1 } as Transition,
} as const

/* ═══════════════════════════════════════════════════════════════════════════════
   FADE VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.smooth },
  exit:    { opacity: 0, transition: transitions.quick },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0,  transition: transitions.smooth },
  exit:    { opacity: 0, y: -12, transition: transitions.quick },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0,  transition: transitions.smooth },
  exit:    { opacity: 0, y: 12, transition: transitions.quick },
}

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0,  transition: transitions.smooth },
  exit:    { opacity: 0, x: -12, transition: transitions.quick },
}

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0,  transition: transitions.smooth },
  exit:    { opacity: 0, x: 12, transition: transitions.quick },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SCALE VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1,    transition: transitions.smooth },
  exit:    { opacity: 0, scale: 0.94, transition: transitions.quick },
}

export const scalePop: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1,   transition: transitions.spring },
  exit:    { opacity: 0, scale: 0.9, transition: transitions.quick },
}

export const zoomIn: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1,    transition: transitions.bounce },
  exit:    { opacity: 0, scale: 0.7,  transition: transitions.quick },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SLIDE VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0,  transition: transitions.smooth },
  exit:    { opacity: 0, x: -30, transition: transitions.quick },
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0,  transition: transitions.smooth },
  exit:    { opacity: 0, x: 30, transition: transitions.quick },
}

export const slideInUp: Variants = {
  initial: { opacity: 0, y: 100 },
  animate: { opacity: 1, y: 0,   transition: transitions.smooth },
  exit:    { opacity: 0, y: 60,  transition: transitions.quick },
}

export const slideInDown: Variants = {
  initial: { opacity: 0, y: -100 },
  animate: { opacity: 1, y: 0,    transition: transitions.smooth },
  exit:    { opacity: 0, y: -60,  transition: transitions.quick },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   BLUR / GLOW VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const blurIn: Variants = {
  initial: { opacity: 0, filter: 'blur(12px)' },
  animate: { opacity: 1, filter: 'blur(0px)',  transition: transitions.slow },
  exit:    { opacity: 0, filter: 'blur(6px)',  transition: transitions.quick },
}

export const glowAnimation: Variants = {
  initial: { opacity: 0.5, filter: 'brightness(1)' },
  animate: {
    opacity: [0.5, 1, 0.5],
    filter:  ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const pulseAnimation: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const breatheAnimation: Variants = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.9, 1, 0.9],
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const shimmerAnimation: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 2, repeat: Infinity, ease: 'linear' },
  },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ROTATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const rotateIn: Variants = {
  initial: { opacity: 0, rotate: -180, scale: 0.5 },
  animate: { opacity: 1, rotate: 0,    scale: 1, transition: transitions.spring },
  exit:    { opacity: 0, rotate: 180,  scale: 0.5, transition: transitions.quick },
}

export const spinInfinite: Variants = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAGGER CONTAINERS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
}

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
}

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

/**
 * Dynamic stagger — accepts custom child delay
 */
export function createStaggerContainer(staggerDelay = 0.08, initialDelay = 0.05): Variants {
  return {
    initial: {},
    animate: {
      transition: { staggerChildren: staggerDelay, delayChildren: initialDelay },
    },
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HOVER / INTERACTIVE STATES
   ═══════════════════════════════════════════════════════════════════════════════ */

export const hoverLift = {
  whileHover: { y: -2, transition: transitions.quick },
  whileTap:   { y: 0, scale: 0.98 },
}

export const hoverScale = {
  whileHover: { scale: 1.05, transition: transitions.quick },
  whileTap:   { scale: 0.95 },
}

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 24px rgba(99,102,241,0.4)',
    transition: transitions.smooth,
  },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE / ROUTE TRANSITIONS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: DURATION.normal, ease: EASE.out } },
  exit:    { opacity: 0, y: -8, transition: { duration: DURATION.fast,   ease: EASE.in } },
}

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.fast } },
  exit:    { opacity: 0, transition: { duration: DURATION.fast } },
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 20 },
  animate: { opacity: 1, scale: 1,    y: 0,   transition: transitions.smooth },
  exit:    { opacity: 0, scale: 0.94, y: 12,  transition: transitions.quick },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPING / TEXT REVEAL
   ═══════════════════════════════════════════════════════════════════════════════ */

export const typewriterContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.03 },
  },
}

export const typewriterChar: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.1 } },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   UTILITY — respect reduced motion at runtime
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Wrap variants to respect prefers-reduced-motion.
 * Returns simplified variants (just opacity) when reduced motion is preferred.
 */
export function respectMotion(variants: Variants): Variants {
  if (typeof window === 'undefined') return variants
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!prefersReduced) return variants

  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.1 } },
    exit:    { opacity: 0, transition: { duration: 0.1 } },
  }
}