'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useUserStore } from '../../store/userStore'
import { ErrorBoundary } from '../ui/ErrorBoundary'

// Only render on client to avoid hydration mismatch with Zustand stores
const Sidebar = dynamic(() => import('./Sidebar').then(m => m.Sidebar), { ssr: false, loading: () => <div className="hidden md:block" /> })
const BottomNav = dynamic(() => import('./BottomNav').then(m => m.BottomNav), { ssr: false, loading: () => <div className="md:hidden" /> })

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const theme = useUserStore(s => s.theme)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme')
      document.documentElement.classList.remove('dark-theme')
    } else {
      document.documentElement.classList.add('dark-theme')
      document.documentElement.classList.remove('light-theme')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <BottomNav />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
