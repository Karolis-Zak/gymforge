/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0a0a0f',
          card: '#13131a',
          elevated: '#1a1a2e',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.05)',
          hover: 'rgba(255,255,255,0.08)',
          active: 'rgba(255,255,255,0.12)',
        },
        primary: {
          DEFAULT: '#00d4ff',
          dark: '#0891b2',
          light: '#67e8f9',
          glow: 'rgba(0,212,255,0.15)',
        },
        accent: {
          DEFAULT: '#a855f7',
          dark: '#7c3aed',
          light: '#c084fc',
          glow: 'rgba(168,85,247,0.15)',
        },
        success: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        text: {
          primary: '#ffffff',
          secondary: '#94a3b8',
          muted: '#475569',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0,212,255,0.15)',
        'glow-accent': '0 0 20px rgba(168,85,247,0.15)',
        'glow-success': '0 0 20px rgba(34,197,94,0.15)',
        card: '0 4px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00d4ff, #0891b2)',
        'gradient-accent': 'linear-gradient(135deg, #a855f7, #7c3aed)',
        'gradient-mixed': 'linear-gradient(135deg, #00d4ff, #a855f7)',
        'gradient-success': 'linear-gradient(135deg, #22c55e, #16a34a)',
        'gradient-danger': 'linear-gradient(135deg, #ef4444, #dc2626)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,212,255,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(0,212,255,0.4)' },
        },
      },
    },
  },
  plugins: [],
}
