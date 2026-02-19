import { useQuery } from '@tanstack/react-query'
import { Wind } from 'lucide-react'
import type { WindTempDto, WindsAloftSiteDto } from '@/generated/api'
import { Badge } from '@/components/ui/badge'
import { fetchDemoWindsAloft } from '@/lib/server/demo'
import {
  CardSkeleton,
  DemoCard,
  DemoCardHeader,
  ErrorCard,
} from '@/components/marketing/demo-shared'

// Route-relevant stations between KBNA and KCLT
const ROUTE_STATIONS = ['BNA', 'TYS', 'TRI', 'GSP', 'HKY', 'CLT']
const ALTITUDE_LEVELS = ['3000', '6000', '9000']

function formatWindCell(wt: WindTempDto | undefined): string {
  if (!wt) return '—'
  if (wt.speed === 0) return 'Calm'
  const dir = wt.direction != null ? `${wt.direction}°` : 'VRB'
  return `${dir}/${wt.speed}kt`
}

function formatTemp(wt: WindTempDto | undefined): string | null {
  if (!wt || wt.temperature == null) return null
  return `${wt.temperature > 0 ? '+' : ''}${wt.temperature.toFixed(0)}°C`
}

function formatValidityPeriod(start?: string, end?: string): string {
  if (!start || !end) return ''
  try {
    const s = new Date(start)
    const e = new Date(end)
    const fmt = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      hour12: false,
    })
    return `Valid ${fmt.format(s)} – ${fmt.format(e)}`
  } catch {
    return ''
  }
}

export default function DemoWindsAloft() {
  const winds = useQuery({
    queryKey: ['demo', 'winds-aloft'],
    queryFn: () => fetchDemoWindsAloft(),
    staleTime: 15 * 60 * 1000,
    retry: false,
  })

  if (winds.isLoading) {
    return (
      <DemoCard>
        <CardSkeleton message="Fetching winds aloft forecast..." />
      </DemoCard>
    )
  }

  if (winds.error) {
    return (
      <DemoCard>
        <ErrorCard message="Failed to fetch winds aloft data. Please try again later." />
      </DemoCard>
    )
  }

  const data = winds.data?.data
  if (!data) return null

  const allSites = data.windTemp ?? []
  // Filter to route-relevant stations (case-insensitive match)
  const routeSites = ROUTE_STATIONS.map((id) =>
    allSites.find(
      (s: WindsAloftSiteDto) => s.id?.toUpperCase() === id.toUpperCase(),
    ),
  ).filter(Boolean) as Array<WindsAloftSiteDto>

  const validPeriod = formatValidityPeriod(
    data.forUseStartTime,
    data.forUseEndTime,
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold">
          6-Hour Winds Aloft Forecast
        </h3>
        {validPeriod && (
          <Badge variant="secondary">{validPeriod}</Badge>
        )}
      </div>

      {/* Table */}
      <DemoCard>
        <DemoCardHeader icon={Wind} title="Wind & Temperature by Altitude" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="whitespace-nowrap px-3 py-2 text-left font-medium sm:px-4">Station</th>
                {ALTITUDE_LEVELS.map((alt) => (
                  <th key={alt} className="whitespace-nowrap px-3 py-2 text-center font-medium sm:px-4">
                    {Number(alt).toLocaleString()} ft
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {routeSites.map((site) => (
                <tr key={site.id}>
                  <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                    <span className="font-mono font-semibold">{site.id}</span>
                  </td>
                  {ALTITUDE_LEVELS.map((alt) => {
                    const wt = site.windTemp?.[alt]
                    const temp = formatTemp(wt)
                    return (
                      <td key={alt} className="whitespace-nowrap px-3 py-3 text-center sm:px-4">
                        <div className="font-mono text-sm">
                          {formatWindCell(wt)}
                        </div>
                        {temp && (
                          <div className="text-xs text-muted-foreground">
                            {temp}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {routeSites.length === 0 && (
                <tr>
                  <td
                    colSpan={ALTITUDE_LEVELS.length + 1}
                    className="px-3 py-6 text-center text-muted-foreground sm:px-4"
                  >
                    No route-relevant stations found in forecast data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DemoCard>

      {/* Info note */}
      <p className="text-xs text-muted-foreground">
        Winds aloft forecasts (FB) are issued by the NWS every 6 hours.
        Pilots use this data to calculate ground speed, fuel burn, and
        optimal cruising altitudes for cross-country flights.
      </p>
    </div>
  )
}
