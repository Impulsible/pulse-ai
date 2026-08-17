// src/components/Pulse/PulseOrb.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/utils/cn'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
export type OrbVariant = 'waves' | 'particles' | 'ripples' | 'nebula'

interface PulseOrbProps {
  size?: number
  color?: string
  colorSecondary?: string
  speed?: number
  state?: OrbState
  variant?: OrbVariant
  className?: string
  /** Enables mouse-follow interaction */
  interactive?: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STATE-BASED COLOR CONFIG
   ═══════════════════════════════════════════════════════════════════════════════ */

const STATE_COLORS: Record<OrbState, { primary: string; secondary: string; speed: number }> = {
  idle:      { primary: '#6366f1', secondary: '#8b5cf6', speed: 0.6 },
  listening: { primary: '#10b981', secondary: '#22d3ee', speed: 1.5 },
  thinking:  { primary: '#8b5cf6', secondary: '#ec4899', speed: 1.0 },
  speaking:  { primary: '#3b82f6', secondary: '#6366f1', speed: 1.8 },
  error:     { primary: '#ef4444', secondary: '#f97316', speed: 2.2 },
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function PulseOrb({
  size = 200,
  color,
  colorSecondary,
  speed,
  state = 'idle',
  variant = 'waves',
  className,
  interactive = false,
}: PulseOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const animationRef = useRef<number>(0)
  const dprRef = useRef(1)

  const stateCfg = STATE_COLORS[state]
  const primary = color ?? stateCfg.primary
  const secondary = colorSecondary ?? stateCfg.secondary
  const animSpeed = speed ?? stateCfg.speed

  /* ─── Mouse tracking for interactive mode ────────────────────────── */
  useEffect(() => {
    if (!interactive || !containerRef.current) return
    const el = containerRef.current

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      }
    }

    const handleLeave = () => {
      mouseRef.current = { x: 0.5, y: 0.5 }
    }

    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [interactive])

  /* ─── DPR-aware canvas setup ─────────────────────────────────────── */
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)
    return ctx
  }, [size])

  /* ─── Render loop ────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = setupCanvas()
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    let time = 0

    const drawWaves = () => {
      const waveCount = 4
      for (let i = 0; i < waveCount; i++) {
        const progress = ((time + i * 0.3) % 3) / 3
        const radius = progress * (size / 2)
        const alpha = (1 - progress) * 0.6

        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius)
        gradient.addColorStop(0, `${primary}00`)
        gradient.addColorStop(0.5, primary)
        gradient.addColorStop(1, `${secondary}00`)

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = gradient
        ctx.globalAlpha = alpha
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Inner core
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 4)
      coreGradient.addColorStop(0, primary)
      coreGradient.addColorStop(0.5, `${primary}80`)
      coreGradient.addColorStop(1, `${primary}00`)

      ctx.globalAlpha = 0.4 + Math.sin(time * 2) * 0.2
      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, size / 4, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawParticles = () => {
      const particleCount = 40
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.5
        const orbitRadius = size / 3 + Math.sin(time * 2 + i) * (size / 8)
        const px = centerX + Math.cos(angle) * orbitRadius
        const py = centerY + Math.sin(angle) * orbitRadius
        const particleSize = 1 + Math.sin(time * 3 + i) * 1.5

        ctx.globalAlpha = 0.6 + Math.sin(time * 2 + i * 0.5) * 0.4
        ctx.fillStyle = i % 2 === 0 ? primary : secondary
        ctx.beginPath()
        ctx.arc(px, py, particleSize, 0, Math.PI * 2)
        ctx.fill()

        // Glow
        ctx.globalAlpha = 0.2
        ctx.beginPath()
        ctx.arc(px, py, particleSize * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawRipples = () => {
      const rippleCount = 6
      for (let i = 0; i < rippleCount; i++) {
        const progress = ((time * 0.5 + i * 0.15) % 1)
        const radius = progress * (size / 2)
        const alpha = (1 - progress) * 0.5

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = i % 2 === 0 ? primary : secondary
        ctx.globalAlpha = alpha
        ctx.lineWidth = 2 - progress * 1.5
        ctx.stroke()
      }
    }

    const drawNebula = () => {
      const nebulaCount = 3
      for (let i = 0; i < nebulaCount; i++) {
        const angle = time * 0.3 + (i * Math.PI * 2) / nebulaCount
        const offsetX = Math.cos(angle) * (size / 8)
        const offsetY = Math.sin(angle) * (size / 8)

        const gradient = ctx.createRadialGradient(
          centerX + offsetX,
          centerY + offsetY,
          0,
          centerX + offsetX,
          centerY + offsetY,
          size / 3
        )
        gradient.addColorStop(0, `${i % 2 === 0 ? primary : secondary}80`)
        gradient.addColorStop(1, 'transparent')

        ctx.globalAlpha = 0.5
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX + offsetX, centerY + offsetY, size / 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const animate = () => {
      time += 0.016 * animSpeed
      ctx.clearRect(0, 0, size, size)

      // Interactive mouse shift
      if (interactive) {
        const targetX = mouseRef.current.x * size
        const targetY = mouseRef.current.y * size
        const shiftX = (targetX - centerX) * 0.05
        const shiftY = (targetY - centerY) * 0.05
        ctx.save()
        ctx.translate(shiftX, shiftY)
      }

      switch (variant) {
        case 'waves':     drawWaves(); break
        case 'particles': drawParticles(); break
        case 'ripples':   drawRipples(); break
        case 'nebula':    drawNebula(); break
      }

      if (interactive) ctx.restore()
      ctx.globalAlpha = 1

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationRef.current)
  }, [size, primary, secondary, animSpeed, variant, interactive, setupCanvas])

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)} style={{ width: size, height: size }}>
      {/* Glow halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-colors duration-500"
        style={{ background: `radial-gradient(circle, ${primary}, transparent 70%)` }}
      />
      <canvas ref={canvasRef} className="pointer-events-none relative" aria-hidden="true" />
    </div>
  )
}