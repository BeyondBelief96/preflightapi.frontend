import { useEffect, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { codeToHtml } from 'shiki'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL } from '@/lib/gateway-url'

const sources = [
  { label: 'FAA NASR', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/', format: 'CSV', cycle: '28d' },
  { label: 'FAA DOF', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dof/', format: 'CSV', cycle: '56d' },
  { label: 'FAA d-TPPs', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/', format: 'PDF', cycle: '28d' },
  { label: 'FAA d-CS', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dafd/', format: 'PDF', cycle: '56d' },
  { label: 'FAA ADDS', url: 'https://adds-faa.opendata.arcgis.com/', format: 'GeoJSON', cycle: '56d' },
  { label: 'FAA NMS', url: 'https://nms.aim.faa.gov/', format: 'JSON', cycle: '3min' },
  { label: 'AWC', url: 'https://aviationweather.gov/', format: 'XML', cycle: '5-30m' },
]

const infraStages = [
  'Cron jobs & pollers',
  'CSV / XML / PDF parsers',
  'Normalization & deduplication',
  'Database & indexing',
  'Auth, rate limiting & REST API',
]

const fetchSnippet = `const airport = await fetch(
  \`${API_BASE_URL}/airports/KJFK\`,
  { headers: { 'Ocp-Apim-Subscription-Key': key } },
).then(r => r.json())`

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

        {/* Source chips */}
        <div className="mt-14 flex flex-wrap justify-center gap-2.5">
          {sources.map((source) => (
            <a
              key={source.label}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-card px-3.5 py-2 transition-colors hover:border-accent/50"
            >
              <span className="text-sm font-medium">{source.label}</span>
              <Badge variant="secondary" className="text-[10px]">
                {source.format}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {source.cycle}
              </span>
            </a>
          ))}
        </div>

        {/* Downward connector */}
        <div className="flex justify-center py-4">
          <ArrowDown className="h-5 w-5 text-accent/40" />
        </div>

        {/* Infrastructure stages */}
        <div className="mx-auto max-w-md space-y-2">
          {infraStages.map((stage, i) => (
            <div
              key={stage}
              className="relative rounded-lg border bg-card px-5 py-3.5 text-center text-sm font-medium"
            >
              <div className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent/40" />
              {stage}
              {i < infraStages.length - 1 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <ArrowDown className="h-3.5 w-3.5 text-border" />
                </div>
              )}
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
        <div className="text-center">
          <h3 className="text-xl font-bold sm:text-2xl">
            What you write with PreflightAPI
          </h3>
        </div>
        <div className="mx-auto mt-6 max-w-lg overflow-hidden rounded-xl border bg-aviation-dark shadow-lg">
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
          We built the infrastructure.{' '}
          <span className="text-accent">You build the product.</span>
        </p>
      </div>
    </section>
  )
}
