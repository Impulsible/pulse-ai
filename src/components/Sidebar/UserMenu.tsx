/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Sidebar/UserMenu.tsx
'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/UI/Toast'
import { cn } from '@/utils/cn'

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type Plan = 'free' | 'pro' | 'team'
type AvatarStyle = 'auto' | 'gravatar' | 'dicebear' | 'boring' | 'ui-avatars' | 'initials'

interface UserMenuProps {
  onProfile?: () => void
  onSettings?: () => void
  onHelp?: () => void
  avatarStyle?: AvatarStyle
}

interface UsageData {
  used: number
  limit: number
  plan: Plan
}

/* ─── Plan Config ────────────────────────────────────────────────────────────── */
const PLAN_LIMITS: Record<Plan, number> = { free: 50, pro: -1, team: -1 }

const PLAN_META: Record<Plan, { label: string; cls: string; upgradeHref?: string }> = {
  free: { label: 'Free', cls: 'text-white/30 bg-white/[0.04] border-white/[0.08]', upgradeHref: '/pricing' },
  pro:  { label: 'Pro',  cls: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' },
  team: { label: 'Team', cls: 'text-violet-300 bg-violet-500/10 border-violet-500/20' },
}

/* ─────────────────────────────────────────────────────────────────────────────
   MD5 — pure JS implementation for Gravatar hashing
   ───────────────────────────────────────────────────────────────────────────── */
async function md5(text: string): Promise<string> {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  function rotateLeft(n: number, s: number) { return (n << s) | (n >>> (32 - s)) }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(rotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & c) | (~b & d), a, b, x, s, t) }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & d) | (c & ~d), a, b, x, s, t) }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(b ^ c ^ d, a, b, x, s, t) }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(c ^ (b | ~d), a, b, x, s, t) }
  function str2blks(str: string) {
    const nblk = ((str.length + 8) >> 6) + 1
    const blks = new Array(nblk * 16).fill(0)
    for (let i = 0; i < str.length; i++) blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8)
    blks[str.length >> 2] |= 0x80 << ((str.length % 4) * 8)
    blks[nblk * 16 - 2] = str.length * 8
    return blks
  }
  function rhex(n: number) {
    let s = ''
    for (let j = 0; j <= 3; j++) {
      s += ((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16)
    }
    return s
  }
  const x = str2blks(text)
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878
  for (let i = 0; i < x.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d
    a = ff(a,b,c,d,x[i+ 0], 7, -680876936);  d = ff(d,a,b,c,x[i+ 1],12, -389564586)
    c = ff(c,d,a,b,x[i+ 2],17,  606105819);  b = ff(b,c,d,a,x[i+ 3],22,-1044525330)
    a = ff(a,b,c,d,x[i+ 4], 7, -176418897);  d = ff(d,a,b,c,x[i+ 5],12, 1200080426)
    c = ff(c,d,a,b,x[i+ 6],17,-1473231341);  b = ff(b,c,d,a,x[i+ 7],22,  -45705983)
    a = ff(a,b,c,d,x[i+ 8], 7, 1770035416);  d = ff(d,a,b,c,x[i+ 9],12,-1958414417)
    c = ff(c,d,a,b,x[i+10],17,     -42063);  b = ff(b,c,d,a,x[i+11],22,-1990404162)
    a = ff(a,b,c,d,x[i+12], 7, 1804603682);  d = ff(d,a,b,c,x[i+13],12,  -40341101)
    c = ff(c,d,a,b,x[i+14],17,-1502002290);  b = ff(b,c,d,a,x[i+15],22, 1236535329)
    a = gg(a,b,c,d,x[i+ 1], 5, -165796510);  d = gg(d,a,b,c,x[i+ 6], 9,-1069501632)
    c = gg(c,d,a,b,x[i+11],14,  643717713);  b = gg(b,c,d,a,x[i+ 0],20, -373897302)
    a = gg(a,b,c,d,x[i+ 5], 5, -701558691);  d = gg(d,a,b,c,x[i+10], 9,   38016083)
    c = gg(c,d,a,b,x[i+15],14, -660478335);  b = gg(b,c,d,a,x[i+ 4],20, -405537848)
    a = gg(a,b,c,d,x[i+ 9], 5,  568446438);  d = gg(d,a,b,c,x[i+14], 9,-1019803690)
    c = gg(c,d,a,b,x[i+ 3],14, -187363961);  b = gg(b,c,d,a,x[i+ 8],20, 1163531501)
    a = gg(a,b,c,d,x[i+13], 5,-1444681467);  d = gg(d,a,b,c,x[i+ 2], 9,  -51403784)
    c = gg(c,d,a,b,x[i+ 7],14, 1735328473);  b = gg(b,c,d,a,x[i+12],20,-1926607734)
    a = hh(a,b,c,d,x[i+ 5], 4,    -378558);  d = hh(d,a,b,c,x[i+ 8],11,-2022574463)
    c = hh(c,d,a,b,x[i+11],16, 1839030562);  b = hh(b,c,d,a,x[i+14],23,  -35309556)
    a = hh(a,b,c,d,x[i+ 1], 4,-1530992060);  d = hh(d,a,b,c,x[i+ 4],11, 1272893353)
    c = hh(c,d,a,b,x[i+ 7],16, -155497632);  b = hh(b,c,d,a,x[i+10],23,-1094730640)
    a = hh(a,b,c,d,x[i+13], 4,  681279174);  d = hh(d,a,b,c,x[i+ 0],11, -358537222)
    c = hh(c,d,a,b,x[i+ 3],16, -722521979);  b = hh(b,c,d,a,x[i+ 6],23,   76029189)
    a = hh(a,b,c,d,x[i+ 9], 4, -640364487);  d = hh(d,a,b,c,x[i+12],11, -421815835)
    c = hh(c,d,a,b,x[i+15],16,  530742520);  b = hh(b,c,d,a,x[i+ 2],23, -995338651)
    a = ii(a,b,c,d,x[i+ 0], 6, -198630844);  d = ii(d,a,b,c,x[i+ 7],10, 1126891415)
    c = ii(c,d,a,b,x[i+14],15,-1416354905);  b = ii(b,c,d,a,x[i+ 5],21,  -57434055)
    a = ii(a,b,c,d,x[i+12], 6, 1700485571);  d = ii(d,a,b,c,x[i+ 3],10,-1894986606)
    c = ii(c,d,a,b,x[i+10],15,   -1051523);  b = ii(b,c,d,a,x[i+ 1],21,-2054922799)
    a = ii(a,b,c,d,x[i+ 8], 6, 1873313359);  d = ii(d,a,b,c,x[i+15],10,  -30611744)
    c = ii(c,d,a,b,x[i+ 6],15,-1560198380);  b = ii(b,c,d,a,x[i+13],21, 1309151649)
    a = ii(a,b,c,d,x[i+ 4], 6, -145523070);  d = ii(d,a,b,c,x[i+11],10,-1120210379)
    c = ii(c,d,a,b,x[i+ 2],15,  718787259);  b = ii(b,c,d,a,x[i+ 9],21, -343485551)
    a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od)
  }
  return rhex(a) + rhex(b) + rhex(c) + rhex(d)
}

/* ─────────────────────────────────────────────────────────────────────────────
   AVATAR SOURCE URL BUILDERS
   ───────────────────────────────────────────────────────────────────────────── */
async function buildGravatarUrl(email: string, size = 128): Promise<string> {
  const hash = await md5(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}

function buildDiceBearUrl(seed: string, size = 128): string {
  const params = new URLSearchParams({
    seed,
    size: size.toString(),
    backgroundColor: '4f46e5,7c3aed,6366f1',
    backgroundType: 'gradientLinear',
    scale: '90',
  })
  return `https://api.dicebear.com/7.x/thumbs/svg?${params.toString()}`
}

function buildBoringAvatarUrl(seed: string, size = 128): string {
  const colors = ['6366f1', '8b5cf6', '3b82f6', 'a855f7', '2dd4bf'].join(',')
  return `https://source.boringavatars.com/beam/${size}/${encodeURIComponent(seed)}?colors=${colors}`
}

function buildUIAvatarsUrl(name: string, size = 128): string {
  const params = new URLSearchParams({
    name,
    size: size.toString(),
    background: '6366f1',
    color: 'ffffff',
    'font-size': '0.42',
    bold: 'true',
    length: '2',
  })
  return `https://ui-avatars.com/api/?${params.toString()}`
}

/* ─────────────────────────────────────────────────────────────────────────────
   AVATAR RESOLVER HOOK — walks the full fallback chain
   ───────────────────────────────────────────────────────────────────────────── */
type AvatarSource = {
  url: string
  label: string
}

function useAvatarUrl(
  email: string | undefined,
  name: string,
  explicitUrl: string | undefined,
  preferredStyle: AvatarStyle = 'auto',
  size = 128,
) {
  const [currentSource, setCurrentSource] = useState<AvatarSource | null>(null)
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [tierIndex, setTierIndex] = useState(0)
  const chainRef = useRef<AvatarSource[]>([])
  const [retryKey, setRetryKey] = useState(0)

  // Build the fallback chain
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const chain: AvatarSource[] = []

      // Tier 0: Explicit OAuth avatar
      if (explicitUrl) {
        chain.push({ url: explicitUrl, label: 'oauth' })
      }

      // Build rest of chain
      if (preferredStyle === 'auto') {
        if (email) {
          try {
            const gravatar = await buildGravatarUrl(email, size)
            chain.push({ url: gravatar, label: 'gravatar' })
          } catch {
            // Skip gravatar on error
          }
        }
        if (email) chain.push({ url: buildDiceBearUrl(email, size), label: 'dicebear' })
        if (email) chain.push({ url: buildBoringAvatarUrl(email, size), label: 'boring' })
        chain.push({ url: buildUIAvatarsUrl(name || email || 'User', size), label: 'ui-avatars' })
      } else if (preferredStyle === 'gravatar' && email) {
        try {
          const gravatar = await buildGravatarUrl(email, size)
          chain.push({ url: gravatar, label: 'gravatar' })
        } catch {
          // Skip
        }
      } else if (preferredStyle === 'dicebear' && email) {
        chain.push({ url: buildDiceBearUrl(email, size), label: 'dicebear' })
      } else if (preferredStyle === 'boring' && email) {
        chain.push({ url: buildBoringAvatarUrl(email, size), label: 'boring' })
      } else if (preferredStyle === 'ui-avatars') {
        chain.push({ url: buildUIAvatarsUrl(name || email || 'User', size), label: 'ui-avatars' })
      }

      // Always have at least initials
      if (chain.length === 0) {
        chain.push({ url: '', label: 'initials' })
      }

      if (cancelled) return

      chainRef.current = chain
      setTierIndex(0)
      setCurrentSource(chain[0] ?? null)
      setImageStatus('loading')
    })()

    return () => { cancelled = true }
  }, [email, name, explicitUrl, preferredStyle, size, retryKey])

  const handleError = useCallback(() => {
    const nextIndex = tierIndex + 1
    if (nextIndex < chainRef.current.length) {
      setTierIndex(nextIndex)
      setCurrentSource(chainRef.current[nextIndex])
      setImageStatus('loading')
    } else {
      setCurrentSource(null)
      setImageStatus('error')
    }
  }, [tierIndex])

  const handleLoad = useCallback(() => {
    setImageStatus('loaded')
  }, [])

  useEffect(() => {
    setRetryKey((prev) => prev + 1)
  }, [email, name, explicitUrl])

  return {
    avatarUrl: currentSource?.url,
    sourceLabel: currentSource?.label,
    imageStatus,
    handleError,
    handleLoad,
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   AVATAR COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
function Avatar({
  name,
  email,
  avatarUrl: explicitUrl,
  size = 32,
  preferredStyle = 'auto',
  showStatus = true,
}: {
  name: string
  email?: string
  avatarUrl?: string
  size?: number
  preferredStyle?: AvatarStyle
  showStatus?: boolean
}) {
  const { avatarUrl, imageStatus, handleError, handleLoad } = useAvatarUrl(
    email, name, explicitUrl, preferredStyle, size * 4
  )

  const initials = useMemo(() => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [name])

  const showImage = avatarUrl && imageStatus !== 'error' && avatarUrl.length > 0
  const showInitials = !avatarUrl || imageStatus === 'error' || avatarUrl === ''
  const sizeStyle = { width: size, height: size }

  return (
    <div className="relative flex-shrink-0" style={sizeStyle}>
      {/* Ambient glow while loading */}
      <AnimatePresence>
        {imageStatus === 'loading' && showImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-md"
          />
        )}
      </AnimatePresence>

      {/* Image layer */}
      {showImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={avatarUrl}
            src={avatarUrl}
            alt={name}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={handleError}
            onLoad={handleLoad}
            className={cn(
              'relative rounded-xl object-cover border border-white/[0.08]',
              'transition-opacity duration-300',
              imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
            )}
            style={sizeStyle}
          />

          {/* Skeleton shimmer while loading */}
          {imageStatus === 'loading' && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
              />
            </div>
          )}
        </>
      )}

      {/* Initials fallback */}
      {showInitials && (
        <div
          className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/25 to-violet-500/25 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          style={sizeStyle}
        >
          <span
            className="font-bold text-indigo-200 tracking-tight"
            style={{ fontSize: Math.max(size * 0.36, 10) }}
          >
            {initials}
          </span>
        </div>
      )}

      {/* Online status dot */}
      {showStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#080810] flex items-center justify-center">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
function ProfileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
function HelpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}
function KeyboardIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
  )
}
function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
function InfinityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round">
      <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
    </svg>
  )
}

/* ─── Plan Badge ─────────────────────────────────────────────────────────────── */
function PlanBadge({ plan }: { plan: Plan }) {
  const { label, cls } = PLAN_META[plan] ?? PLAN_META.free
  return (
    <span className={cn(
      'text-[8px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded-full border uppercase',
      cls
    )}>
      {label}
    </span>
  )
}

/* ─── Usage Bar ──────────────────────────────────────────────────────────────── */
function UsageBar({ used, limit, plan }: UsageData) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const remaining = isUnlimited ? Infinity : Math.max(limit - used, 0)
  const isNearLimit = !isUnlimited && percentage >= 80
  const isAtLimit = !isUnlimited && percentage >= 100

  const barColor = isAtLimit
    ? 'from-red-500 to-red-400'
    : isNearLimit
    ? 'from-amber-500 to-orange-400'
    : 'from-indigo-500 to-violet-500'

  const textColor = isAtLimit
    ? 'text-red-400'
    : isNearLimit
    ? 'text-amber-400'
    : 'text-white/25'

  if (isUnlimited) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-indigo-400/60"><InfinityIcon /></span>
        <span className="text-[10px] font-mono text-white/40">Unlimited messages</span>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={cn('text-[9px] font-mono', textColor)}>Monthly usage</span>
        <span className={cn('text-[9px] font-mono tabular-nums', textColor)}>
          {used.toLocaleString()} / {limit.toLocaleString()} msgs
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className={cn('h-full rounded-full bg-gradient-to-r', barColor)}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-white/15">{remaining.toLocaleString()} remaining</span>
        {(plan === 'free' && (isNearLimit || isAtLimit)) ? (
          <a href="/pricing" className={cn(
            'text-[9px] font-mono font-semibold transition-colors',
            isAtLimit ? 'text-red-400 hover:text-red-300' : 'text-amber-400 hover:text-amber-300'
          )}>
            {isAtLimit ? 'Upgrade now →' : 'Almost full →'}
          </a>
        ) : plan === 'free' ? (
          <a href="/pricing" className="text-[9px] font-mono text-indigo-400/60 hover:text-indigo-400 transition-colors">
            Upgrade to Pro →
          </a>
        ) : null}
      </div>
    </div>
  )
}

/* ─── Menu Item ──────────────────────────────────────────────────────────────── */
interface MenuItem {
  icon: React.ReactNode
  label: string
  onClick: () => void
  shortcut?: string
  destructive?: boolean
  external?: boolean
}

function MenuRow({ item, index, onClose }: { item: MenuItem; index: number; onClose: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.18 }}
      whileHover={{ x: 2 }}
      onClick={() => { item.onClick(); onClose() }}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'text-xs font-mono font-medium transition-all duration-150 group',
        item.destructive
          ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.08]'
          : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
      )}
    >
      <span className={cn(
        'transition-colors flex-shrink-0',
        item.destructive ? 'text-red-400/40 group-hover:text-red-400' : 'text-white/20 group-hover:text-white/60'
      )}>
        {item.icon}
      </span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.shortcut && (
        <span className="text-[9px] text-white/15 bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 rounded-md font-mono">
          {item.shortcut}
        </span>
      )}
      {item.external && (
        <span className="text-white/20 group-hover:text-white/40 transition-colors">
          <ExternalLinkIcon />
        </span>
      )}
    </motion.button>
  )
}

/* ─── Menu Panel ─────────────────────────────────────────────────────────────── */
function MenuPanel({
  user,
  usage,
  onClose,
  onProfile,
  onSettings,
  onHelp,
  onLogout,
}: {
  user: { name: string; email: string; avatarUrl?: string }
  usage: UsageData
  onClose: () => void
  onProfile?: () => void
  onSettings?: () => void
  onHelp?: () => void
  onLogout?: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, 50)
    return () => clearTimeout(id)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const topItems: MenuItem[] = [
    { icon: <ProfileIcon />, label: 'Profile', onClick: onProfile ?? (() => {}), shortcut: '⌘P' },
    { icon: <SettingsIcon />, label: 'Settings', onClick: onSettings ?? (() => {}), shortcut: '⌘,' },
    {
      icon: <KeyboardIcon />,
      label: 'Keyboard Shortcuts',
      onClick: () => { window.dispatchEvent(new CustomEvent('openShortcuts')) },
      shortcut: '⌘/',
    },
  ]

  const bottomItems: MenuItem[] = [
    { icon: <HelpIcon />, label: 'Help & Support', onClick: onHelp ?? (() => {}), external: true },
    { icon: <LogoutIcon />, label: 'Sign out', onClick: onLogout ?? (() => {}), destructive: true },
  ]

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.93, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.91, y: 6 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      style={{ transformOrigin: 'bottom left' }}
      className="absolute bottom-full left-0 right-0 mb-2 z-50"
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

      <div className="relative rounded-2xl bg-[#0e0e16]/95 border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-2xl overflow-hidden">
        <div className="px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Avatar
              name={user.name}
              email={user.email}
              avatarUrl={user.avatarUrl}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/70 truncate leading-tight">{user.name}</p>
              <p className="text-[10px] font-mono text-white/25 truncate mt-0.5">{user.email}</p>
            </div>
            <PlanBadge plan={usage.plan} />
          </div>
          <UsageBar {...usage} />
        </div>

        <div className="p-1.5">
          {topItems.map((item, i) => (
            <MenuRow key={item.label} item={item} index={i} onClose={onClose} />
          ))}
        </div>

        <div className="mx-3 h-px bg-white/[0.05]" />

        <div className="p-1.5">
          {bottomItems.map((item, i) => (
            <MenuRow key={item.label} item={item} index={topItems.length + i} onClose={onClose} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export function UserMenu({
  onProfile,
  onSettings,
  onHelp,
  avatarStyle: _avatarStyle = 'auto',
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()

  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close  = useCallback(() => setOpen(false), [])

  const plan: Plan = (user?.plan as Plan) ?? 'free'
  const messagesUsed = user?.messagesUsed ?? 0
  const messagesLimit = user?.messagesLimit ?? PLAN_LIMITS[plan]

  const usage: UsageData = { used: messagesUsed, limit: messagesLimit, plan }

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      addToast({ title: 'Signed out successfully', type: 'success' })
      router.push('/login')
    } catch (error) {
      addToast({
        title: 'Sign out failed',
        description: error instanceof Error ? error.message : 'Please try again',
        type: 'error',
      })
    }
  }, [logout, router, addToast])

  const handleProfile = useCallback(() => {
    if (onProfile) onProfile()
    else router.push('/settings/profile')
  }, [onProfile, router])

  const handleSettings = useCallback(() => {
    if (onSettings) onSettings()
    else router.push('/settings')
  }, [onSettings, router])

  const handleHelp = useCallback(() => {
    if (onHelp) onHelp()
    else window.open('https://docs.pulse-ai.dev', '_blank')
  }, [onHelp])

  if (loading) {
    return (
      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-2 w-28 bg-white/[0.03] rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="relative px-3 py-3">
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl',
          'transition-all duration-200 group',
          open
            ? 'bg-white/[0.06] border border-white/[0.1]'
            : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08]'
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        <Avatar
          name={user.name}
          email={user.email}
          avatarUrl={user.avatarUrl}
          size={32}
        />

        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-white/60 group-hover:text-white/80 truncate leading-tight transition-colors">
            {user.name}
          </p>
          <p className="text-[10px] font-mono text-white/20 truncate mt-0.5">
            {user.email}
          </p>
        </div>

        <motion.span
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ duration: 0.22 }}
          className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0"
        >
          <ChevronUpIcon />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <MenuPanel
            user={{
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl,
            }}
            usage={usage}
            onClose={close}
            onProfile={handleProfile}
            onSettings={handleSettings}
            onHelp={handleHelp}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Export Avatar so other components can reuse it ─────────────────────────── */
export { Avatar }
export type { AvatarStyle }