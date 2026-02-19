import { Link } from '@tanstack/react-router'
import { ArrowRight, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '@/lib/gateway-url'
import { isWaitlistMode } from '@/lib/waitlist'
import { usePlans } from '@/hooks/use-plans'
import { useTypingEffect } from '@/hooks/use-typing-effect'

const codeExamples = [
  {
    id: 'fetch',
    label: 'fetch',
    file: 'weather.ts',
    lang: 'typescript',
    code: `import type { MetarDto } from './types'

const res = await fetch(
  \`${API_BASE_URL}/metars/KJFK\`,
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
  baseURL: '${API_BASE_URL}',
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
        \`${API_BASE_URL}/metars/\${stationId}\`,
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
    baseUrl: '${API_BASE_URL}',
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
  const { displayedText, isComplete } = useTypingEffect({
    text: activeExample.code,
  })

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
      {/* Tabs — hidden on mobile, shows first example only */}
      <div className="hidden overflow-x-auto border-b border-white/10 lg:flex">
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
      {/* Code content — responsive height */}
      <div className="max-h-[280px] overflow-auto p-4 text-[13px] leading-relaxed sm:text-sm lg:max-h-[420px] [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:!bg-transparent">
        {isComplete && highlightedHtml[activeTab] ? (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedHtml[activeTab] }}
          />
        ) : (
          <pre>
            <code className="text-white/90">
              {isComplete ? activeExample.code : displayedText}
            </code>
            {!isComplete && (
              <span className="animate-cursor-blink text-accent">|</span>
            )}
          </pre>
        )}
      </div>
    </div>
  )
}

export function HeroSection() {
  const { plans } = usePlans()
  const studentPlan = plans.find((p) => p.id === 'student')
  const freeCallsLabel =
    studentPlan?.limits.callsPerMonth?.toLocaleString() ?? '500'

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[5fr_7fr]">
          {/* Left: Copy */}
          <div>
            <img
              src="/preflight_logo_with_text_2.svg"
              alt="PreflightAPI"
              className="mb-6 h-20 w-auto"
            />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              US Aviation Data.{' '}
              <span className="text-accent">Developer-Ready.</span>
            </h1>
            <p className="mt-4 text-lg font-medium text-muted-foreground sm:text-xl">
                Airports, runways, frequencies, airspace, NOTAMs, obstacles, and more — all with one API key.
                Your aviation data infrastructure, already built.
            </p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Built by a pilot and software engineer. All data sourced from the FAA and AWC.
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
              {freeCallsLabel} calls/month free. No credit card required.
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
