// src/components/UI/Input.tsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            clsx(
              'w-full px-4 py-2 rounded-lg bg-surface border text-foreground placeholder:text-muted',
              'focus:outline-none focus:ring-2 focus:ring-primary-pulse/50 focus:border-primary-pulse',
              'transition-all duration-200',
              error ? 'border-red-500' : 'border-border',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'