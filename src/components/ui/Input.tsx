import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
          text-text-primary placeholder:text-text-muted
          focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
          focus:shadow-[0_0_15px_rgba(0,212,255,0.1)]
          transition-all duration-200
          ${error ? 'border-danger/50 focus:border-danger/50 focus:ring-danger/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
          text-text-primary
          focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
          transition-all duration-200
          ${className}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-background-card">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
