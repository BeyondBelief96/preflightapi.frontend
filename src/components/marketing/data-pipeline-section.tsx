import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { API_BASE_PATH } from '@/lib/api-metadata'

/* ── Layout constants ─────────────────────────────────── */

const SRC_W = 84
const SRC_H = 38
const SRC_Y = 28
const SRC_BOTTOM = SRC_Y + SRC_H

const BAR_Y = 82

const PROC_W = 180
const PROC_H = 44
const PROC_Y = 112
const PROC_BOTTOM = PROC_Y + PROC_H

const STAGE_W = 210

const PARSE_Y = 210
const PARSE_H = 44
const PARSE_BOTTOM = PARSE_Y + PARSE_H

const DB_Y = 296
const DB_H = 44
const DB_BOTTOM = DB_Y + DB_H

const API_Y = 382
const API_H = 44

const BATCH_CX = 238
const RT_CX = 648
const MERGE_CX = 380

/* ── Source & stage data ──────────────────────────────── */

const batchSources = [
  { id: 'nasr', label: 'FAA NASR', meta: 'CSV · 28d', x: 16, w: SRC_W },
  { id: 'dof', label: 'FAA DOF', meta: 'CSV · 56d', x: 106, w: SRC_W },
  { id: 'dtpps', label: 'FAA d-TPPs', meta: 'PDF · 28d', x: 196, w: SRC_W },
  { id: 'dcs', label: 'FAA d-CS', meta: 'PDF · 56d', x: 286, w: SRC_W },
  { id: 'adds', label: 'FAA ADDS', meta: 'GeoJSON · 56d', x: 376, w: SRC_W },
].map((s) => ({ ...s, cx: s.x + s.w / 2 }))

const rtSources = [
  { id: 'nms', label: 'FAA NMS', meta: 'JSON · 3min', x: 558, w: 82 },
  { id: 'noaa', label: 'NOAA Weather', meta: 'XML · 5-30m', x: 650, w: 98 },
].map((s) => ({ ...s, cx: s.x + s.w / 2 }))

const stages = [
  {
    id: 'batch',
    label: 'Batch Ingestion',
    sub: '28-day and 56-day cycles',
    cx: BATCH_CX,
    y: PROC_Y,
    w: PROC_W,
    h: PROC_H,
  },
  {
    id: 'rt',
    label: 'Real-time Polling',
    sub: '3 to 30-minute intervals',
    cx: RT_CX,
    y: PROC_Y,
    w: 170,
    h: PROC_H,
  },
  {
    id: 'parse',
    label: 'Parsing & Normalization',
    sub: 'CSV, XML, PDF, GeoJSON → JSON',
    cx: MERGE_CX,
    y: PARSE_Y,
    w: STAGE_W,
    h: PARSE_H,
  },
  {
    id: 'db',
    label: 'Database',
    sub: 'Indexed, deduplicated, versioned',
    cx: MERGE_CX,
    y: DB_Y,
    w: STAGE_W,
    h: DB_H,
  },
  {
    id: 'api',
    label: 'REST API',
    sub: 'Auth, rate limiting, 40+ endpoints',
    cx: MERGE_CX,
    y: API_Y,
    w: STAGE_W,
    h: API_H,
  },
]

/* ── Wire paths ───────────────────────────────────────── */

const wirePaths = [
  // Batch source drops to bar
  ...batchSources.map((s) => `M ${s.cx} ${SRC_BOTTOM} L ${s.cx} ${BAR_Y}`),
  // Batch collector bar
  `M ${batchSources[0].cx} ${BAR_Y} L ${batchSources[4].cx} ${BAR_Y}`,
  // Batch center drop
  `M ${BATCH_CX} ${BAR_Y} L ${BATCH_CX} ${PROC_Y}`,
  // RT source drops to bar
  ...rtSources.map((s) => `M ${s.cx} ${SRC_BOTTOM} L ${s.cx} ${BAR_Y}`),
  // RT collector bar
  `M ${rtSources[0].cx} ${BAR_Y} L ${rtSources[1].cx} ${BAR_Y}`,
  // RT center drop
  `M ${RT_CX} ${BAR_Y} L ${RT_CX} ${PROC_Y}`,
  // Merge curves
  `M ${BATCH_CX} ${PROC_BOTTOM} C ${BATCH_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PARSE_Y}`,
  `M ${RT_CX} ${PROC_BOTTOM} C ${RT_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PARSE_Y}`,
  // Lower connections
  `M ${MERGE_CX} ${PARSE_BOTTOM} L ${MERGE_CX} ${DB_Y}`,
  `M ${MERGE_CX} ${DB_BOTTOM} L ${MERGE_CX} ${API_Y}`,
]

/* ── Glow pulse definitions ───────────────────────────── */

const pulses = [
  // Batch sources → ingestion (staggered, varied durations)
  ...batchSources.map((s, i) => ({
    id: `gp-${s.id}`,
    d: `M ${s.cx} ${SRC_BOTTOM} L ${s.cx} ${BAR_Y} L ${BATCH_CX} ${BAR_Y} L ${BATCH_CX} ${PROC_Y}`,
    dur: 2.8 + Math.abs(s.cx - BATCH_CX) / 180,
    begin: i * 1.3,
  })),
  // Second wave for batch (offset timing for organic feel)
  ...batchSources
    .filter((_, i) => i % 2 === 0)
    .map((s, i) => ({
      id: `gp-${s.id}-2`,
      d: `M ${s.cx} ${SRC_BOTTOM} L ${s.cx} ${BAR_Y} L ${BATCH_CX} ${BAR_Y} L ${BATCH_CX} ${PROC_Y}`,
      dur: 3.7 + i * 0.4,
      begin: 3.5 + i * 1.7,
    })),
  // RT sources → polling
  {
    id: 'gp-nms',
    d: `M ${rtSources[0].cx} ${SRC_BOTTOM} L ${rtSources[0].cx} ${BAR_Y} L ${RT_CX} ${BAR_Y} L ${RT_CX} ${PROC_Y}`,
    dur: 2.2,
    begin: 0.4,
  },
  {
    id: 'gp-noaa',
    d: `M ${rtSources[1].cx} ${SRC_BOTTOM} L ${rtSources[1].cx} ${BAR_Y} L ${RT_CX} ${BAR_Y} L ${RT_CX} ${PROC_Y}`,
    dur: 2.5,
    begin: 1.9,
  },
  {
    id: 'gp-nms-2',
    d: `M ${rtSources[0].cx} ${SRC_BOTTOM} L ${rtSources[0].cx} ${BAR_Y} L ${RT_CX} ${BAR_Y} L ${RT_CX} ${PROC_Y}`,
    dur: 3.1,
    begin: 4.2,
  },
  // Merge curves
  {
    id: 'gp-merge-l',
    d: `M ${BATCH_CX} ${PROC_BOTTOM} C ${BATCH_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PARSE_Y}`,
    dur: 2.5,
    begin: 0,
  },
  {
    id: 'gp-merge-r',
    d: `M ${RT_CX} ${PROC_BOTTOM} C ${RT_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PARSE_Y}`,
    dur: 3.2,
    begin: 1.4,
  },
  {
    id: 'gp-merge-l-2',
    d: `M ${BATCH_CX} ${PROC_BOTTOM} C ${BATCH_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PROC_BOTTOM + 32} ${MERGE_CX} ${PARSE_Y}`,
    dur: 3.8,
    begin: 3.0,
  },
  // Lower pipeline
  {
    id: 'gp-to-db',
    d: `M ${MERGE_CX} ${PARSE_BOTTOM} L ${MERGE_CX} ${DB_Y}`,
    dur: 1.4,
    begin: 0,
  },
  {
    id: 'gp-to-db-2',
    d: `M ${MERGE_CX} ${PARSE_BOTTOM} L ${MERGE_CX} ${DB_Y}`,
    dur: 1.8,
    begin: 2.3,
  },
  {
    id: 'gp-to-api',
    d: `M ${MERGE_CX} ${DB_BOTTOM} L ${MERGE_CX} ${API_Y}`,
    dur: 1.4,
    begin: 0.7,
  },
  {
    id: 'gp-to-api-2',
    d: `M ${MERGE_CX} ${DB_BOTTOM} L ${MERGE_CX} ${API_Y}`,
    dur: 1.9,
    begin: 3.1,
  },
]

/* ── Fetch snippet ────────────────────────────────────── */

const fetchSnippet = `const metar = await fetch(
  \`https://api.preflightapi.io${API_BASE_PATH}/metars/KJFK\`,
  { headers: { 'Ocp-Apim-Subscription-Key': key } },
).then(r => r.json())`

/* ── Diagram component ────────────────────────────────── */

function ArchitectureDiagram() {
  return (
    <div className="mt-14">
      <svg
        viewBox={`0 0 760 ${API_Y + API_H + 14}`}
        className="mx-auto w-full"
        role="img"
        aria-label="Architecture diagram showing data sources flowing through ingestion, parsing, database, and API layers"
      >
        {/* Reduced-motion: hide pulses */}
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .glow-pulse { display: none; }
          }
        `}</style>

        <defs>
          {/* Glow filters */}
          <filter
            id="aura"
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>
          <filter
            id="aura-sm"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
          </filter>

          {/* Animation paths */}
          {pulses.map((p) => (
            <path key={p.id} id={p.id} d={p.d} fill="none" />
          ))}
        </defs>

        {/* ── Wires (glow layer) ──────────────────────── */}
        <g
          stroke="var(--accent)"
          strokeWidth="3"
          fill="none"
          opacity="0.06"
          strokeLinecap="round"
        >
          {wirePaths.map((d, i) => (
            <path key={`wg-${i}`} d={d} />
          ))}
        </g>

        {/* ── Wires (line layer) ──────────────────────── */}
        <g
          stroke="var(--accent)"
          strokeWidth="1"
          fill="none"
          opacity="0.2"
          strokeLinecap="round"
        >
          {wirePaths.map((d, i) => (
            <path key={`wl-${i}`} d={d} />
          ))}
        </g>

        {/* ── Animated glow pulses ────────────────────── */}
        {pulses.map((p) => (
          <g key={p.id} className="glow-pulse">
            {/* Wide soft aura */}
            <circle
              r="10"
              fill="var(--accent)"
              opacity="0.12"
              filter="url(#aura)"
            >
              <animateMotion
                dur={`${p.dur}s`}
                begin={`${p.begin}s`}
                repeatCount="indefinite"
                calcMode="linear"
              >
                <mpath href={`#${p.id}`} />
              </animateMotion>
            </circle>
            {/* Inner glow */}
            <circle
              r="4"
              fill="var(--accent)"
              opacity="0.45"
              filter="url(#aura-sm)"
            >
              <animateMotion
                dur={`${p.dur}s`}
                begin={`${p.begin}s`}
                repeatCount="indefinite"
                calcMode="linear"
              >
                <mpath href={`#${p.id}`} />
              </animateMotion>
            </circle>
            {/* Bright core */}
            <circle r="1.5" fill="var(--accent)" opacity="0.9">
              <animateMotion
                dur={`${p.dur}s`}
                begin={`${p.begin}s`}
                repeatCount="indefinite"
                calcMode="linear"
              >
                <mpath href={`#${p.id}`} />
              </animateMotion>
            </circle>
          </g>
        ))}

        {/* ── Group labels ────────────────────────────── */}
        <text
          x={BATCH_CX}
          y={16}
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="9"
          fontWeight="600"
          letterSpacing="1.5"
          fontFamily="var(--font-sans)"
        >
          CRON JOBS
        </text>
        <text
          x={RT_CX}
          y={16}
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="9"
          fontWeight="600"
          letterSpacing="1.5"
          fontFamily="var(--font-sans)"
        >
          REAL-TIME
        </text>

        {/* ── Source boxes (dashed = external) ─────────── */}
        {[...batchSources, ...rtSources].map((s) => (
            <g key={s.id}>
              <rect
                x={s.x}
                y={SRC_Y}
                width={s.w}
                height={SRC_H}
                rx={5}
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text
                x={s.cx}
                y={SRC_Y + 16}
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize="11"
                fontWeight="600"
                fontFamily="var(--font-sans)"
              >
                {s.label}
              </text>
              <text
                x={s.cx}
                y={SRC_Y + 29}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                {s.meta}
              </text>
            </g>
          ))}

        {/* ── Stage boxes (solid = infrastructure) ─────── */}
        {stages.map((stage) => (
          <g key={stage.id}>
            <rect
              x={stage.cx - stage.w / 2}
              y={stage.y}
              width={stage.w}
              height={stage.h}
              rx={6}
              fill="var(--card)"
              stroke="var(--border)"
              strokeWidth="1"
            />
            {/* Accent left edge */}
            <rect
              x={stage.cx - stage.w / 2}
              y={stage.y + 8}
              width={3}
              height={stage.h - 16}
              rx={1.5}
              fill="var(--accent)"
              opacity="0.5"
            />
            <text
              x={stage.cx}
              y={stage.y + 19}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize="12"
              fontWeight="600"
              fontFamily="var(--font-sans)"
            >
              {stage.label}
            </text>
            <text
              x={stage.cx}
              y={stage.y + 34}
              textAnchor="middle"
              fill="var(--muted-foreground)"
              fontSize="10"
              fontFamily="var(--font-sans)"
            >
              {stage.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/* ── Exported section ─────────────────────────────────── */

export function DataPipelineSection() {
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')

  useEffect(() => {
    codeToHtml(fetchSnippet, {
      lang: 'typescript',
      theme: 'github-dark',
    }).then(setHighlightedHtml)
  }, [])

  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What you&apos;d have to build
          </h2>
        </div>

        <ArchitectureDiagram />

        {/* Or divider */}
        <div className="relative my-12 flex items-center justify-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
          <span className="relative rounded-full border bg-card px-4 py-1 text-sm font-medium text-muted-foreground">
            or
          </span>
        </div>

        {/* Single fetch example */}
        <div className="mx-auto max-w-lg overflow-hidden rounded-xl border bg-aviation-dark shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="p-4 text-sm leading-relaxed [&_pre]:!m-0 [&_pre]:!bg-transparent [&_code]:!bg-transparent">
            {highlightedHtml ? (
              <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            ) : (
              <pre>
                <code className="text-white/90">{fetchSnippet}</code>
              </pre>
            )}
          </div>
        </div>

        <p className="mt-10 text-center text-lg font-semibold">
          We built the pipeline.{' '}
          <span className="text-accent">You build the product.</span>
        </p>
      </div>
    </section>
  )
}
