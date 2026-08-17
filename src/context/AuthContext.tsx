/* eslint-disable react-hooks/set-state-in-effect */
// src/context/AuthContext.tsx
'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type Plan = 'free' | 'pro' | 'team'
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  plan: Plan
  messagesUsed: number
  messagesLimit: number
  createdAt?: string
  emailVerified?: boolean
  role?: 'user' | 'admin'
}

export interface RegisterData {
  email: string
  password: string
  name?: string
}

export interface AuthError {
  code: string
  message: string
  field?: string
}

interface QuotaInfo {
  used: number
  limit: number
  remaining: number
  percentUsed: number
  isNearLimit: boolean
  isOverLimit: boolean
  isUnlimited: boolean
}

interface AuthContextType {
  // Core state
  user: AuthUser | null
  status: AuthStatus
  loading: boolean
  isAuthenticated: boolean
  error: AuthError | null

  // Auth actions
  register: (data: RegisterData) => Promise<AuthUser>
  login: (email: string, password: string) => Promise<AuthUser>
  loginWithProvider: (provider: 'google' | 'github') => Promise<void>
  logout: (redirectTo?: string) => Promise<void>

  // User operations
  refreshUser: () => Promise<AuthUser | null>
  updateUser: (updates: Partial<AuthUser>) => void
  incrementUsage: (amount?: number) => void

  // Derived helpers
  quota: QuotaInfo
  hasPlan: (plan: Plan | Plan[]) => boolean
  isPro: boolean
  isAdmin: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════════════════════ */

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 50,
  pro: -1,
  team: -1,
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

/* ═══════════════════════════════════════════════════════════════════════════════
   CONTEXT
   ═══════════════════════════════════════════════════════════════════════════════ */

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */

function normalizeUser(sessionUser: unknown): AuthUser | null {
  if (!sessionUser || typeof sessionUser !== 'object') return null

  const u = sessionUser as Record<string, unknown>
  const rawPlan = typeof u.plan === 'string' ? u.plan : 'free'
  const plan: Plan = (['free', 'pro', 'team'] as const).includes(rawPlan as Plan)
    ? (rawPlan as Plan)
    : 'free'

  return {
    id:            typeof u.id === 'string' ? u.id : '',
    name:          typeof u.name === 'string' ? u.name : 'User',
    email:         typeof u.email === 'string' ? u.email : '',
    avatarUrl:
      typeof u.image === 'string'     ? u.image
      : typeof u.avatarUrl === 'string' ? u.avatarUrl
      : undefined,
    plan,
    messagesUsed:  typeof u.messagesUsed === 'number' ? u.messagesUsed : 0,
    messagesLimit: typeof u.messagesLimit === 'number' ? u.messagesLimit : PLAN_LIMITS[plan],
    createdAt:     typeof u.createdAt === 'string' ? u.createdAt : undefined,
    emailVerified: typeof u.emailVerified === 'boolean' ? u.emailVerified : undefined,
    role:          u.role === 'admin' ? 'admin' : 'user',
  }
}

function parseError(err: unknown): AuthError {
  if (!err) return { code: 'UNKNOWN', message: 'An unknown error occurred' }

  const msg = err instanceof Error ? err.message : String(err)

  // Common error mappings
  if (/credentials|invalid.?email.?or.?password/i.test(msg)) {
    return { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
  }
  if (/email.?already/i.test(msg)) {
    return { code: 'EMAIL_EXISTS', message: 'An account with this email already exists', field: 'email' }
  }
  if (/password.?too.?short|weak.?password/i.test(msg)) {
    return { code: 'WEAK_PASSWORD', message: 'Password is too weak', field: 'password' }
  }
  if (/network|fetch|connection/i.test(msg)) {
    return { code: 'NETWORK', message: 'Connection error. Please check your internet.' }
  }
  if (/rate.?limit|too.?many/i.test(msg)) {
    return { code: 'RATE_LIMIT', message: 'Too many attempts. Please wait a moment.' }
  }

  return { code: 'ERROR', message: msg }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PROVIDER
   ═══════════════════════════════════════════════════════════════════════════════ */

interface AuthProviderProps {
  children: ReactNode
  /** Auto-refresh user data on interval (default 5 min) */
  autoRefresh?: boolean
  /** Custom login redirect */
  loginRedirect?: string
  /** Custom logout redirect */
  logoutRedirect?: string
}

export function AuthProvider({
  children,
  autoRefresh = true,
  loginRedirect = '/',
  logoutRedirect = '/login',
}: AuthProviderProps) {
  const { data: session, status: sessionStatus, update } = useSession()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const router = useRouter()

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasFetchedRef = useRef(false)

  /* ─── Sync NextAuth session → local user state ───────────────────── */
  useEffect(() => {
    if (sessionStatus === 'loading') {
      setStatus('loading')
      setLoading(true)
      return
    }

    if (sessionStatus === 'authenticated' && session?.user) {
      setUser(normalizeUser(session.user))
      setStatus('authenticated')
    } else {
      setUser(null)
      setStatus('unauthenticated')
    }

    setLoading(false)
  }, [session, sessionStatus])

  /* ─── Fetch fresh user data from API ─────────────────────────────── */
  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await fetch('/api/user/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null)
          setStatus('unauthenticated')
        }
        return null
      }

      const data = await response.json()
      const normalized = normalizeUser(data)
      if (normalized) {
        setUser(normalized)
        setError(null)
      }
      return normalized
    } catch (err) {
      console.warn('[AuthContext] refreshUser failed:', err)
      return null
    }
  }, [])

  /* ─── Auto-refresh once on mount + on interval ───────────────────── */
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || loading) return

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      refreshUser()
    }

    if (autoRefresh) {
      refreshTimerRef.current = setInterval(refreshUser, REFRESH_INTERVAL_MS)
      return () => {
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      }
    }
  }, [sessionStatus, loading, autoRefresh, refreshUser])

  /* ─── Cleanup on unmount ─────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [])

  /* ─── Optimistic user update ─────────────────────────────────────── */
  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev))
  }, [])

  /* ─── Optimistic usage increment ─────────────────────────────────── */
  const incrementUsage = useCallback((amount = 1) => {
    setUser((prev) => {
      if (!prev) return prev
      if (prev.messagesLimit === -1) return prev
      return { ...prev, messagesUsed: prev.messagesUsed + amount }
    })
  }, [])

  /* ─── Register + auto-login ──────────────────────────────────────── */
  const register = useCallback(
    async (data: RegisterData): Promise<AuthUser> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Registration failed')
        }

        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        })

        if (result?.error) throw new Error(result.error)

        await update()
        const freshUser = await refreshUser()

        if (!freshUser) throw new Error('Failed to load user data after registration')

        router.refresh()
        return freshUser
      } catch (err) {
        const parsed = parseError(err)
        setError(parsed)
        throw new Error(parsed.message)
      } finally {
        setLoading(false)
      }
    },
    [router, update, refreshUser]
  )

  /* ─── Login ──────────────────────────────────────────────────────── */
  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      setLoading(true)
      setError(null)

      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) throw new Error(result.error)

        await update()
        const freshUser = await refreshUser()

        if (!freshUser) throw new Error('Failed to load user data after login')

        router.refresh()
        return freshUser
      } catch (err) {
        const parsed = parseError(err)
        setError(parsed)
        throw new Error(parsed.message)
      } finally {
        setLoading(false)
      }
    },
    [router, update, refreshUser]
  )

  /* ─── OAuth login (Google/GitHub) ────────────────────────────────── */
  const loginWithProvider = useCallback(
    async (provider: 'google' | 'github'): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        await signIn(provider, { callbackUrl: loginRedirect })
      } catch (err) {
        setError(parseError(err))
        setLoading(false)
      }
    },
    [loginRedirect]
  )

  /* ─── Logout ─────────────────────────────────────────────────────── */
  const logout = useCallback(
    async (redirectTo?: string): Promise<void> => {
      try {
        await signOut({ redirect: false })
        setUser(null)
        setStatus('unauthenticated')
        setError(null)
        hasFetchedRef.current = false

        // Clear any refresh timer
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current)
          refreshTimerRef.current = null
        }

        router.push(redirectTo ?? logoutRedirect)
      } catch (err) {
        console.error('[AuthContext] Logout error:', err)
        // Force navigate anyway
        router.push(redirectTo ?? logoutRedirect)
      }
    },
    [router, logoutRedirect]
  )

  /* ─── Derived: quota info ────────────────────────────────────────── */
  const quota = useMemo<QuotaInfo>(() => {
    const used  = user?.messagesUsed  ?? 0
    const limit = user?.messagesLimit ?? PLAN_LIMITS.free
    const isUnlimited = limit === -1

    const remaining   = isUnlimited ? Infinity : Math.max(0, limit - used)
    const percentUsed = isUnlimited ? 0 : Math.min(100, (used / limit) * 100)
    const isNearLimit = !isUnlimited && percentUsed >= 80
    const isOverLimit = !isUnlimited && used >= limit

    return {
      used,
      limit,
      remaining,
      percentUsed,
      isNearLimit,
      isOverLimit,
      isUnlimited,
    }
  }, [user?.messagesUsed, user?.messagesLimit])

  /* ─── Derived: plan checks ───────────────────────────────────────── */
  const hasPlan = useCallback(
    (plan: Plan | Plan[]): boolean => {
      if (!user) return false
      const plans = Array.isArray(plan) ? plan : [plan]
      return plans.includes(user.plan)
    },
    [user]
  )

  const isPro = useMemo(() => hasPlan(['pro', 'team']), [hasPlan])
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role])

  /* ─── Context value ──────────────────────────────────────────────── */
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      status,
      loading,
      isAuthenticated: !!user,
      error,
      register,
      login,
      loginWithProvider,
      logout,
      refreshUser,
      updateUser,
      incrementUsage,
      quota,
      hasPlan,
      isPro,
      isAdmin,
    }),
    [
      user, status, loading, error,
      register, login, loginWithProvider, logout,
      refreshUser, updateUser, incrementUsage,
      quota, hasPlan, isPro, isAdmin,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════════════ */

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * Convenience hook: throws if user is not authenticated.
 * Use in protected components after route middleware confirms auth.
 */
export function useRequiredAuth(): AuthUser {
  const { user } = useAuth()
  if (!user) {
    throw new Error('useRequiredAuth called without authenticated user')
  }
  return user
}

/**
 * Convenience hook: check if user has required plan
 */
export function useRequirePlan(plan: Plan | Plan[]): {
  hasAccess: boolean
  currentPlan: Plan | undefined
  requiredPlan: Plan | Plan[]
} {
  const { user, hasPlan } = useAuth()
  return {
    hasAccess: hasPlan(plan),
    currentPlan: user?.plan,
    requiredPlan: plan,
  }
}