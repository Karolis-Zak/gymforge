import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variantStyles = {
  primary: 'bg-gradient-primary text-white font-semibold shadow-glow hover:shadow-[0_0_30px_rgba(0,212,255,0.25)] active:scale-[0.98]',
  secondary: 'bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 hover:text-text-primary hover:border-white/20',
  danger: 'bg-gradient-danger text-white font-semibold hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-[0.98]',
  success: 'bg-gradient-success text-white font-semibold hover:shadow-glow-success active:scale-[0.98]',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 transition-all duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
