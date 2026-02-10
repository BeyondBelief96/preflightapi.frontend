import { Link } from '@tanstack/react-router'
import { ArrowRight, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { ApiStatusBadge } from '@/components/marketing/api-status-badge'
import { Button } from '@/components/ui/button'
import { API_BASE_PATH } from '@/lib/api-metadata'
import { isWaitlistMode } from '@/lib/waitlist'
import { usePlans } from '@/hooks/use-plans'

const codeExamples = [
  {
    id: 'fetch',
    label: 'fetch',
    file: 'weather.ts',
    lang: 'typescript',
    code: `import type { MetarDto } from './types'

const res = await fetch(
  \`https://api.preflightapi.io${API_BASE_PATH}/metars/KJFK\`,
  {
    headers: {
      'Ocp-Apim-Subscription-Key': 'your-api-key',
    },
  },
)

const metar: MetarDto = await res.json()
console.log(metar.flightCategory) // "VFR"`,
  },
  {
    id: 'axios',
    label: 'axios',
    file: 'weather.ts',
    lang: 'typescript',
    code: `import axios from 'axios'
import type { MetarDto } from './types'

const client = axios.create({
  baseURL: 'https://api.preflightapi.io${API_BASE_PATH}',
  headers: {
    'Ocp-Apim-Subscription-Key': 'your-api-key',
  },
})

const { data } = await client.get<MetarDto>(
  '/metars/KJFK',
)
console.log(data.flightCategory) // "VFR"`,
  },
  {
    id: 'react-query',
    label: 'TanStack Query',
    file: 'useMetar.ts',
    lang: 'typescript',
    code: `import { useQuery } from '@tanstack/react-query'
import type { MetarDto } from './types'

export function useMetar(stationId: string) {
  return useQuery({
    queryKey: ['metar', stationId],
    queryFn: async (): Promise<MetarDto> => {
      const res = await fetch(
        \`https://api.preflightapi.io${API_BASE_PATH}/metars/\${stationId}\`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'your-api-key',
          },
        },
      )
      return res.json()
    },
  })
}`,
  },
  {
    id: 'rtk-query',
    label: 'RTK Query',
    file: 'store/weatherApi.ts',
    lang: 'typescript',
    code: `import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { MetarDto } from '../types'

export const weatherApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.preflightapi.io${API_BASE_PATH}',
    prepareHeaders: (headers) => {
      headers.set(
        'Ocp-Apim-Subscription-Key',
        'your-api-key',
      )
      return headers
    },
  }),
  endpoints: (builder) => ({
    getMetar: builder.query<MetarDto, string>({
      query: (stationId) => \`/metars/\${stationId}\`,
    }),
  }),
})`,
  },
] as const

function CodeTabs() {
  const [activeTab, setActiveTab] = useState(0)
  const [highlightedHtml, setHighlightedHtml] = useState<
    Record<number, string>
  >({})

  useEffect(() => {
    // Highlight all code examples on mount
    codeExamples.forEach((example, index) => {
      codeToHtml(example.code, {
        lang: example.lang,
        theme: 'github-dark',
      }).then((html) => {
        setHighlightedHtml((prev) => ({ ...prev, [index]: html }))
      })
    })
  }, [])

  const activeExample = codeExamples[activeTab]

  return (
    <div className="overflow-hidden rounded-xl border bg-aviation-dark shadow-2xl">
      {/* Tab bar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="mr-2 flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-white/50">{activeExample.file}</span>
      </div>
      <div className="flex overflow-x-auto border-b border-white/10">
        {codeExamples.map((example, index) => (
          <button
            key={example.id}
            type="button"
            onClick={() => setActiveTab(index)}
            className={`shrink-0 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === index
                ? 'border-b-2 border-accent text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {example.label}
          </button>
        ))}
      </div>
      {/* Code content — fixed height prevents layout shift when switching tabs */}
      <div className="h-[340px] overflow-auto p-4 text-sm leading-relaxed [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:!bg-transparent">
        {highlightedHtml[activeTab] ? (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedHtml[activeTab] }}
          />
        ) : (
          <pre>
            <code className="text-white/90">{activeExample.code}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

export function HeroSection() {
  const { plans } = usePlans()
  const freePlan = plans.find((p) => p.id === 'free')
  const freeCallsLabel = freePlan?.limits.callsPerMonth?.toLocaleString() ?? '500'

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Left: Copy */}
          <div>
            <ApiStatusBadge />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Aviation Data <span className="text-accent">for Developers</span>
            </h1>
            <p className="mt-3 text-xl font-medium italic text-accent/80 sm:text-2xl">
              Minus the turbulence.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Access real-time weather, airport information, NOTAMs, airspace
              data, and flight planning tools through a single, well-documented
              REST API. Built for aviation apps, EFBs, and flight planning
              software.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to={isWaitlistMode ? '/waitlist' : '/sign-up'}>
                <Button size="lg" className="gap-2">
                  {isWaitlistMode ? 'Join the Waitlist' : 'Get Started Free'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="outline" size="lg" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  View Documentation
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {freePlan?.name ?? 'Student Pilot'} plan is free forever —{' '}
              {freeCallsLabel} API calls/month, no credit card required.
            </p>
          </div>

          {/* Right: Code Example */}
          <div className="relative min-w-0">
            <CodeTabs />
            {/* Decorative glow */}
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
