'use client'

import React, { useEffect, useState } from 'react'
import { LayoutShell } from './LayoutShell'

/**
 * Root layout wrapper that ensures client-side hydration is complete
 * before rendering components that depend on Zustand stores with localStorage.
 *
 * REAL ISSUE FIXED:
 * - LayoutShell calls useUserStore() which depends on localStorage
 * - localStorage is not available on server, so store uses defaults
 * - localStorage IS available on client, so store loads persisted values
 * - This causes Zustand state to differ between server and client renders
 * - Result: React hydration error #310 ("Rendered more hooks...")
 *
 * SOLUTION:
 * - Render a server-safe placeholder initially
 * - Wait for useEffect to run (client-only)
 * - Then render LayoutShell after Zustand stores are hydrated from localStorage
 */
export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Now Zustand stores have loaded from localStorage
    setHydrated(true)
  }, [])

  // Before hydration: render a placeholder that matches server-rendered HTML
  // This prevents hydration mismatches since both server and client render the same thing
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background" suppressHydrationWarning>
        <div className="hidden md:block" /> {/* Sidebar placeholder */}
        <div className="md:hidden" /> {/* BottomNav placeholder */}
        <main className="md:ml-64 pb-[calc(10rem_+_env(safe-area-inset-bottom))] md:pb-0 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // After hydration: render the real layout with Zustand stores initialized
  return <LayoutShell>{children}</LayoutShell>
}
