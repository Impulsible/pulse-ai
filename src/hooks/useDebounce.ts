/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/refs */
// src/hooks/useDebounce.ts
'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface DebounceOptions {
  /** Fire on the leading edge (before waiting) */
  leading?: boolean
  /** Fire on the trailing edge (after delay) — default true */
  trailing?: boolean
  /** Maximum time to wait before forcing update (throttle-like behavior) */
  maxWait?: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useDebounce — debounces a value
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Debounces a value — returns the latest value only after it has stopped
 * changing for `delay` milliseconds.
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 300)
 */
export function useDebounce<T>(
  value: T,
  delay: number,
  options: DebounceOptions = {}
): T {
  const { leading = false, trailing = true, maxWait } = options

  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const lastCallTimeRef = useRef<number>(0)
  const lastInvokeTimeRef = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leadingInvokedRef = useRef(false)

  useEffect(() => {
    const now = Date.now()
    lastCallTimeRef.current = now

    const timeSinceLastInvoke = now - lastInvokeTimeRef.current
    const shouldInvokeLeading = leading && !leadingInvokedRef.current

    // Leading edge invocation
    if (shouldInvokeLeading) {
      setDebouncedValue(value)
      lastInvokeTimeRef.current = now
      leadingInvokedRef.current = true
    }

    // Clear existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    // Trailing edge
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value)
        lastInvokeTimeRef.current = Date.now()
        leadingInvokedRef.current = false
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current)
          maxTimeoutRef.current = null
        }
      }, delay)
    }

    // Max wait guarantee
    if (maxWait && !maxTimeoutRef.current) {
      const remainingMaxWait = Math.max(0, maxWait - timeSinceLastInvoke)
      maxTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value)
        lastInvokeTimeRef.current = Date.now()
        leadingInvokedRef.current = false
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        maxTimeoutRef.current = null
      }, remainingMaxWait)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [value, delay, leading, trailing, maxWait])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current)
    }
  }, [])

  return debouncedValue
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useDebouncedCallback — debounces a function
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void
  cancel: () => void
  flush: () => void
  pending: () => boolean
}

/**
 * Returns a debounced version of a callback function.
 * Useful for debouncing event handlers (typing, resize, scroll).
 *
 * @example
 * const debouncedSave = useDebouncedCallback((val) => save(val), 500)
 * onChange={(e) => debouncedSave(e.target.value)}
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
  options: DebounceOptions = {}
): DebouncedFunction<Args> {
  const { leading = false, trailing = true, maxWait } = options

  const callbackRef = useRef(callback)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgsRef = useRef<Args | null>(null)
  const lastCallTimeRef = useRef<number>(0)
  const leadingInvokedRef = useRef(false)

  // Keep callback ref fresh
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const invoke = useCallback(() => {
    if (lastArgsRef.current) {
      callbackRef.current(...lastArgsRef.current)
      lastArgsRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current)
      maxTimeoutRef.current = null
    }
    lastArgsRef.current = null
    leadingInvokedRef.current = false
  }, [])

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current)
      maxTimeoutRef.current = null
    }
    invoke()
    leadingInvokedRef.current = false
  }, [invoke])

  const pending = useCallback(() => {
    return timeoutRef.current !== null
  }, [])

  const debounced = useCallback(
    (...args: Args) => {
      const now = Date.now()
      lastArgsRef.current = args
      lastCallTimeRef.current = now

      // Leading edge
      if (leading && !leadingInvokedRef.current) {
        callbackRef.current(...args)
        leadingInvokedRef.current = true
        lastArgsRef.current = null
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          invoke()
          leadingInvokedRef.current = false
          timeoutRef.current = null
          if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current)
            maxTimeoutRef.current = null
          }
        }, delay)
      }

      if (maxWait && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          invoke()
          leadingInvokedRef.current = false
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
          maxTimeoutRef.current = null
        }, maxWait)
      }
    },
    [delay, leading, trailing, maxWait, invoke]
  )

  // Cleanup on unmount
  useEffect(() => cancel, [cancel])

  // Return stable object with methods
  return useMemo(
    () => Object.assign(debounced, { cancel, flush, pending }),
    [debounced, cancel, flush, pending]
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useThrottle — throttles a value (opposite of debounce)
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Throttles a value — updates at most once per `interval` ms.
 * Great for scroll positions, mouse coordinates.
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRunRef = useRef<number>(Date.now())

  useEffect(() => {
    const elapsed = Date.now() - lastRunRef.current

    if (elapsed >= interval) {
      setThrottledValue(value)
      lastRunRef.current = Date.now()
    } else {
      const timeout = setTimeout(() => {
        setThrottledValue(value)
        lastRunRef.current = Date.now()
      }, interval - elapsed)

      return () => clearTimeout(timeout)
    }
  }, [value, interval])

  return throttledValue
}