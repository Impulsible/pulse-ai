// src/components/Pulse/PulseWave.tsx
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

interface PulseWaveProps {
  isActive?: boolean
  color?: string
  className?: string
}

export function PulseWave({ isActive = false, color = '#22D3EE', className }: PulseWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrame: number
    let audioData: number[] = Array(50).fill(0)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (isActive) {
        // Generate random waveform data
        audioData = audioData.map(() => Math.random() * canvas.height)
      } else {
        // Smooth out to flat line
        audioData = audioData.map((value) => value * 0.9)
      }

      const barWidth = canvas.width / audioData.length
      
      audioData.forEach((value, index) => {
        const x = index * barWidth
        const height = value / 2
        const y = (canvas.height - height) / 2

        ctx.fillStyle = color
        ctx.fillRect(x, y, barWidth - 1, height)
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [isActive, color])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      className={cn('pointer-events-none', className)}
    />
  )
}