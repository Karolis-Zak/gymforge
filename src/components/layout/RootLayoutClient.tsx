'use client'

import React, { useEffect, useState } from 'react'
import { LayoutShell } from './LayoutShell'

/**
 * Root layout wrapper that ensures client-side hydration is complete
 * before rendering the layout shell. This prevents hydration mismatches
 * when using Zustand stores with localStorage.
 */
export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until client is mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return <LayoutShell>{children}</LayoutShell>
}
