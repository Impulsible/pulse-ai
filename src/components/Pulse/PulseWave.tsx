// src/components/Pulse/PulseWave.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/utils/cn'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export type WaveVariant = 'bars' | 'wave' | 'siri' | 'dots'

interface PulseWaveProps {
  isActive?: boolean
  color?: string
  colorSecondary?: string
  variant?: WaveVariant
  width?: number
  height?: number
  barCount?: number
  className?: string
  /** Optional: pass in real audio analyser data for reactive visualization */
  audioData?: Uint8Array | null
  /** Smoothness of animation (0-1, higher = more smoothing) */
  smoothing?: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function PulseWave({
  isActive = false,
  color = '#6366f1',
  colorSecondary = '#8b5cf6',
  variant = 'bars',
  width = 240,
  height = 48,
  barCount = 32,
  className,
  audioData = null,
  smoothing = 0.7,
}: PulseWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dataRef = useRef<number[]>(Array(barCount).fill(0))
  const targetRef = useRef<number[]>(Array(barCount).fill(0))
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)

  /* ─── DPR-aware canvas ────────────────────────────────────────────── */
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    return ctx
  }, [width, height])

  /* ─── Animation loop ──────────────────────────────────────────────── */
  useEffect(() => {
    const ctx = setupCanvas()
    if (!ctx) return

    const render = () => {
      timeRef.current += 0.02
      ctx.clearRect(0, 0, width, height)

      // Update target values
      if (isActive) {
        if (audioData && audioData.length > 0) {
          // Real audio data
          const step = Math.floor(audioData.length / barCount)
          for (let i = 0; i < barCount; i++) {
            const sum = audioData
              .slice(i * step, (i + 1) * step)
              .reduce((a, b) => a + b, 0)
            targetRef.current[i] = (sum / step / 255) * height
          }
        } else {
          // Simulated audio: smooth sine waves + noise
          for (let i = 0; i < barCount; i++) {
            const phase = (i / barCount) * Math.PI * 2
            const base = Math.sin(timeRef.current * 3 + phase) * 0.5 + 0.5
            const noise = Math.random() * 0.35
            const envelope = Math.sin((i / barCount) * Math.PI) // taper edges
            targetRef.current[i] = (base + noise) * envelope * height * 0.9
          }
        }
      } else {
        targetRef.current.fill(0)
      }

      // Smooth interpolation toward target
      for (let i = 0; i < barCount; i++) {
        dataRef.current[i] =
          dataRef.current[i] * smoothing +
          targetRef.current[i] * (1 - smoothing)
      }

      // Render based on variant
      switch (variant) {
        case 'bars':   renderBars(ctx); break
        case 'wave':   renderWave(ctx); break
        case 'siri':   renderSiri(ctx); break
        case 'dots':   renderDots(ctx); break
      }

      animationRef.current = requestAnimationFrame(render)
    }

    const renderBars = (ctx: CanvasRenderingContext2D) => {
      const barWidth = width / barCount
      const gap = Math.max(1, barWidth * 0.25)

      dataRef.current.forEach((value, i) => {
        const x = i * barWidth + gap / 2
        const barH = Math.max(2, value)
        const y = (height - barH) / 2

        const gradient = ctx.createLinearGradient(x, y, x, y + barH)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, colorSecondary)

        ctx.fillStyle = gradient
        // Rounded rect
        const w = barWidth - gap
        const r = Math.min(w / 2, 3)
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + w, y, x + w, y + barH, r)
        ctx.arcTo(x + w, y + barH, x, y + barH, r)
        ctx.arcTo(x, y + barH, x, y, r)
        ctx.arcTo(x, y, x + w, y, r)
        ctx.closePath()
        ctx.fill()

        // Glow
        ctx.shadowBlur = 8
        ctx.shadowColor = color
        ctx.globalAlpha = 0.4
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      })
    }

    const renderWave = (ctx: CanvasRenderingContext2D) => {
      const midY = height / 2

      const drawWave = (offset: number, strokeColor: string, alpha: number) => {
        ctx.beginPath()
        ctx.strokeStyle = strokeColor
        ctx.globalAlpha = alpha
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        dataRef.current.forEach((value, i) => {
          const x = (i / (barCount - 1)) * width
          const y = midY + Math.sin(i * 0.5 + timeRef.current * 2 + offset) * value * 0.5
          if (i === 0) ctx.moveTo(x, y)
          else {
            const prevX = ((i - 1) / (barCount - 1)) * width
            const prevY = midY + Math.sin((i - 1) * 0.5 + timeRef.current * 2 + offset) * dataRef.current[i - 1] * 0.5
            const cpx = (prevX + x) / 2
            const cpy = (prevY + y) / 2
            ctx.quadraticCurveTo(prevX, prevY, cpx, cpy)
          }
        })
        ctx.stroke()
      }

      drawWave(0, color, 0.9)
      drawWave(Math.PI, colorSecondary, 0.5)
      ctx.globalAlpha = 1
    }

    const renderSiri = (ctx: CanvasRenderingContext2D) => {
      // Multiple overlapping sine waves that undulate
      const midY = height / 2
      const layers = [
        { color, amp: 0.9, freq: 0.02, offset: 0 },
        { color: colorSecondary, amp: 0.65, freq: 0.03, offset: Math.PI / 3 },
        { color: '#38bdf8', amp: 0.45, freq: 0.04, offset: Math.PI / 1.5 },
      ]

      const globalAmplitude = isActive
        ? 0.5 + Math.sin(timeRef.current * 2) * 0.5
        : 0.05

      layers.forEach(({ color: c, amp, freq, offset }) => {
        ctx.beginPath()
        ctx.strokeStyle = c
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.globalAlpha = 0.7

        for (let x = 0; x <= width; x++) {
          const wave = Math.sin(x * freq + timeRef.current * 3 + offset)
          const envelope = Math.sin((x / width) * Math.PI)
          const y = midY + wave * envelope * amp * (height / 2.5) * globalAmplitude
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Glow layer
        ctx.shadowBlur = 12
        ctx.shadowColor = c
        ctx.globalAlpha = 0.3
        ctx.stroke()
        ctx.shadowBlur = 0
      })
      ctx.globalAlpha = 1
    }

    const renderDots = (ctx: CanvasRenderingContext2D) => {
      const spacing = width / barCount
      dataRef.current.forEach((value, i) => {
        const x = i * spacing + spacing / 2
        const y = height / 2
        const radius = Math.max(1.5, (value / height) * 8)

        // Dot
        ctx.fillStyle = i % 2 === 0 ? color : colorSecondary
        ctx.globalAlpha = 0.9
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()

        // Glow
        ctx.shadowBlur = 10
        ctx.shadowColor = ctx.fillStyle as string
        ctx.globalAlpha = 0.5
        ctx.fill()
        ctx.shadowBlur = 0
      })
      ctx.globalAlpha = 1
    }

    render()
    return () => cancelAnimationFrame(animationRef.current)
  }, [
    isActive,
    color,
    colorSecondary,
    variant,
    width,
    height,
    barCount,
    audioData,
    smoothing,
    setupCanvas,
  ])

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block', className)}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        aria-hidden="true"
      />
    </div>
  )
}