export function AnimatedBackdrop({ subtle }: { subtle?: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
      {/* Layer 1 — Gradient orbs (hidden on text-heavy pages) */}
      {!subtle && (
        <>
          <div className="absolute -top-64 -right-64 h-[500px] w-[500px] rounded-full bg-accent opacity-[0.07] blur-3xl motion-safe:animate-float-1" />
          <div className="absolute -bottom-64 -left-64 h-[500px] w-[500px] rounded-full bg-primary opacity-[0.07] blur-3xl motion-safe:animate-float-2" />
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aviation-sky opacity-[0.07] blur-3xl motion-safe:animate-float-3" />
        </>
      )}

      {/* Layer 2 — Dot grid pattern */}
      <div
        className={`absolute inset-0 ${subtle ? 'opacity-[0.025]' : 'opacity-[0.04]'}`}
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Layer 3 — Top-edge gradient fade (skip on text-heavy pages) */}
      {!subtle && (
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/5 to-transparent" />
      )}
    </div>
  )
}
