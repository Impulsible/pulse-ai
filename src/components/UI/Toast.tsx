// src/components/UI/Toast.tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '@/utils/cn'

interface Toast {
  id: string
  title: string
  description?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const typeStyles = {
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    info: 'border-primary-pulse/50 bg-primary-pulse/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
  }

  const typeIcons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  return (
    <div
      className={cn(
        'min-w-[300px] rounded-lg border backdrop-blur-sm',
        'animate-in',
        typeStyles[toast.type || 'info']
      )}
    >
      <div className="flex items-start justify-between p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">{typeIcons[toast.type || 'info']}</span>
          <div>
            <h4 className="font-medium text-foreground">{toast.title}</h4>
            {toast.description && (
              <p className="text-sm text-muted mt-1">{toast.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}