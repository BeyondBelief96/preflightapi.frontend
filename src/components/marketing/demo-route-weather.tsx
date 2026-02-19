import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Cloud,
  CloudSun,
  FileText,
  Plane,
  Wind,
} from 'lucide-react'
import type {
  GAirmetDto,
  MetarDto,
  NotamDto,
  PirepDto,
  SigmetDto,
  TafDto,
} from '@/generated/api'
import { Badge } from '@/components/ui/badge'
import { fetchDemoRouteBriefing } from '@/lib/server/demo'
import {
  CardSkeleton,
  DemoCard,
  DemoCardHeader,
  ErrorCard,
  flightCategoryColors,
} from '@/components/marketing/demo-shared'

const HAZARD_LABELS: Record<string, string> = {
  CONVECTIVE: 'Convective',
  ICE: 'Icing',
  TURB: 'Turbulence',
  IFR: 'IFR',
  ASH: 'Volcanic Ash',
  MTN_OBSCN: 'Mtn Obscuration',
  MT_OBSC: 'Mtn Obscuration',
  TURB_HI: 'Turb (High)',
  TURB_LO: 'Turb (Low)',
  LLWS: 'Low-Level Wind Shear',
  SFC_WIND: 'Surface Wind',
  FZLVL: 'Freezing Level',
  M_FZLVL: 'Multi Freezing Level',
}

function CountBadge({
  label,
  count,
  variant,
}: {
  label: string
  count: number
  variant: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'muted'
}) {
  const colors = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <Badge className={colors[variant]}>
      {count} {label}
    </Badge>
  )
}

function MetarCard({ metar }: { metar: MetarDto }) {
  const catColors = flightCategoryColors[metar.flightCategory ?? ''] ?? ''
  return (
    <div className="flex items-start gap-3 px-5 py-3 text-sm">
      <span className="shrink-0 font-mono font-semibold">
        {metar.stationId}
      </span>
      {metar.flightCategory && (
        <Badge className={`shrink-0 ${catColors}`}>
          {metar.flightCategory}
        </Badge>
      )}
      <span className="font-mono text-xs text-muted-foreground">
        {metar.rawText}
      </span>
    </div>
  )
}

function TafCard({ taf }: { taf: TafDto }) {
  return (
    <div className="space-y-1 px-5 py-3">
      <span className="font-mono text-sm font-semibold">{taf.stationId}</span>
      <div className="rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
        {taf.rawText}
      </div>
    </div>
  )
}

function PirepCard({ pirep }: { pirep: PirepDto }) {
  return (
    <div className="space-y-1 px-5 py-3 text-sm">
      <div className="flex items-center gap-2">
        {pirep.aircraftRef && (
          <Badge variant="secondary" className="text-xs">
            {pirep.aircraftRef}
          </Badge>
        )}
        {pirep.altitudeFtMsl != null && (
          <span className="text-xs text-muted-foreground">
            {pirep.altitudeFtMsl.toLocaleString()} ft
          </span>
        )}
      </div>
      <div className="font-mono text-xs text-muted-foreground">
        {pirep.rawText}
      </div>
    </div>
  )
}

function SigmetCard({ sigmet }: { sigmet: SigmetDto }) {
  return (
    <div className="space-y-1 px-5 py-3 text-sm">
      <div className="flex items-center gap-2">
        {sigmet.hazard?.type && (
          <Badge variant="secondary" className="text-xs">
            {HAZARD_LABELS[sigmet.hazard.type] ?? sigmet.hazard.type}
          </Badge>
        )}
        {sigmet.hazard?.severity && (
          <Badge variant="outline" className="text-xs">
            {sigmet.hazard.severity}
          </Badge>
        )}
      </div>
      <div className="font-mono text-xs text-muted-foreground">
        {sigmet.rawText}
      </div>
    </div>
  )
}

function GAirmetCard({ airmet }: { airmet: GAirmetDto }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 text-sm">
      {airmet.hazard && (
        <Badge variant="secondary" className="text-xs">
          {HAZARD_LABELS[airmet.hazard] ?? airmet.hazard}
        </Badge>
      )}
      {airmet.product && (
        <Badge variant="outline" className="text-xs">
          {airmet.product}
        </Badge>
      )}
      {airmet.dueTo && (
        <span className="text-xs text-muted-foreground">{airmet.dueTo}</span>
      )}
    </div>
  )
}

function getNotamText(notam: NotamDto): string {
  const detail = notam.properties?.coreNOTAMData?.notam
  if (!detail) return '—'
  // Prefer translation, fall back to raw text
  const translations = notam.properties?.coreNOTAMData?.notamTranslation
  const simpleText = translations?.find((t) => t.simpleText)?.simpleText
  if (simpleText) return simpleText
  return detail.text ?? '—'
}

function NotamCard({ notam }: { notam: NotamDto }) {
  const detail = notam.properties?.coreNOTAMData?.notam
  return (
    <div className="space-y-1 px-5 py-3 text-sm">
      <div className="flex items-center gap-2">
        {detail?.location && (
          <span className="font-mono text-xs font-semibold">
            {detail.location}
          </span>
        )}
        {detail?.classification && (
          <Badge variant="outline" className="text-xs">
            {detail.classification}
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{getNotamText(notam)}</div>
    </div>
  )
}

export default function DemoRouteWeather() {
  const briefing = useQuery({
    queryKey: ['demo', 'briefing'],
    queryFn: () => fetchDemoRouteBriefing(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (briefing.isLoading) {
    return (
      <DemoCard>
        <CardSkeleton message="Fetching route weather briefing..." />
      </DemoCard>
    )
  }

  if (briefing.error) {
    return (
      <DemoCard>
        <ErrorCard message="Failed to fetch weather briefing. Please try again later." />
      </DemoCard>
    )
  }

  const data = briefing.data?.data
  if (!data) return null

  const summary = data.summary
  const metars = data.metars ?? []
  const tafs = data.tafs ?? []
  const pireps = data.pireps ?? []
  const sigmets = data.sigmets ?? []
  const gAirmets = data.gAirmets ?? []
  const notams = data.notams ?? []
  const MAX_NOTAMS = 5

  return (
    <div className="space-y-5">
      {/* Route header */}
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold">
          Weather Briefing:{' '}
          <span className="font-mono">KBNA</span>
          <span className="mx-2 text-muted-foreground/50">&rarr;</span>
          <span className="font-mono">KCLT</span>
        </h3>
        <Badge variant="secondary">25nm corridor</Badge>
      </div>

      {/* Summary badges */}
      {summary && (
        <div className="flex flex-wrap gap-2">
          <CountBadge
            label="METARs"
            count={summary.metarCount ?? 0}
            variant="blue"
          />
          <CountBadge
            label="TAFs"
            count={summary.tafCount ?? 0}
            variant="blue"
          />
          <CountBadge
            label="PIREPs"
            count={summary.pirepCount ?? 0}
            variant={summary.pirepCount ? 'yellow' : 'green'}
          />
          <CountBadge
            label="SIGMETs"
            count={summary.sigmetCount ?? 0}
            variant={summary.sigmetCount ? 'red' : 'green'}
          />
          <CountBadge
            label="G-AIRMETs"
            count={summary.gAirmetCount ?? 0}
            variant={summary.gAirmetCount ? 'yellow' : 'green'}
          />
          <CountBadge
            label="NOTAMs"
            count={summary.notamCount ?? 0}
            variant="muted"
          />
        </div>
      )}

      {/* Weather cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* METARs */}
        <DemoCard>
          <DemoCardHeader icon={Cloud} title="METARs" />
          {metars.length === 0 ? (
            <ErrorCard message="No METARs available" />
          ) : (
            <div className="divide-y">
              {metars.map((m, i) => (
                <MetarCard key={m.stationId ?? i} metar={m} />
              ))}
            </div>
          )}
        </DemoCard>

        {/* TAFs */}
        <DemoCard>
          <DemoCardHeader icon={CloudSun} title="TAFs" />
          {tafs.length === 0 ? (
            <ErrorCard message="No TAFs available" />
          ) : (
            <div className="divide-y">
              {tafs.map((t, i) => (
                <TafCard key={t.stationId ?? i} taf={t} />
              ))}
            </div>
          )}
        </DemoCard>

        {/* PIREPs */}
        <DemoCard>
          <DemoCardHeader icon={Plane} title="PIREPs" />
          {pireps.length === 0 ? (
            <div className="px-5 py-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                None reported
              </Badge>
            </div>
          ) : (
            <div className="divide-y">
              {pireps.map((p, i) => (
                <PirepCard key={p.id ?? i} pirep={p} />
              ))}
            </div>
          )}
        </DemoCard>

        {/* SIGMETs */}
        <DemoCard>
          <DemoCardHeader icon={AlertTriangle} title="SIGMETs" />
          {sigmets.length === 0 ? (
            <div className="px-5 py-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                None active
              </Badge>
            </div>
          ) : (
            <div className="divide-y">
              {sigmets.map((s, i) => (
                <SigmetCard key={s.id ?? i} sigmet={s} />
              ))}
            </div>
          )}
        </DemoCard>

        {/* G-AIRMETs */}
        <DemoCard>
          <DemoCardHeader icon={Wind} title="G-AIRMETs" />
          {gAirmets.length === 0 ? (
            <div className="px-5 py-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                None active
              </Badge>
            </div>
          ) : (
            <div className="divide-y">
              {gAirmets.map((a, i) => (
                <GAirmetCard key={a.id ?? i} airmet={a} />
              ))}
            </div>
          )}
        </DemoCard>

        {/* NOTAMs */}
        <DemoCard>
          <DemoCardHeader icon={FileText} title="NOTAMs" />
          {notams.length === 0 ? (
            <ErrorCard message="No NOTAMs available" />
          ) : (
            <div className="divide-y">
              {notams.slice(0, MAX_NOTAMS).map((n, i) => (
                <NotamCard key={n.id ?? i} notam={n} />
              ))}
              {notams.length > MAX_NOTAMS && (
                <p className="px-5 py-2 text-xs text-muted-foreground">
                  + {notams.length - MAX_NOTAMS} more NOTAMs
                </p>
              )}
            </div>
          )}
        </DemoCard>
      </div>
    </div>
  )
}
