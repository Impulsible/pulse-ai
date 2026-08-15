// src/components/UI/Dropdown.tsx
import { useState, useRef, useEffect } from 'react'

export type DropdownItem = {
  label: string
  onClick?: () => void
  icon?: React.ReactNode
  disabled?: boolean
} | {
  divider: true
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  className?: string
}

// Type guard to check if item is a divider
function isDivider(item: DropdownItem): item is { divider: true } {
  return 'divider' in item && item.divider === true
}

// Type guard to check if item has a label (is a regular item)
function isRegularItem(item: DropdownItem): item is {
  label: string
  onClick?: () => void
  icon?: React.ReactNode
  disabled?: boolean
} {
  return 'label' in item
}

export function Dropdown({ trigger, items, position = 'bottom-left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-1',
    'bottom-right': 'top-full right-0 mt-1',
    'top-left': 'bottom-full left-0 mb-1',
    'top-right': 'bottom-full right-0 mb-1',
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={`absolute ${positionClasses[position]} min-w-[200px] bg-surface border border-border rounded-lg shadow-lg py-1 z-50`}>
          {items.map((item, index) => {
            // Check if it's a divider
            if (isDivider(item)) {
              return <hr key={`divider-${index}`} className="my-1 border-border" />
            }
            
            // Check if it's a regular item with label
            if (isRegularItem(item)) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick?.()
                    setIsOpen(false)
                  }}
                  disabled={item.disabled}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-border/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            }
            
            // Fallback (should never happen)
            return null
          })}
        </div>
      )}
    </div>
  )
}