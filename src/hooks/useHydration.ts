'use client'

import { useState, useEffect } from 'react'

/**
 * Returns true once the client has hydrated and Zustand stores
 * have loaded from localStorage. Use this to prevent rendering
 * stale server-side state.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}
