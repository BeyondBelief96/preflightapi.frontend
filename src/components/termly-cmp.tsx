'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'

const SCRIPT_SRC_BASE = 'https://app.termly.io'

declare global {
  interface Window {
    Termly?: { initialize: () => void }
  }
}

export function TermlyCMP({
  websiteUUID,
  autoBlock,
}: {
  websiteUUID: string
  autoBlock?: boolean
}) {
  const scriptSrc = useMemo(() => {
    const url = new URL(SCRIPT_SRC_BASE)
    url.pathname = `/resource-blocker/${websiteUUID}`
    if (autoBlock) {
      url.searchParams.set('autoBlock', 'on')
    }
    return url.toString()
  }, [autoBlock, websiteUUID])

  const isScriptAdded = useRef(false)

  useEffect(() => {
    if (isScriptAdded.current) return
    const script = document.createElement('script')
    script.src = scriptSrc
    document.head.appendChild(script)
    isScriptAdded.current = true
  }, [scriptSrc])

  const { pathname } = useLocation()

  useEffect(() => {
    window.Termly?.initialize()
  }, [pathname])

  return null
}
