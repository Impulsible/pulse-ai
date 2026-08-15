// src/components/Pulse/PulseOrb.tsx
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

interface PulseOrbProps {
  size?: number
  color?: string
  speed?: number
  className?: string
}

export function PulseOrb({ size = 200, color = '#4F8CFF', speed = 2, className }: PulseOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrame: number
    let time = 0

    const animate = () => {
      time += 0.01 * speed
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw multiple waves
      for (let i = 0; i < 3; i++) {
        const waveRadius = (time * 50 + i * 30) % (size / 2)
        const alpha = 1 - (waveRadius / (size / 2))
        
        ctx.beginPath()
        ctx.arc(
          canvas.width / 2,
          canvas.height / 2,
          waveRadius,
          0,
          Math.PI * 2
        )
        ctx.strokeStyle = color
        ctx.globalAlpha = alpha * 0.5
        ctx.lineWidth = 2
        ctx.stroke()
      }
      
      ctx.globalAlpha = 1
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [size, color, speed])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={cn('pointer-events-none', className)}
    />
  )
}