import { useEffect, useRef, useState } from 'react'

interface UseCountUpOptions {
  target: number
  duration?: number
  decimals?: number
  enabled?: boolean
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp({
  target,
  duration = 2000,
  decimals = 0,
  enabled = true,
}: UseCountUpOptions) {
  const [value, setValue] = useState(0)
  const hasAnimated = useRef(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled || hasAnimated.current) return

    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setValue(target)
      hasAnimated.current = true
      return
    }

    hasAnimated.current = true
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      setValue(
        decimals > 0
          ? parseFloat((eased * target).toFixed(decimals))
          : Math.round(eased * target),
      )
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [enabled, target, duration, decimals])

  return value
}
