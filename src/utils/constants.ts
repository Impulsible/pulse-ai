// src/utils/constants.ts
export const PULSE_COLORS = {
  background: '#070B14',
  surface: '#101827',
  primaryPulse: '#4F8CFF',
  secondaryPulse: '#22D3EE',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#1E293B',
} as const

export const PULSE_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error',
} as const

export type PulseState = typeof PULSE_STATES[keyof typeof PULSE_STATES]