import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles = {
  primary: 'bg-primary/15 text-primary border-primary/20',
  accent: 'bg-accent/15 text-accent border-accent/20',
  success: 'bg-success/15 text-success border-success/20',
  danger: 'bg-danger/15 text-danger border-danger/20',
  warning: 'bg-warning/15 text-warning border-warning/20',
  neutral: 'bg-white/5 text-text-secondary border-white/10',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  )
}
