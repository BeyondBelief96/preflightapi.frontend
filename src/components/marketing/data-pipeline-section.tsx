import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { Clock, Code2, Database, Server } from 'lucide-react'
import { API_BASE_PATH } from '@/lib/api-metadata'

type Format = 'CSV' | 'PDF' | 'GeoJSON' | 'JSON' | 'XML'

const sources: Array<{ name: string; format: Format; cycle: string }> = [
  { name: 'FAA NASR', format: 'CSV', cycle: '28 days' },
  { name: 'FAA DOF', format: 'CSV', cycle: '56 days' },
  { name: 'FAA d-TPPs', format: 'PDF', cycle: '28 days' },
  { name: 'FAA d-CS', format: 'PDF', cycle: '56 days' },
  { name: 'FAA ADDS', format: 'GeoJSON', cycle: '56 days' },
  { name: 'FAA NMS', format: 'JSON', cycle: '3 min' },
  { name: 'aviationweather.gov', format: 'XML', cycle: '5–30 min' },
]

const formatColors: Record<Format, string> = {
  CSV: 'bg-yellow-500/15 text-yellow-400',
  PDF: 'bg-red-500/15 text-red-400',
  GeoJSON: 'bg-blue-500/15 text-blue-400',
  JSON: 'bg-green-500/15 text-green-400',
  XML: 'bg-purple-500/15 text-purple-400',
}

const pipelineStages = [
  {
    icon: Clock,
    title: 'Scheduled Ingestion',
    description:
      '7 cron schedules pulling data on cycles from 3 minutes to 56 days',
  },
  {
    icon: Code2,
    title: 'Parsing & Normalization',
    description: 'CSV, XML, PDF, GeoJSON → normalized, validated JSON',
  },
  {
    icon: Database,
    title: 'Database',
    description: 'Indexed, deduplicated, versioned storage',
  },
  {
    icon: Server,
    title: 'REST API',
    description: 'Authentication, rate limiting, 40+ endpoints',
  },
]

const fetchSnippet = `const metar = await fetch(
  \`https://api.preflightapi.io${API_BASE_PATH}/metars/KJFK\`,
  { headers: { 'Ocp-Apim-Subscription-Key': key } },
).then(r => r.json())`

function FlowDots({
  count = 3,
  duration = 4,
}: {
  count?: number
  duration?: number
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent animate-data-flow"
          style={{
            animationDelay: `${(i * duration) / count}s`,
            animationDuration: `${duration}s`,
            boxShadow: '0 0 8px 3px oklch(0.68 0.14 220 / 0.5)',
          }}
        />
      ))}
    </>
  )
}

function ConnectorLine() {
  return (
    <div className="relative mx-auto h-12 w-px bg-border/40">
      <FlowDots />
    </div>
  )
}

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
          <p className="mt-4 text-lg text-muted-foreground">
            This is the infrastructure between raw government data and a usable
            API.
          </p>
        </div>

        {/* Architecture diagram */}
        <div className="mt-14">
          {/* External sources */}
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            External Sources
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {sources.map((source) => (
              <div
                key={source.name}
                className="rounded-lg border border-dashed border-border/60 bg-card/50 px-3 py-2.5"
              >
                <p className="text-xs font-semibold">{source.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${formatColors[source.format]}`}
                  >
                    {source.format}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {source.cycle}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Converging connector from sources to pipeline */}
          <div className="relative mx-auto h-12 w-px bg-border/40">
            <div className="absolute -top-px left-1/2 h-4 w-[min(80%,24rem)] -translate-x-1/2 rounded-b-xl border-b border-l border-r border-dashed border-border/30" />
            <FlowDots />
          </div>

          {/* Pipeline stages */}
          {pipelineStages.map((stage, i) => (
            <div key={stage.title}>
              <div className="relative mx-auto max-w-md rounded-xl border bg-card p-4">
                {/* Accent edge */}
                <div className="absolute -left-px inset-y-2 w-0.5 rounded-full bg-accent/40" />
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <stage.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{stage.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </div>

              {i < pipelineStages.length - 1 && <ConnectorLine />}
            </div>
          ))}
        </div>

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
