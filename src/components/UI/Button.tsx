// src/components/UI/Button.tsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-pulse text-white hover:bg-[#3B6ECC]',
      secondary: 'bg-surface border border-border text-foreground hover:bg-border/50',
      outline: 'border border-border text-foreground hover:bg-border/50',
      ghost: 'text-foreground hover:bg-border/50',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
            variants[variant],
            sizes[size],
            className
          )
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'