// src/hooks/useMediaQuery.ts
'use client'

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════════
   useMediaQuery — SSR-safe with useSyncExternalStore
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * SSR-safe media query hook using React 18's useSyncExternalStore.
 * Correctly handles concurrent rendering and tearing.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const subscribe = useMemo(() => {
    return (callback: () => void) => {
      if (typeof window === 'undefined') return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    }
  }, [query])

  const getSnapshot = () => {
    if (typeof window === 'undefined') return defaultValue
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => defaultValue

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PRESET BREAKPOINTS — matches Tailwind CSS defaults
   ═══════════════════════════════════════════════════════════════════════════════ */

export const BREAKPOINTS = {
  sm:  '(min-width: 640px)',
  md:  '(min-width: 768px)',
  lg:  '(min-width: 1024px)',
  xl:  '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',

  // Max-width variants
  'max-sm':  '(max-width: 639px)',
  'max-md':  '(max-width: 767px)',
  'max-lg':  '(max-width: 1023px)',
  'max-xl':  '(max-width: 1279px)',
  'max-2xl': '(max-width: 1535px)',

  // System preferences
  dark:          '(prefers-color-scheme: dark)',
  light:         '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  reducedData:   '(prefers-reduced-data: reduce)',
  highContrast:  '(prefers-contrast: more)',

  // Device / orientation
  portrait:  '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  hover:     '(hover: hover)',
  touch:     '(hover: none) and (pointer: coarse)',
  retina:    '(min-resolution: 2dppx)',
  print:     'print',
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

/**
 * Shortcut hook using preset breakpoints
 *
 * @example
 * const isMobile = useBreakpoint('max-md')
 * const prefersDark = useBreakpoint('dark')
 * const isTouch = useBreakpoint('touch')
 */
export function useBreakpoint(breakpoint: BreakpointKey, defaultValue = false): boolean {
  return useMediaQuery(BREAKPOINTS[breakpoint], defaultValue)
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useDeviceType — returns a rich device profile
   ═══════════════════════════════════════════════════════════════════════════════ */

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface DeviceInfo {
  type: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  isRetina: boolean
  prefersDark: boolean
  prefersReducedMotion: boolean
  orientation: 'portrait' | 'landscape'
}

/**
 * Comprehensive device detection — one hook, all the info you need.
 *
 * @example
 * const { type, isTouch, prefersDark } = useDevice()
 */
export function useDevice(): DeviceInfo {
  const isMobile   = useMediaQuery(BREAKPOINTS['max-md'])
  const isTablet   = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop  = useMediaQuery(BREAKPOINTS.lg)
  const isTouch    = useMediaQuery(BREAKPOINTS.touch)
  const isRetina   = useMediaQuery(BREAKPOINTS.retina)
  const prefersDark = useMediaQuery(BREAKPOINTS.dark)
  const prefersReducedMotion = useMediaQuery(BREAKPOINTS.reducedMotion)
  const isPortrait = useMediaQuery(BREAKPOINTS.portrait)

  return useMemo<DeviceInfo>(
    () => ({
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      isMobile,
      isTablet,
      isDesktop,
      isTouch,
      isRetina,
      prefersDark,
      prefersReducedMotion,
      orientation: isPortrait ? 'portrait' : 'landscape',
    }),
    [isMobile, isTablet, isDesktop, isTouch, isRetina, prefersDark, prefersReducedMotion, isPortrait]
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useWindowSize — reactive window dimensions
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface WindowSize {
  width: number
  height: number
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    let rafId: number
    const handleResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight })
      })
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return size
}