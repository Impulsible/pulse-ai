/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Sidebar/SearchChats.tsx
'use client'

import { Input } from '@/components/UI/Input'

interface SearchChatsProps {
  value: string
  onChange: (value: string) => void
}

export function SearchChats({ value, onChange }: SearchChatsProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search conversations..."
        className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-pulse"
      />
    </div>
  )
}