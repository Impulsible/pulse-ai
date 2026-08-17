/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/refs */
// src/hooks/useLocalStorage.ts
'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface LocalStorageOptions<T> {
  /** Custom serializer (defaults to JSON) */
  serialize?: (value: T) => string
  /** Custom deserializer */
  deserialize?: (value: string) => T
  /** Sync changes across tabs/windows */
  syncTabs?: boolean
  /** Called when value changes */
  onChange?: (newValue: T, oldValue: T) => void
  /** Called on read/write errors */
  onError?: (error: Error, action: 'read' | 'write' | 'remove') => void
  /** Namespace all keys under a prefix */
  keyPrefix?: string
  /** SSR safe — defer initial read to after mount */
  ssrSafe?: boolean
}

type SetValueAction<T> = T | ((prev: T) => T)

/* ═══════════════════════════════════════════════════════════════════════════════
   INTERNAL: safe access checker
   ═══════════════════════════════════════════════════════════════════════════════ */

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

const defaultSerialize   = <T,>(v: T): string => JSON.stringify(v)
const defaultDeserialize = <T,>(v: string): T => JSON.parse(v) as T

/* ═══════════════════════════════════════════════════════════════════════════════
   useLocalStorage
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Modern localStorage hook with SSR safety, cross-tab sync, custom serialization,
 * error handling, and namespaced keys.
 *
 * @example
 * const [theme, setTheme, { remove }] = useLocalStorage('theme', 'dark')
 * setTheme('light')
 * remove() // reset to initial
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: LocalStorageOptions<T> = {}
) {
  const {
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    syncTabs = true,
    onChange,
    onError,
    keyPrefix = '',
    ssrSafe = true,
  } = options

  const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key
  const [isHydrated, setIsHydrated] = useState(!ssrSafe)

  // Stable refs for callbacks
  const onChangeRef = useRef(onChange)
  const onErrorRef  = useRef(onError)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { onErrorRef.current  = onError  }, [onError])

  // Read from storage
  const readValue = useCallback((): T => {
    if (!isBrowser()) {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue
    }
    try {
      const item = window.localStorage.getItem(fullKey)
      if (item === null) {
        return typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
      }
      return deserialize(item)
    } catch (error) {
      onErrorRef.current?.(error as Error, 'read')
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue
    }
  }, [fullKey, initialValue, deserialize])

  // Initial state (SSR safe)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (ssrSafe && typeof window === 'undefined') {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue
    }
    return readValue()
  })

  // Hydrate after mount if SSR-safe
  useEffect(() => {
    if (ssrSafe && !isHydrated) {
      setStoredValue(readValue())
      setIsHydrated(true)
    }
  }, [ssrSafe, isHydrated, readValue])

  // Write to storage
  const setValue = useCallback(
    (value: SetValueAction<T>) => {
      if (!isBrowser()) return

      setStoredValue((prev) => {
        try {
          const newValue = value instanceof Function ? value(prev) : value
          window.localStorage.setItem(fullKey, serialize(newValue))

          // Notify listeners
          if (JSON.stringify(newValue) !== JSON.stringify(prev)) {
            onChangeRef.current?.(newValue, prev)
          }

          // Dispatch custom event for same-tab sync
          window.dispatchEvent(
            new CustomEvent('local-storage', {
              detail: { key: fullKey, value: newValue },
            })
          )

          return newValue
        } catch (error) {
          onErrorRef.current?.(error as Error, 'write')
          return prev
        }
      })
    },
    [fullKey, serialize]
  )

  // Remove from storage
  const remove = useCallback(() => {
    if (!isBrowser()) return
    try {
      window.localStorage.removeItem(fullKey)
      const initial = typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue
      setStoredValue(initial)
      window.dispatchEvent(
        new CustomEvent('local-storage', {
          detail: { key: fullKey, value: null },
        })
      )
    } catch (error) {
      onErrorRef.current?.(error as Error, 'remove')
    }
  }, [fullKey, initialValue])

  // Refresh from storage manually
  const refresh = useCallback(() => {
    setStoredValue(readValue())
  }, [readValue])

  // Cross-tab sync
  useEffect(() => {
    if (!syncTabs || !isBrowser()) return

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== fullKey) return
      if (e.newValue === null) {
        const initial = typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
        setStoredValue(initial)
        return
      }
      try {
        setStoredValue(deserialize(e.newValue))
      } catch (error) {
        onErrorRef.current?.(error as Error, 'read')
      }
    }

    const handleCustom = (e: Event) => {
      const custom = e as CustomEvent<{ key: string; value: T | null }>
      if (custom.detail.key !== fullKey) return
      if (custom.detail.value === null) {
        const initial = typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
        setStoredValue(initial)
      } else {
        setStoredValue(custom.detail.value)
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('local-storage', handleCustom)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('local-storage', handleCustom)
    }
  }, [fullKey, syncTabs, initialValue, deserialize])

  const meta = useMemo(
    () => ({ remove, refresh, isHydrated, key: fullKey }),
    [remove, refresh, isHydrated, fullKey]
  )

  return [storedValue, setValue, meta] as const
}

/* ═══════════════════════════════════════════════════════════════════════════════
   useSessionStorage — same API, different backing store
   ═══════════════════════════════════════════════════════════════════════════════ */

export function useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: Omit<LocalStorageOptions<T>, 'syncTabs'> = {}
) {
  const {
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    onChange,
    onError,
    keyPrefix = '',
    ssrSafe = true,
  } = options

  const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key
  const [isHydrated, setIsHydrated] = useState(!ssrSafe)

  const onChangeRef = useRef(onChange)
  const onErrorRef  = useRef(onError)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { onErrorRef.current  = onError  }, [onError])

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue
    }
    try {
      const item = window.sessionStorage.getItem(fullKey)
      if (item === null) {
        return typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
      }
      return deserialize(item)
    } catch (error) {
      onErrorRef.current?.(error as Error, 'read')
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue
    }
  }, [fullKey, initialValue, deserialize])

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (ssrSafe && typeof window === 'undefined') {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue
    }
    return readValue()
  })

  useEffect(() => {
    if (ssrSafe && !isHydrated) {
      setStoredValue(readValue())
      setIsHydrated(true)
    }
  }, [ssrSafe, isHydrated, readValue])

  const setValue = useCallback(
    (value: SetValueAction<T>) => {
      if (typeof window === 'undefined') return
      setStoredValue((prev) => {
        try {
          const newValue = value instanceof Function ? value(prev) : value
          window.sessionStorage.setItem(fullKey, serialize(newValue))
          if (JSON.stringify(newValue) !== JSON.stringify(prev)) {
            onChangeRef.current?.(newValue, prev)
          }
          return newValue
        } catch (error) {
          onErrorRef.current?.(error as Error, 'write')
          return prev
        }
      })
    },
    [fullKey, serialize]
  )

  const remove = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.removeItem(fullKey)
      const initial = typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue
      setStoredValue(initial)
    } catch (error) {
      onErrorRef.current?.(error as Error, 'remove')
    }
  }, [fullKey, initialValue])

  return [storedValue, setValue, { remove, isHydrated, key: fullKey }] as const
}