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

      {/* Noise grain texture */}
      <svg
        className={`absolute inset-0 h-full w-full ${subtle ? 'opacity-[0.015]' : 'opacity-[0.03]'}`}
        style={{ mixBlendMode: 'overlay' }}
        aria-hidden="true"
      >
        <filter id="marketing-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#marketing-noise)" />
      </svg>

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, oklch(0.14 0.025 245) 100%)',
          opacity: 0.6,
        }}
      />
    </div>
  )
}
