const RADAR_GREEN = '#22c55e'

export function CtaRadarBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* Radar layer — vivid green, no blur */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Concentric rings */}
        {[180, 320, 480, 640].map((size) => (
          <div
            key={size}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              border: `1px solid color-mix(in srgb, ${RADAR_GREEN} 18%, transparent)`,
            }}
          />
        ))}

        {/* Cardinal cross */}
        <div
          className="absolute h-full w-px"
          style={{
            background: `color-mix(in srgb, ${RADAR_GREEN} 12%, transparent)`,
          }}
        />
        <div
          className="absolute h-px w-full"
          style={{
            background: `color-mix(in srgb, ${RADAR_GREEN} 12%, transparent)`,
          }}
        />

        {/* Center dot */}
        <div
          className="absolute h-2 w-2 rounded-full"
          style={{ background: RADAR_GREEN, opacity: 0.4 }}
        />

        {/* Rotating sweep beam with trailing glow */}
        <div
          className="absolute h-full w-full"
          style={{ animation: 'radar-sweep 8s linear infinite' }}
        >
          {/* Sweep line */}
          <div
            className="absolute left-1/2 top-1/2 h-1/2 origin-top"
            style={{
              width: 2,
              background: `linear-gradient(to bottom, ${RADAR_GREEN} 0%, transparent 100%)`,
              opacity: 0.5,
            }}
          />
          {/* Trailing glow cone */}
          <div
            className="absolute left-1/2 top-1/2 h-1/2 origin-top"
            style={{
              width: 80,
              marginLeft: -40,
              background: `conic-gradient(from -10deg, transparent, color-mix(in srgb, ${RADAR_GREEN} 10%, transparent) 8deg, transparent 15deg)`,
            }}
          />
        </div>
      </div>

      {/* Glassy frosted overlay — lets the green radar bleed through */}
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          background: `radial-gradient(circle at center,
            color-mix(in srgb, var(--card) 70%, transparent) 0%,
            color-mix(in srgb, var(--card) 85%, transparent) 40%,
            var(--card) 75%)`,
        }}
      />
    </div>
  )
}
