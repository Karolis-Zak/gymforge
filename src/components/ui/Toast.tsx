'use client'

import React, { useEffect } from 'react'
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi'

interface ToastProps {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
  onDismiss: (id: string) => void
  duration?: number
}

export function Toast({ id, message, type, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  const styles = {
    error: { bg: 'bg-danger/10', border: 'border-danger/20', text: 'text-danger', icon: FiAlertCircle },
    success: { bg: 'bg-success/10', border: 'border-success/20', text: 'text-success', icon: FiCheckCircle },
    info: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', icon: FiInfo },
  }

  const style = styles[type]
  const IconComponent = style.icon

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-3 animate-fade-in max-w-sm`}>
      <IconComponent className={`${style.text} flex-shrink-0 mt-0.5`} size={18} />
      <p className={`${style.text} text-sm flex-1`}>{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <FiX size={16} />
      </button>
    </div>
  )
}
