import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cloud, MapPin, Plane, Radio, Search } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import {
  fetchDemoAirport,
  fetchDemoFrequencies,
  fetchDemoMetar,
  fetchDemoRunways,
} from '@/lib/server/demo'
import {
  CardSkeleton,
  DemoCard,
  DemoCardHeader,
  ErrorCard,
  flightCategoryColors,
} from '@/components/marketing/demo-shared'

const popularAirports = [
  { icao: 'KJFK', name: 'John F Kennedy Intl', city: 'New York, NY' },
  { icao: 'KLAX', name: 'Los Angeles Intl', city: 'Los Angeles, CA' },
  { icao: 'KORD', name: "O'Hare Intl", city: 'Chicago, IL' },
  { icao: 'KATL', name: 'Hartsfield-Jackson', city: 'Atlanta, GA' },
  { icao: 'KDFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas, TX' },
  { icao: 'KDEN', name: 'Denver Intl', city: 'Denver, CO' },
  { icao: 'KSFO', name: 'San Francisco Intl', city: 'San Francisco, CA' },
  { icao: 'KSEA', name: 'Seattle-Tacoma Intl', city: 'Seattle, WA' },
  { icao: 'KMIA', name: 'Miami Intl', city: 'Miami, FL' },
  { icao: 'KBOS', name: 'Logan Intl', city: 'Boston, MA' },
  { icao: 'KPHX', name: 'Phoenix Sky Harbor', city: 'Phoenix, AZ' },
  { icao: 'KLAS', name: 'Harry Reid Intl', city: 'Las Vegas, NV' },
  { icao: 'KMSP', name: 'Minneapolis-St Paul Intl', city: 'Minneapolis, MN' },
  { icao: 'KDTW', name: 'Detroit Metro Wayne Co', city: 'Detroit, MI' },
  { icao: 'KPHL', name: 'Philadelphia Intl', city: 'Philadelphia, PA' },
  { icao: 'KIAD', name: 'Washington Dulles Intl', city: 'Washington, DC' },
  { icao: 'KSAN', name: 'San Diego Intl', city: 'San Diego, CA' },
  { icao: 'KTPA', name: 'Tampa Intl', city: 'Tampa, FL' },
  { icao: 'KAUS', name: 'Austin-Bergstrom Intl', city: 'Austin, TX' },
  { icao: 'KOSH', name: 'Wittman Regional', city: 'Oshkosh, WI' },
]

export function AirportExplorerContent() {
  const [selectedIcao, setSelectedIcao] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    if (!searchOpen) return
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [searchOpen])

  const airport = useQuery({
    queryKey: ['demo', 'airport', selectedIcao],
    queryFn: () => fetchDemoAirport({ data: { icao: selectedIcao! } }),
    enabled: !!selectedIcao,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const metar = useQuery({
    queryKey: ['demo', 'metar', selectedIcao],
    queryFn: () => fetchDemoMetar({ data: { icao: selectedIcao! } }),
    enabled: !!selectedIcao,
    staleTime: 2 * 60 * 1000,
    retry: false,
  })

  const runways = useQuery({
    queryKey: ['demo', 'runways', selectedIcao],
    queryFn: () => fetchDemoRunways({ data: { icao: selectedIcao! } }),
    enabled: !!selectedIcao,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  // Frequencies uses arptId (no K prefix) from the airport response
  const facilityId =
    airport.data?.data?.arptId ??
    (selectedIcao?.startsWith('K') && selectedIcao.length === 4
      ? selectedIcao.slice(1)
      : selectedIcao)

  const frequencies = useQuery({
    queryKey: ['demo', 'frequencies', facilityId],
    queryFn: () =>
      fetchDemoFrequencies({ data: { facilityId: facilityId! } }),
    enabled: !!facilityId && !!selectedIcao,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  function handleSelect(icao: string) {
    setSelectedIcao(icao.toUpperCase())
    setSearchOpen(false)
  }

  return (
    <>
      {/* Search bar */}
      <div className="relative mx-auto max-w-md" ref={searchRef}>
        <Command
          shouldFilter={true}
          className="h-auto overflow-visible rounded-xl border border-white/15 bg-white/[0.06] shadow-lg shadow-black/20 backdrop-blur-xl [&_[data-slot=command-input-wrapper]]:border-b-0"
        >
          <CommandInput
            className="h-11"
            placeholder="Filter airports..."
            onFocus={() => setSearchOpen(true)}
          />
          {searchOpen && (
            <CommandList className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-52 overflow-y-auto rounded-xl border border-white/15 bg-card/95 shadow-xl shadow-black/30 backdrop-blur-xl">
              <CommandEmpty>No matching airports found.</CommandEmpty>
              <CommandGroup heading="Select an Airport">
                {popularAirports.map((apt) => (
                  <CommandItem
                    key={apt.icao}
                    value={`${apt.icao} ${apt.name} ${apt.city}`}
                    onSelect={() => handleSelect(apt.icao)}
                    className="py-1 text-xs data-[selected=true]:bg-accent/15 data-[selected=true]:text-foreground"
                  >
                    <Search className="h-3 w-3" />
                    <span className="font-mono font-semibold">
                      {apt.icao}
                    </span>
                    <span className="opacity-70">
                      {apt.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </div>

      {/* Data cards */}
      {selectedIcao && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/* Airport Info */}
          <DemoCard>
            <DemoCardHeader icon={MapPin} title="Airport Info" />
            {airport.isLoading ? (
              <CardSkeleton />
            ) : airport.error ? (
              <ErrorCard message="Failed to load airport data" />
            ) : airport.data ? (
              <div className="space-y-2 p-5 text-sm">
                <div className="text-lg font-bold">
                  {airport.data.data.arptName}
                </div>
                <div className="text-muted-foreground">
                  {airport.data.data.city}, {airport.data.data.stateCode}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      ICAO
                    </span>
                    <div className="font-mono font-semibold">
                      {airport.data.data.icaoId}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      FAA ID
                    </span>
                    <div className="font-mono font-semibold">
                      {airport.data.data.arptId}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Elevation
                    </span>
                    <div className="font-semibold">
                      {airport.data.data.elev?.toLocaleString() ?? '—'} ft
                      MSL
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Coordinates
                    </span>
                    <div className="font-mono text-xs">
                      {airport.data.data.latDecimal?.toFixed(4)},{' '}
                      {airport.data.data.longDecimal?.toFixed(4)}
                    </div>
                  </div>
                  {airport.data.data.fuelTypes && (
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground">
                        Fuel
                      </span>
                      <div className="flex gap-1.5">
                        {airport.data.data.fuelTypes
                          .split(',')
                          .map((f: string) => (
                            <Badge
                              key={f}
                              variant="secondary"
                              className="text-xs"
                            >
                              {f.trim()}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DemoCard>

          {/* Weather */}
          <DemoCard>
            <DemoCardHeader icon={Cloud} title="Weather (METAR)" />
            {metar.isLoading ? (
              <CardSkeleton />
            ) : metar.error ? (
              <ErrorCard message="No METAR available for this station" />
            ) : metar.data ? (
              <div className="space-y-3 p-5 text-sm">
                <div className="flex items-center gap-2">
                  {metar.data.data.flightCategory && (
                    <Badge
                      className={
                        flightCategoryColors[
                          metar.data.data.flightCategory
                        ] ?? ''
                      }
                    >
                      {metar.data.data.flightCategory}
                    </Badge>
                  )}
                  {metar.data.data.wxString && (
                    <span className="text-muted-foreground">
                      {metar.data.data.wxString}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Temperature
                    </span>
                    <div className="font-semibold">
                      {metar.data.data.tempC ?? '—'}°C
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Wind
                    </span>
                    <div className="font-semibold">
                      {metar.data.data.windDirDegrees ?? '—'}° @{' '}
                      {metar.data.data.windSpeedKt ?? '—'}kt
                      {metar.data.data.windGustKt
                        ? ` G${metar.data.data.windGustKt}`
                        : ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Visibility
                    </span>
                    <div className="font-semibold">
                      {metar.data.data.visibilityStatuteMi ?? '—'} SM
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Altimeter
                    </span>
                    <div className="font-semibold">
                      {metar.data.data.altimInHg?.toFixed(2) ?? '—'} inHg
                    </div>
                  </div>
                </div>
                {metar.data.data.skyCondition &&
                  metar.data.data.skyCondition.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Sky
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {metar.data.data.skyCondition.map(
                          (
                            sc: { skyCover?: string; cloudBaseFtAgl?: number | null },
                            i: number,
                          ) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
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
                <div className="mt-2 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
                  {metar.data.data.rawText}
                </div>
              </div>
            ) : null}
          </DemoCard>

          {/* Runways */}
          <DemoCard>
            <DemoCardHeader icon={Plane} title="Runways" />
            {runways.isLoading ? (
              <CardSkeleton />
            ) : runways.error ? (
              <ErrorCard message="Failed to load runway data" />
            ) : runways.data ? (
              <div className="divide-y">
                {runways.data.data.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    No runway data available
                  </p>
                ) : (
                  runways.data.data.map(
                    (
                      rwy: {
                        id?: string | null
                        runwayId?: string | null
                        length?: number | null
                        width?: number | null
                        surfaceType?: string | null
                        edgeLightIntensity?: string | null
                      },
                      i: number,
                    ) => (
                      <div
                        key={rwy.id ?? i}
                        className="flex items-center justify-between px-5 py-3 text-sm"
                      >
                        <div>
                          <span className="font-mono font-semibold">
                            {rwy.runwayId ?? '—'}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {rwy.length?.toLocaleString() ?? '—'} x{' '}
                            {rwy.width ?? '—'} ft
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {rwy.surfaceType && (
                            <Badge variant="secondary" className="text-xs">
                              {rwy.surfaceType}
                            </Badge>
                          )}
                          {rwy.edgeLightIntensity && (
                            <span className="text-xs text-muted-foreground">
                              {rwy.edgeLightIntensity}
                            </span>
                          )}
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            ) : null}
          </DemoCard>

          {/* Frequencies */}
          <DemoCard>
            <DemoCardHeader icon={Radio} title="Frequencies" />
            {frequencies.isLoading ? (
              <CardSkeleton />
            ) : frequencies.error ? (
              <ErrorCard message="Failed to load frequency data" />
            ) : frequencies.data ? (
              <div className="divide-y">
                {frequencies.data.data.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    No frequency data available
                  </p>
                ) : (
                  frequencies.data.data.slice(0, 10).map(
                    (
                      freq: {
                        id?: string | null
                        frequency?: string | null
                        frequencyUse?: string | null
                        towerOrCommCall?: string | null
                      },
                      i: number,
                    ) => (
                      <div
                        key={freq.id ?? i}
                        className="flex items-center justify-between px-5 py-2.5 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {freq.frequencyUse && (
                            <Badge
                              variant="secondary"
                              className="min-w-[60px] justify-center text-xs"
                            >
                              {freq.frequencyUse}
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            {freq.towerOrCommCall ?? ''}
                          </span>
                        </div>
                        <span className="font-mono font-semibold">
                          {freq.frequency ?? '—'}
                        </span>
                      </div>
                    ),
                  )
                )}
                {frequencies.data.data.length > 10 && (
                  <p className="px-5 py-2 text-xs text-muted-foreground">
                    + {frequencies.data.data.length - 10} more frequencies
                  </p>
                )}
              </div>
            ) : null}
          </DemoCard>
        </div>
      )}

      {!selectedIcao && (
        <div className="mt-10 text-center text-muted-foreground">
          <MapPin className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-4 text-sm">
            Select an airport above to explore live API data
          </p>
        </div>
      )}
    </>
  )
}
