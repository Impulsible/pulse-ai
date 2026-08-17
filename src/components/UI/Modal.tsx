// src/components/UI/Modal.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: ModalSize
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  hideHeader?: boolean
  footer?: React.ReactNode
  className?: string
}

const SIZES: Record<ModalSize, string> = {
  xs:   'max-w-sm',
  sm:   'max-w-md',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
}

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  hideHeader = false,
  footer,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, closeOnEscape, onClose])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = originalOverflow }
    }
  }, [isOpen])

  // Focus trap (basic — auto-focus modal on open)
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) onClose()
  }, [closeOnOverlayClick, onClose])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className={clsx(
              'relative w-full',
              SIZES[size],
              size === 'full' ? 'overflow-hidden' : '',
              'rounded-2xl',
              'bg-[#0a0a12]/95 backdrop-blur-2xl',
              'border border-white/[0.08]',
              'shadow-[0_25px_80px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)]',
              'overflow-hidden',
              'focus:outline-none',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top glint */}
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent pointer-events-none" />

            {/* Radial glow behind header */}
            <div
              className="absolute inset-x-0 top-0 h-40 pointer-events-none opacity-50"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12), transparent 70%)',
              }}
            />

            {/* Header */}
            {!hideHeader && (title || showCloseButton) && (
              <div className="relative flex items-start justify-between gap-4 p-5 pb-4 border-b border-white/[0.06]">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-[16px] font-bold text-white/95 tracking-tight leading-tight"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-[12px] text-white/50 mt-1 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-white/40 hover:text-white/80 transition-colors"
                    aria-label="Close modal"
                  >
                    <CloseIcon />
                  </motion.button>
                )}
              </div>
            )}

            {/* Body */}
            <div className={clsx(
              'relative px-5 py-4',
              size === 'full' && 'overflow-y-auto max-h-[calc(95vh-140px)]'
            )}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="relative flex items-center justify-end gap-2 p-5 pt-4 border-t border-white/[0.06] bg-white/[0.01]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export type { ModalProps, ModalSize }