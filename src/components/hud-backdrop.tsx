const PRIMARY = 'oklch(0.65 0.15 235)'
const RADAR_GREEN = 'oklch(0.5 0.14 150)'
const DARK = 'oklch(0.07 0.02 245)'

// Blips positioned as offsets from center (%).
// Delay = angle-from-north / 360 * 12s so they flash when the sweep passes.
const BLIPS = [
  { x: 25, y: -18, delay: '1.8s' },
  { x: -15, y: -30, delay: '11.1s' },
  { x: 35, y: 10, delay: '3.5s' },
  { x: -28, y: 15, delay: '8.1s' },
  { x: 10, y: -38, delay: '0.5s' },
  { x: -35, y: -8, delay: '9.4s' },
] as const

export function DashboardBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      style={{ backgroundColor: 'oklch(0.08 0.015 245)' }}
    >
      {/* Concentric range rings from center */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.04,
          backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 80px, ${PRIMARY} 81px, transparent 83px)`,
        }}
      />
      {/* Cardinal cross — N/S and E/W lines through center */}
      <div
        className="absolute inset-0"
        style={{ opacity: 0.03 }}
      >
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px"
          style={{ backgroundColor: PRIMARY }}
        />
        <div
          className="absolute top-1/2 left-0 right-0 h-px"
          style={{ backgroundColor: PRIMARY }}
        />
      </div>
      {/* 45-degree intercardinal lines — fainter */}
      <div
        className="absolute inset-0"
        style={{ opacity: 0.015 }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-[200%] w-px origin-top"
          style={{
            backgroundColor: PRIMARY,
            transform: 'translate(-50%, -50%) rotate(45deg)',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[200%] w-px origin-top"
          style={{
            backgroundColor: PRIMARY,
            transform: 'translate(-50%, -50%) rotate(-45deg)',
          }}
        />
      </div>
      {/* Rotating sweep beam */}
      <div
        className="absolute motion-safe:animate-[radar-sweep_12s_linear_infinite]"
        style={{
          top: 'calc(50% - 100%)',
          left: 'calc(50% - 100%)',
          width: '200%',
          height: '200%',
          transformOrigin: 'center center',
          background: `conic-gradient(from 0deg at 50% 50%, oklch(0.5 0.14 150 / 0.14) 0deg, oklch(0.5 0.14 150 / 0.04) 15deg, transparent 35deg, transparent 360deg)`,
        }}
      />
      {/* Center dot */}
      <div
        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          backgroundColor: RADAR_GREEN,
          opacity: 0.12,
          boxShadow: `0 0 4px 1px ${RADAR_GREEN}`,
        }}
      />
      {/* Radar blips */}
      {BLIPS.map((blip, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full motion-safe:animate-[radar-blip_12s_ease-out_var(--delay)_infinite]"
          style={{
            left: `calc(50% + ${blip.x}%)`,
            top: `calc(50% + ${blip.y}%)`,
            backgroundColor: RADAR_GREEN,
            boxShadow: `0 0 6px 2px ${RADAR_GREEN}`,
            '--delay': blip.delay,
            opacity: 0,
          } as React.CSSProperties}
        />
      ))}
      {/* Vignette — centered */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, ${DARK} 85%)`,
          opacity: 0.7,
        }}
      />
    </div>
  )
}
