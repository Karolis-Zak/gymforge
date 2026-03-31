'use client'

import React from 'react'

interface SelectionCardProps {
  icon?: React.ReactNode
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SelectionCard({ icon, label, description, selected, onClick, size = 'md', className = '' }: SelectionCardProps) {
  const sizeStyles = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3',
    lg: 'px-5 py-5',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-3 rounded-2xl border transition-all duration-200 text-left w-full
        ${sizeStyles[size]}
        ${selected
          ? 'bg-primary/10 border-primary/30 shadow-glow text-text-primary'
          : 'bg-background-card border-white/10 text-text-secondary hover:bg-white/5 hover:border-white/20'
        }
        ${className}
      `}
    >
      {icon && (
        <span className={`flex-shrink-0 text-xl ${selected ? 'text-primary' : 'text-text-muted'}`}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <span className={`block font-medium text-sm ${selected ? 'text-text-primary' : ''}`}>{label}</span>
        {description && (
          <span className="block text-xs text-text-muted mt-0.5">{description}</span>
        )}
      </div>
      {selected && (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  )
}

// Pill-style toggle for smaller selections
interface PillToggleProps {
  label: string
  selected: boolean
  onClick: () => void
  className?: string
}

export function PillToggle({ label, selected, onClick, className = '' }: PillToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
        ${selected
          ? 'bg-primary/15 text-primary border-primary/30'
          : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10 hover:text-text-secondary'
        }
        ${className}
      `}
    >
      {label}
    </button>
  )
}

// Day circle toggle
interface DayToggleProps {
  day: string
  label: string
  selected: boolean
  onClick: () => void
}

export function DayToggle({ day, label, selected, onClick }: DayToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-10 h-10 sm:w-11 sm:h-11 rounded-full text-xs font-bold transition-all duration-200 border
        ${selected
          ? 'bg-primary/20 text-primary border-primary/30 shadow-glow'
          : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
        }
      `}
    >
      {label}
    </button>
  )
}

// Number card for days per week
interface NumberCardProps {
  value: number
  subtitle?: string
  selected: boolean
  onClick: () => void
}

export function NumberCard({ value, subtitle, selected, onClick }: NumberCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all duration-200
        ${selected
          ? 'bg-primary/10 border-primary/30 shadow-glow'
          : 'bg-background-card border-white/10 hover:bg-white/5'
        }
      `}
    >
      <span className={`text-2xl font-display font-bold ${selected ? 'text-primary' : 'text-text-primary'}`}>{value}</span>
      {subtitle && <span className="text-[9px] text-text-muted mt-0.5">{subtitle}</span>}
    </button>
  )
}
