'use client'

import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'

declare global {
  interface Window {
    Termly?: { initialize: () => void }
  }
}

/**
 * Re-initializes Termly on client-side route changes.
 * The Termly resource-blocker script itself is loaded via the
 * root route's `head()` so it appears first in <head>.
 */
export function TermlyRouteSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.Termly?.initialize()
  }, [pathname])

  return null
}
