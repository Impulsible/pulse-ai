// src/components/UI/Card.tsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline'
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface border border-border',
      glass: 'glass',
      outline: 'bg-transparent border border-border',
    }

    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-lg transition-all duration-200',
            variants[variant],
            hover && 'hover:border-primary-pulse/50 hover:shadow-lg',
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'