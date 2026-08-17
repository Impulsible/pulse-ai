/* eslint-disable react-hooks/purity */
// src/components/UI/Toast.tsx
'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading'
type ToastPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  title: string
  description?: string
  type?: ToastType
  duration?: number
  action?: ToastAction
  dismissible?: boolean
  createdAt: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string
  removeToast: (id: string) => void
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id' | 'createdAt'>>) => void
  removeAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

/* ─────────────────────────────────────────────────────────────────────────────
   THEME — per-type visual language
   ───────────────────────────────────────────────────────────────────────────── */
const TYPE_THEME: Record<ToastType, {
  accent: string
  ring: string
  glow: string
  iconBg: string
  iconColor: string
  progress: string
}> = {
  success: {
    accent: 'from-emerald-500/20 to-emerald-500/5',
    ring: 'ring-emerald-500/25',
    glow: 'shadow-[0_8px_32px_-8px_rgba(16,185,129,0.35)]',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    progress: 'from-emerald-500 to-emerald-400',
  },
  error: {
    accent: 'from-red-500/20 to-red-500/5',
    ring: 'ring-red-500/25',
    glow: 'shadow-[0_8px_32px_-8px_rgba(239,68,68,0.4)]',
    iconBg: 'bg-red-500/15 border-red-500/30',
    iconColor: 'text-red-400',
    progress: 'from-red-500 to-red-400',
  },
  warning: {
    accent: 'from-amber-500/20 to-amber-500/5',
    ring: 'ring-amber-500/25',
    glow: 'shadow-[0_8px_32px_-8px_rgba(245,158,11,0.35)]',
    iconBg: 'bg-amber-500/15 border-amber-500/30',
    iconColor: 'text-amber-400',
    progress: 'from-amber-500 to-orange-400',
  },
  info: {
    accent: 'from-indigo-500/20 to-indigo-500/5',
    ring: 'ring-indigo-500/25',
    glow: 'shadow-[0_8px_32px_-8px_rgba(99,102,241,0.35)]',
    iconBg: 'bg-indigo-500/15 border-indigo-500/30',
    iconColor: 'text-indigo-400',
    progress: 'from-indigo-500 to-violet-500',
  },
  loading: {
    accent: 'from-white/[0.08] to-white/[0.02]',
    ring: 'ring-white/20',
    glow: 'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]',
    iconBg: 'bg-white/[0.06] border-white/[0.15]',
    iconColor: 'text-white/60',
    progress: 'from-white/40 to-white/60',
  },
}

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS — crisp, custom-drawn
   ───────────────────────────────────────────────────────────────────────────── */
function SuccessIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
function LoadingIcon() {
  return (
    <motion.svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </motion.svg>
  )
}
function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const TYPE_ICONS: Record<ToastType, React.ReactNode> = {
  success: <SuccessIcon />,
  error:   <ErrorIcon />,
  warning: <WarningIcon />,
  info:    <InfoIcon />,
  loading: <LoadingIcon />,
}

/* ─────────────────────────────────────────────────────────────────────────────
   ID GENERATOR — cryptographically safer than Math.random
   ───────────────────────────────────────────────────────────────────────────── */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROVIDER
   ───────────────────────────────────────────────────────────────────────────── */
export function ToastProvider({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}: {
  children: React.ReactNode
  position?: ToastPosition
  maxToasts?: number
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, 'id' | 'createdAt'>) => {
      const id = generateId()
      const newToast: Toast = {
        ...toast,
        id,
        createdAt: Date.now(),
        dismissible: toast.dismissible ?? true,
      }

      setToasts((prev) => {
        const next = [newToast, ...prev]
        // Trim to maxToasts (keep newest)
        return next.slice(0, maxToasts)
      })

      // Auto-dismiss unless duration is 0 or type is loading
      if (toast.duration !== 0 && toast.type !== 'loading') {
        const timeout = toast.duration ?? 5000
        setTimeout(() => removeToast(id), timeout)
      }

      return id
    },
    [maxToasts, removeToast]
  )

  const updateToast = useCallback(
    (id: string, updates: Partial<Omit<Toast, 'id' | 'createdAt'>>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      )
    },
    []
  )

  const removeAll = useCallback(() => setToasts([]), [])

  const value = useMemo(
    () => ({ toasts, addToast, removeToast, updateToast, removeAll }),
    [toasts, addToast, removeToast, updateToast, removeAll]
  )

  const positionClasses: Record<ToastPosition, string> = {
    'top-left':      'top-4 left-4 items-start',
    'top-center':    'top-4 left-1/2 -translate-x-1/2 items-center',
    'top-right':     'top-4 right-4 items-end',
    'bottom-left':   'bottom-4 left-4 items-start',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-right':  'bottom-4 right-4 items-end',
  }

  const isTop = position.startsWith('top')

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className={cn(
          'fixed z-[9999] flex flex-col gap-2 pointer-events-none',
          'w-full max-w-[380px]',
          positionClasses[position]
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {(isTop ? toasts : [...toasts].reverse()).map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
              isTop={isTop}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOAST ITEM
   ───────────────────────────────────────────────────────────────────────────── */
function ToastItem({
  toast,
  onClose,
  isTop,
}: {
  toast: Toast
  onClose: () => void
  isTop: boolean
}) {
  const type = toast.type ?? 'info'
  const theme = TYPE_THEME[type]
  const isLoading = type === 'loading'
  const duration = toast.duration ?? 5000
  const shouldShowProgress = duration > 0 && !isLoading

  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)
  const progressRef = useRef<number>(100)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(Date.now())
  const pausedAtRef = useRef<number>(0)
  const totalPausedRef = useRef<number>(0)

  // Progress animation using RAF for smoothness
  useEffect(() => {
    if (!shouldShowProgress) return

    startRef.current = Date.now()

    const tick = () => {
      if (isPaused) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const elapsed = Date.now() - startRef.current - totalPausedRef.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      progressRef.current = remaining
      setProgress(remaining)

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [shouldShowProgress, duration, isPaused])

  // Pause / resume on hover
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true)
    pausedAtRef.current = Date.now()
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false)
    if (pausedAtRef.current > 0) {
      totalPausedRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = 0
    }
  }, [])

  // Swipe to dismiss (drag)
  const [dragX, setDragX] = useState(0)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: isTop ? -20 : 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.85,
        y: isTop ? -12 : 12,
        transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
      }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 30,
        mass: 0.8,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
          onClose()
        } else {
          setDragX(0)
        }
      }}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ opacity: Math.max(0, 1 - Math.abs(dragX) / 200) }}
      className={cn(
        'pointer-events-auto relative w-full min-w-[320px] max-w-[380px]',
        'rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing',
        'bg-[#0a0a12]/95 backdrop-blur-2xl',
        'border border-white/[0.08] ring-1',
        theme.ring,
        theme.glow,
      )}
    >
      {/* Accent gradient wash */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none',
        theme.accent
      )} />

      {/* Top glint */}
      <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative flex items-start gap-3 p-4 pr-3">
        {/* Icon in glowing tile */}
        <div className="flex-shrink-0 pt-0.5">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center border',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
            theme.iconBg
          )}>
            <span className={theme.iconColor}>
              {TYPE_ICONS[type]}
            </span>
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[13px] font-semibold text-white/90 tracking-tight leading-snug">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-[11.5px] text-white/50 mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}

          {/* Optional action button */}
          {toast.action && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toast.action?.onClick()
                onClose()
              }}
              className={cn(
                'mt-2.5 text-[11px] font-mono font-semibold uppercase tracking-wider',
                'px-2.5 py-1 rounded-md border',
                'bg-white/[0.05] border-white/[0.1]',
                'text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15]',
                'transition-colors'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        {toast.dismissible && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center',
              'text-white/25 hover:text-white/70 hover:bg-white/[0.08]',
              'transition-colors'
            )}
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Progress bar (bottom edge) */}
      {shouldShowProgress && (
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/[0.05] overflow-hidden">
          <motion.div
            className={cn('h-full bg-gradient-to-r', theme.progress)}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}

      {/* Pause indicator (subtle) */}
      <AnimatePresence>
        {isPaused && shouldShowProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1.5 right-1.5 pointer-events-none"
          >
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
              <div className="w-0.5 h-2 bg-white/40" />
              <div className="w-0.5 h-2 bg-white/40" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOOK — public API
   ───────────────────────────────────────────────────────────────────────────── */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  const { addToast, removeToast, updateToast, removeAll, toasts } = context

  // Convenience methods with sensible defaults
  const toast = useMemo(
    () => ({
      /** Show a success toast */
      success: (title: string, options?: Partial<Omit<Toast, 'id' | 'createdAt' | 'title' | 'type'>>) =>
        addToast({ title, type: 'success', ...options }),

      /** Show an error toast (7s default duration for readability) */
      error: (title: string, options?: Partial<Omit<Toast, 'id' | 'createdAt' | 'title' | 'type'>>) =>
        addToast({ title, type: 'error', duration: 7000, ...options }),

      /** Show a warning toast */
      warning: (title: string, options?: Partial<Omit<Toast, 'id' | 'createdAt' | 'title' | 'type'>>) =>
        addToast({ title, type: 'warning', ...options }),

      /** Show an info toast */
      info: (title: string, options?: Partial<Omit<Toast, 'id' | 'createdAt' | 'title' | 'type'>>) =>
        addToast({ title, type: 'info', ...options }),

      /** Show a persistent loading toast — returns id for later updates */
      loading: (title: string, options?: Partial<Omit<Toast, 'id' | 'createdAt' | 'title' | 'type'>>) =>
        addToast({ title, type: 'loading', duration: 0, dismissible: false, ...options }),

      /** Promise helper — auto-updates from loading → success/error */
      promise: async <T,>(
        promise: Promise<T>,
        messages: {
          loading: string
          success: string | ((data: T) => string)
          error:   string | ((err: unknown) => string)
        }
      ): Promise<T> => {
        const id = addToast({ title: messages.loading, type: 'loading', duration: 0, dismissible: false })
        try {
          const data = await promise
          const successMsg = typeof messages.success === 'function' ? messages.success(data) : messages.success
          updateToast(id, { title: successMsg, type: 'success', duration: 4000, dismissible: true })
          setTimeout(() => removeToast(id), 4000)
          return data
        } catch (err) {
          const errorMsg = typeof messages.error === 'function' ? messages.error(err) : messages.error
          updateToast(id, { title: errorMsg, type: 'error', duration: 7000, dismissible: true })
          setTimeout(() => removeToast(id), 7000)
          throw err
        }
      },

      /** Dismiss a specific toast by ID */
      dismiss: (id: string) => removeToast(id),

      /** Dismiss all toasts */
      dismissAll: () => removeAll(),

      /** Update an existing toast (useful for loading → done transitions) */
      update: updateToast,
    }),
    [addToast, removeToast, updateToast, removeAll]
  )

  return { ...context, toast, toasts, addToast, removeToast, updateToast, removeAll }
}