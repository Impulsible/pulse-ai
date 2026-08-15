// src/hooks/useScrollAnimation.ts
'use client'

import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

export function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (isInView) {
      ref.current?.classList.add('animate-in')
    }
  }, [isInView])

  return ref
}