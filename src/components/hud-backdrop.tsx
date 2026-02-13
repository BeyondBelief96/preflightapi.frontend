const PRIMARY = 'oklch(0.65 0.15 235)'
const HUD_GREEN = 'oklch(0.55 0.12 155)'
const RADAR_GREEN = 'oklch(0.5 0.14 150)'
const DARK = 'oklch(0.07 0.02 245)'

type Variant = 'hud' | 'sectional' | 'brushed' | 'radar'

// Pitch ladder rungs — horizontal dashes spaced vertically from center
const PITCH_RUNGS = [-3, -2, -1, 1, 2, 3] as const

function HudLayers() {
  return (
    <>
      {/* Fine grid — 48px crosshatch */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.035,
          backgroundImage: `
            linear-gradient(to right, ${HUD_GREEN} 1px, transparent 1px),
            linear-gradient(to bottom, ${HUD_GREEN} 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Grid pulse — slow green breathe */}
      <div
        className="absolute inset-0 motion-safe:animate-[hud-pulse_6s_ease-in-out_infinite]"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${HUD_GREEN} 1px, transparent 1px),
            linear-gradient(to bottom, ${HUD_GREEN} 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Horizon line — central horizontal reference */}
      <div
        className="absolute left-0 right-0 top-1/2 h-px"
        style={{
          background: `linear-gradient(to right, transparent 10%, ${HUD_GREEN} 30%, ${HUD_GREEN} 70%, transparent 90%)`,
          opacity: 0.07,
        }}
      />
      {/* Pitch ladder — short dashes above and below horizon */}
      {PITCH_RUNGS.map((rung) => (
        <div
          key={rung}
          className="absolute left-1/2 h-px -translate-x-1/2"
          style={{
            top: `calc(50% + ${rung * 48}px)`,
            width: rung > 0 ? '60px' : '40px',
            background: HUD_GREEN,
            opacity: 0.05,
            // Negative rungs (below horizon) are dashed
            ...(rung < 0 && {
              background: 'none',
              borderTop: `1px dashed ${HUD_GREEN}`,
            }),
          }}
        />
      ))}
      {/* Flight path marker — small circle at center */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 20,
          height: 20,
          border: `1px solid ${HUD_GREEN}`,
          opacity: 0.06,
        }}
      />
      {/* Heading tick marks — top edge */}
      <div
        className="absolute left-0 right-0 top-0 h-3"
        style={{
          opacity: 0.05,
          backgroundImage: `repeating-linear-gradient(to right, ${HUD_GREEN} 0px, ${HUD_GREEN} 1px, transparent 1px, transparent 48px)`,
          maskImage: 'linear-gradient(to right, transparent 5%, black 20%, black 80%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 5%, black 20%, black 80%, transparent 95%)',
        }}
      />
      {/* Altitude tick marks — right edge */}
      <div
        className="absolute bottom-0 right-0 top-0 w-3"
        style={{
          opacity: 0.05,
          backgroundImage: `repeating-linear-gradient(to bottom, ${HUD_GREEN} 0px, ${HUD_GREEN} 1px, transparent 1px, transparent 48px)`,
          maskImage: 'linear-gradient(to bottom, transparent 10%, black 25%, black 75%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 10%, black 25%, black 75%, transparent 90%)',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${DARK} 100%)`,
          opacity: 0.7,
        }}
      />
      {/* Corner brackets */}
      {(
        [
          'top-0 left-0',
          'top-0 right-0',
          'bottom-0 left-0',
          'bottom-0 right-0',
        ] as const
      ).map((pos) => (
        <div
          key={pos}
          className={`absolute ${pos} h-16 w-16`}
          style={{
            opacity: 0.08,
            borderColor: HUD_GREEN,
            borderStyle: 'solid',
            borderWidth: 0,
            ...(pos.includes('top')
              ? { borderTopWidth: 2 }
              : { borderBottomWidth: 2 }),
            ...(pos.includes('left')
              ? { borderLeftWidth: 2 }
              : { borderRightWidth: 2 }),
          }}
        />
      ))}
    </>
  )
}

function SectionalLayers() {
  return (
    <>
      {/* Topographic contour rings — offset concentric circles */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.035,
          backgroundImage: `
            repeating-radial-gradient(circle at 15% 25%, transparent 0, transparent 80px, ${PRIMARY} 81px, transparent 83px),
            repeating-radial-gradient(circle at 75% 60%, transparent 0, transparent 100px, ${PRIMARY} 101px, transparent 103px),
            repeating-radial-gradient(circle at 45% 85%, transparent 0, transparent 65px, ${PRIMARY} 66px, transparent 68px)
          `,
        }}
      />
      {/* Lat/lon coordinate grid — wider spacing than HUD */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.025,
          backgroundImage: `
            linear-gradient(to right, ${PRIMARY} 1px, transparent 1px),
            linear-gradient(to bottom, ${PRIMARY} 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, ${DARK} 100%)`,
          opacity: 0.6,
        }}
      />
    </>
  )
}

function BrushedLayers() {
  return (
    <>
      {/* Noise grain via SVG feTurbulence */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '300px 300px',
        }}
      />
      {/* Directional brushing — faint diagonal lines */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.02,
          backgroundImage: `repeating-linear-gradient(135deg, ${PRIMARY} 0px, transparent 1px, transparent 3px)`,
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${DARK} 100%)`,
          opacity: 0.55,
        }}
      />
    </>
  )
}

// Blips positioned as offsets from center (%).
// Delay = angle-from-north / 360 * 12s so they flash when the sweep passes.
//   (x:25, y:-18)  → ~54°  → 1.8s
//   (x:-15, y:-30) → ~333° → 11.1s
//   (x:35, y:10)   → ~106° → 3.5s
//   (x:-28, y:15)  → ~242° → 8.1s
//   (x:10, y:-38)  → ~15°  → 0.5s
//   (x:-35, y:-8)  → ~283° → 9.4s
const BLIPS = [
  { x: 25, y: -18, delay: '1.8s' },
  { x: -15, y: -30, delay: '11.1s' },
  { x: 35, y: 10, delay: '3.5s' },
  { x: -28, y: 15, delay: '8.1s' },
  { x: 10, y: -38, delay: '0.5s' },
  { x: -35, y: -8, delay: '9.4s' },
] as const

function RadarLayers() {
  return (
    <>
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
        {/* Vertical line */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px"
          style={{ backgroundColor: PRIMARY }}
        />
        {/* Horizontal line */}
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
    </>
  )
}

const layers: Record<Variant, () => React.JSX.Element> = {
  hud: HudLayers,
  sectional: SectionalLayers,
  brushed: BrushedLayers,
  radar: RadarLayers,
}

export function DashboardBackdrop({ variant }: { variant: Variant }) {
  const Layers = layers[variant]

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      style={{ backgroundColor: 'oklch(0.08 0.015 245)' }}
    >
      <Layers />
    </div>
  )
}
