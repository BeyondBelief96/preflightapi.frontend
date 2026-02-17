import { Suspense } from 'react'
import { TerrainFlyover } from './terrain-flyover'

export function AnimatedBackdrop({ subtle }: { subtle?: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
      {/* Three.js star field (lazy-loaded, client-only) */}
      {!subtle && (
        <Suspense fallback={null}>
          <TerrainFlyover />
        </Suspense>
      )}

      {/* Gradient orbs for color wash */}
      {!subtle && (
        <>
          <div className="absolute -top-64 -right-64 h-[600px] w-[600px] rounded-full bg-accent opacity-[0.05] blur-3xl motion-safe:animate-float-1" />
          <div className="absolute -bottom-64 -left-64 h-[600px] w-[600px] rounded-full bg-primary opacity-[0.05] blur-3xl motion-safe:animate-float-2" />
        </>
      )}

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, var(--background) 100%)',
          opacity: 0.6,
        }}
      />
    </div>
  )
}
