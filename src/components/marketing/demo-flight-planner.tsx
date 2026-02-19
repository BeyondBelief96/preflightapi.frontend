import { useQuery } from '@tanstack/react-query'
import { Fuel, Gauge, Navigation, Plane, Timer } from 'lucide-react'
import type { NavigationLegDto } from '@/generated/api'
import { Badge } from '@/components/ui/badge'
import { fetchDemoNavlog } from '@/lib/server/demo'
import {
  CardSkeleton,
  DemoCard,
  DemoCardHeader,
} from '@/components/marketing/demo-shared'

function formatTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatWind(dir?: number | null, speed?: number | null): string {
  if (dir == null && speed == null) return '—'
  if (speed === 0) return 'Calm'
  return `${dir ?? '—'}°/${speed ?? '—'}kt`
}

function isSpecialLeg(leg: NavigationLegDto): boolean {
  const name = leg.legEndPoint?.name?.toLowerCase() ?? ''
  return (
    name.includes('top of climb') ||
    name.includes('top of descent') ||
    name.includes('bottom of descent')
  )
}

function shortLabel(name?: string): string {
  if (!name) return '—'
  const lower = name.toLowerCase()
  if (lower.includes('top of climb')) return 'TOC'
  if (lower.includes('top of descent')) return 'TOD'
  if (lower.includes('bottom of descent')) return 'BOD'
  return name
}

const AIRCRAFT_SPECS = [
  { label: 'Cruise TAS', value: '110 kt' },
  { label: 'Climb TAS', value: '75 kt' },
  { label: 'Descent TAS', value: '90 kt' },
  { label: 'Climb Rate', value: '500 fpm' },
  { label: 'Descent Rate', value: '500 fpm' },
  { label: 'Cruise Fuel', value: '8.5 gph' },
  { label: 'Climb Fuel', value: '10 gph' },
  { label: 'Descent Fuel', value: '6 gph' },
  { label: 'STT Fuel', value: '1.5 gal' },
  { label: 'Fuel on Board', value: '40 gal' },
]

export default function DemoFlightPlanner() {
  const navlog = useQuery({
    queryKey: ['demo', 'navlog'],
    queryFn: () => fetchDemoNavlog(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

  if (navlog.isLoading) {
    return (
      <DemoCard>
        <CardSkeleton message="Calculating flight plan with live winds..." />
      </DemoCard>
    )
  }

  if (navlog.error) {
    return (
      <DemoCard>
        <p className="p-5 text-sm text-muted-foreground">
          Failed to calculate flight plan. Please try again later.
        </p>
      </DemoCard>
    )
  }

  const data = navlog.data?.data
  if (!data) return null

  const legs = data.legs ?? []

  return (
    <div className="space-y-5">
      {/* Route header */}
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold">
          <span className="font-mono">KBNA</span>{' '}
          <span className="text-muted-foreground">Nashville</span>
          <span className="mx-2 text-muted-foreground/50">&rarr;</span>
          <span className="font-mono">KCLT</span>{' '}
          <span className="text-muted-foreground">Charlotte</span>
        </h3>
        <Badge variant="secondary">Cessna 172</Badge>
        <Badge variant="secondary">5,500 ft</Badge>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Navigation className="h-3 w-3" />
            Total Distance
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.totalRouteDistance?.toFixed(0) ?? '—'}{' '}
            <span className="text-sm font-normal text-muted-foreground">nm</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="h-3 w-3" />
            En Route Time
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.totalRouteTimeHours
              ? formatTime(data.totalRouteTimeHours)
              : '—'}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Fuel className="h-3 w-3" />
            Fuel Used
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.totalFuelUsed?.toFixed(1) ?? '—'}{' '}
            <span className="text-sm font-normal text-muted-foreground">gal</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="h-3 w-3" />
            Avg Wind
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.averageWindComponent != null ? (
              <>
                {data.averageWindComponent > 0 ? '+' : ''}
                {data.averageWindComponent.toFixed(0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  kt {data.averageWindComponent >= 0 ? 'tail' : 'head'}
                </span>
              </>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        {/* Navigation leg table */}
        <DemoCard>
          <DemoCardHeader icon={Navigation} title="Navigation Log" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="whitespace-nowrap px-3 py-2 text-left font-medium">From</th>
                  <th className="whitespace-nowrap px-3 py-2 text-left font-medium">To</th>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                    Crs °M
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                    Hdg °M
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                    Dist
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-medium">GS</th>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                    Fuel Rem
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Wind</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {legs.map((leg, i) => {
                  const special = isSpecialLeg(leg)
                  return (
                    <tr
                      key={i}
                      className={
                        special
                          ? 'bg-muted/30 text-muted-foreground italic'
                          : ''
                      }
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                        {leg.legStartPoint?.id ??
                          shortLabel(leg.legStartPoint?.name)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                        {leg.legEndPoint?.id ??
                          shortLabel(leg.legEndPoint?.name)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                        {leg.magneticCourse?.toFixed(0) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                        {leg.magneticHeading?.toFixed(0) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                        {leg.legDistance?.toFixed(1) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                        {leg.groundSpeed?.toFixed(0) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                        {leg.remainingFuelGals?.toFixed(1) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-xs">
                        {formatWind(leg.windDir, leg.windSpeed)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </DemoCard>

        {/* Aircraft performance sidebar */}
        <DemoCard>
          <DemoCardHeader icon={Plane} title="Aircraft" />
          <div className="divide-y">
            {AIRCRAFT_SPECS.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span className="text-muted-foreground">{spec.label}</span>
                <span className="font-mono font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </DemoCard>
      </div>
    </div>
  )
}
