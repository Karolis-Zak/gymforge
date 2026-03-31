import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const variantMap = {
  default: 'bg-background-card border border-white/10 rounded-2xl shadow-card',
  elevated: 'bg-background-elevated border border-white/10 rounded-2xl shadow-card',
  interactive: 'bg-background-card border border-white/10 rounded-2xl shadow-card hover-lift cursor-pointer hover:border-primary/30',
}

export function Card({ children, className = '', variant = 'default', padding = 'md' }: CardProps) {
  return (
    <div className={`${variantMap[variant]} ${paddingMap[padding]} ${className}`}>
      {children}
    </div>
  )
}
