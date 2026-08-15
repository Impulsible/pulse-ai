/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/showcase/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { Card } from '@/components/UI/Card'
import { Modal } from '@/components/UI/Modal'
import { Dropdown } from '@/components/UI/Dropdown'
import { Tooltip } from '@/components/UI/Tooltip'
import { ToastProvider, useToast } from '@/components/UI/Toast'
import { PulseRobot } from '@/components/Pulse/PulseRobot'
import { PulseOrb } from '@/components/Pulse/PulseOrb'
import { PulseGlow } from '@/components/Pulse/PulseGlow'
import { PulseWave } from '@/components/Pulse/PulseWave'
import { PulseStatus } from '@/components/Pulse/PulseStatus'

function ShowcaseContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pulseState, setPulseState] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'error'>('idle')
  const { addToast } = useToast()

  const dropdownItems = [
    { 
      label: 'Profile', 
      onClick: () => addToast({ title: 'Profile clicked', type: 'info' as const }) 
    },
    { 
      label: 'Settings', 
      onClick: () => addToast({ title: 'Settings clicked', type: 'info' as const }) 
    },
    { 
      label: 'Logout', 
      onClick: () => addToast({ title: 'Logged out', type: 'success' as const }) 
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <h1 className="text-4xl font-bold text-gradient">Pulse AI Design System</h1>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Inputs</h2>
          <div className="max-w-md space-y-4">
            <Input placeholder="Regular input" />
            <Input label="With Label" placeholder="Labeled input" />
            <Input label="With Error" placeholder="Error state" error="This field is required" />
            <Input placeholder="Disabled input" disabled />
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">Default Card</Card>
            <Card variant="glass" className="p-6">Glass Card</Card>
            <Card variant="outline" className="p-6" hover>Hover Card</Card>
          </div>
        </section>

        {/* Modals */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Modals</h2>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
          >
            <p className="text-muted">
              This is a modal dialog. Press ESC or click outside to close.
            </p>
          </Modal>
        </section>

        {/* Dropdowns */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Dropdowns</h2>
          <Dropdown
            trigger={<Button variant="outline">Open Menu</Button>}
            items={dropdownItems}
          />
        </section>

        {/* Tooltips */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Tooltips</h2>
          <div className="flex gap-4">
            <Tooltip content="Top tooltip" position="top">
              <Button variant="outline">Hover Top</Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" position="bottom">
              <Button variant="outline">Hover Bottom</Button>
            </Tooltip>
            <Tooltip content="Left tooltip" position="left">
              <Button variant="outline">Hover Left</Button>
            </Tooltip>
            <Tooltip content="Right tooltip" position="right">
              <Button variant="outline">Hover Right</Button>
            </Tooltip>
          </div>
        </section>

        {/* Toasts */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Toasts</h2>
          <div className="flex gap-4">
            <Button onClick={() => addToast({ title: 'Success!', description: 'Operation completed', type: 'success' as const })}>
              Success Toast
            </Button>
            <Button onClick={() => addToast({ title: 'Error!', description: 'Something went wrong', type: 'error' as const })}>
              Error Toast
            </Button>
            <Button onClick={() => addToast({ title: 'Info', description: 'Just so you know', type: 'info' as const })}>
              Info Toast
            </Button>
            <Button onClick={() => addToast({ title: 'Warning', description: 'Be careful', type: 'warning' as const })}>
              Warning Toast
            </Button>
          </div>
        </section>

        {/* Pulse Components */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Pulse Components</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg">Robot States</h3>
            <div className="flex gap-8 items-center">
              <div className="flex flex-col items-center gap-2">
                <PulseRobot state="idle" />
                <span className="text-sm text-muted">Idle</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseRobot state="listening" />
                <span className="text-sm text-muted">Listening</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseRobot state="thinking" />
                <span className="text-sm text-muted">Thinking</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseRobot state="speaking" />
                <span className="text-sm text-muted">Speaking</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseRobot state="error" />
                <span className="text-sm text-muted">Error</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg">Pulse Orb</h3>
            <div className="relative inline-block">
              <PulseOrb size={200} />
              <div className="absolute inset-0 flex items-center justify-center">
                <PulseRobot size="sm" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg">Pulse Wave</h3>
            <PulseWave isActive={pulseState === 'speaking'} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg">Pulse Status</h3>
            <div className="space-y-2">
              <PulseStatus state={pulseState} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setPulseState('idle')}>Idle</Button>
                <Button size="sm" onClick={() => setPulseState('listening')}>Listening</Button>
                <Button size="sm" onClick={() => setPulseState('thinking')}>Thinking</Button>
                <Button size="sm" onClick={() => setPulseState('speaking')}>Speaking</Button>
                <Button size="sm" onClick={() => setPulseState('error')}>Error</Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function ShowcasePage() {
  return (
    <ToastProvider>
      <ShowcaseContent />
    </ToastProvider>
  )
}