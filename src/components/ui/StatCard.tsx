import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'primary' | 'accent' | 'success' | 'warning'
  className?: string
}

const colorMap = {
  primary: 'border-primary/20 shadow-glow',
  accent: 'border-accent/20 shadow-glow-accent',
  success: 'border-success/20 shadow-glow-success',
  warning: 'border-warning/20',
}

const textColorMap = {
  primary: 'text-primary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
}

export function StatCard({ title, value, subtitle, icon, color = 'primary', className = '' }: StatCardProps) {
  return (
    <div className={`bg-background-card border border-white/10 rounded-2xl p-5 ${colorMap[color]} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</span>
        {icon && <span className={`${textColorMap[color]} text-lg`}>{icon}</span>}
      </div>
      <div className={`text-2xl font-bold font-display ${textColorMap[color]}`}>{value}</div>
      {subtitle && <div className="text-xs text-text-muted mt-1">{subtitle}</div>}
    </div>
  )
}
