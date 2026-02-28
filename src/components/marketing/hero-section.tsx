import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Loader2, Play, Terminal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL } from '@/lib/gateway-url'
import { isWaitlistMode } from '@/lib/waitlist'
import { usePlans } from '@/hooks/use-plans'
import { fetchDemoMetar } from '@/lib/server/demo'
import { flightCategoryColors } from '@/components/marketing/demo-shared'

const heroAirports = [
  { icao: 'KJFK', label: 'JFK' },
  { icao: 'KLAX', label: 'LAX' },
  { icao: 'KORD', label: 'ORD' },
  { icao: 'KDEN', label: 'DEN' },
  { icao: 'KSFO', label: 'SFO' },
  { icao: 'KATL', label: 'ATL' },
]

function LiveMetarDemo() {
  const [selectedIcao, setSelectedIcao] = useState('KJFK')
  const [enabled, setEnabled] = useState(false)

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['demo', 'hero-metar', selectedIcao],
    queryFn: () => fetchDemoMetar({ data: { icao: selectedIcao } }),
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: false,
  })

  const metar = data?.data
  const durationMs = data?.durationMs

  return (
    <div className="overflow-hidden rounded-xl border bg-aviation-dark shadow-2xl">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="mr-2 flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <Terminal className="h-3.5 w-3.5 text-white/40" />
        <span className="text-xs text-white/50">Live API Demo</span>
      </div>

      {/* Request */}
      <div className="border-b border-white/10 px-4 pb-4 pt-4">
        <pre className="text-[13px] leading-relaxed sm:text-sm">
          <code>
            <span className="font-semibold text-green-400">GET</span>{' '}
            <span className="text-white/50">{API_BASE_URL}/metars/</span>
            <span className="font-semibold text-accent">{selectedIcao}</span>
            {'\n'}
            <span className="text-white/30">Header: </span>
            <span className="text-blue-400/70">Ocp-Apim-Subscription-Key</span>
            <span className="text-white/30">: ••••••••</span>
          </code>
        </pre>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {heroAirports.map((apt) => (
            <button
              key={apt.icao}
              type="button"
              onClick={() => setSelectedIcao(apt.icao)}
              className={`rounded-md border px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                selectedIcao === apt.icao
                  ? 'border-accent/40 bg-accent/20 text-accent'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {apt.label}
            </button>
          ))}
          <Button
            size="sm"
            className="ml-auto h-7 gap-1.5 px-3 text-xs"
            onClick={() => setEnabled(true)}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3 fill-current" />
            )}
            {isFetching ? 'Fetching...' : 'Run'}
          </Button>
        </div>
      </div>

      {/* Response */}
      <div className="px-4 py-4">
        {!enabled ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-white/25 sm:py-12">
            <div className="mb-3 rounded-lg border border-dashed border-white/15 p-3">
              <Play className="h-5 w-5" />
            </div>
            <p className="text-xs">Press Run to make a live API request</p>
          </div>
        ) : metar ? (
          <>
            {/* Response header */}
            <div className="mb-4 flex items-center gap-2 text-xs">
              <span className="text-white/30">Response</span>
              <Badge className="border-green-500/30 bg-green-500/15 text-[10px] text-green-400">
                200 OK
              </Badge>
              {durationMs != null && (
                <span className="text-white/30">{durationMs}ms</span>
              )}
              {isFetching && (
                <Loader2 className="h-3 w-3 animate-spin text-white/30" />
              )}
            </div>

            {/* Flight category + station */}
            <div className="mb-4 flex items-center gap-2.5">
              {metar.flightCategory && (
                <Badge
                  className={`px-2.5 py-0.5 text-sm ${flightCategoryColors[metar.flightCategory] ?? ''}`}
                >
                  {metar.flightCategory}
                </Badge>
              )}
              <span className="font-mono text-lg font-bold text-white">
                {selectedIcao}
              </span>
              {metar.wxString && (
                <span className="text-sm text-white/50">{metar.wxString}</span>
              )}
            </div>

            {/* Weather data grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                  Temp
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">
                  {metar.tempC ?? '—'}°C
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                  Wind
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">
                  {metar.windDirDegrees ?? '—'}° @ {metar.windSpeedKt ?? '—'}kt
                  {metar.windGustKt ? ` G${metar.windGustKt}` : ''}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                  Visibility
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">
                  {metar.visibilityStatuteMi ?? '—'} SM
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                  Altimeter
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">
                  {metar.altimInHg?.toFixed(2) ?? '—'} inHg
                </div>
              </div>
            </div>

            {/* Sky conditions */}
            {metar.skyCondition && metar.skyCondition.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                  Sky Conditions
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {metar.skyCondition.map(
                    (
                      sc: {
                        skyCover?: string
                        cloudBaseFtAgl?: number | null
                      },
                      i: number,
                    ) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-white/10 text-xs text-white/80"
                      >
                        {sc.skyCover}
                        {sc.cloudBaseFtAgl != null
                          ? ` ${sc.cloudBaseFtAgl.toLocaleString()}'`
                          : ''}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Raw METAR */}
            {metar.rawText && (
              <div className="mt-3 rounded-md bg-white/5 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/40">
                {metar.rawText}
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="mt-2 text-xs text-white/40">
              Calling /metars/{selectedIcao}...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
            <p className="text-sm text-red-400/80">Failed to fetch METAR</p>
            <p className="mt-1 text-xs text-white/30">
              Try again in a moment
            </p>
          </div>
        ) : null}
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
        <div className="grid items-start gap-12 lg:grid-cols-[6fr_8fr]">
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
              Airports, runways, frequencies, airspace, NOTAMs, obstacles, and
              more — all with one API key. Your aviation data infrastructure,
              already built.
            </p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Built by a pilot and software engineer. All data sourced from the
              FAA and AWC.
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

          {/* Right: Live Demo */}
          <div className="relative min-w-0">
            <LiveMetarDemo />
            {/* Decorative glow */}
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
