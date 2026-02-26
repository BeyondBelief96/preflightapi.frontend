import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Clock,
  Database,
  Server,
  Shield,
  Wrench,
  XCircle,
} from 'lucide-react'
import type {
  BackendHealthCheck,
  DataCurrencyEntry,
  DataCurrencyStatus,
  OverallStatus,
  ServiceStatus,
} from '@/types/health'
import { createPageHead } from '@/lib/seo'
import { fetchDataCurrency, fetchSystemHealth } from '@/lib/server/health'
import { healthKeys } from '@/lib/server/apim-queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_marketing/status')({
  head: () =>
    createPageHead({
      title: 'System Status',
      description:
        'Check the current operational status of PreflightAPI services including the API gateway and backend.',
      path: '/status',
    }),
  component: StatusPage,
})

const STATUS_CONFIG: Record<
  ServiceStatus,
  {
    label: string
    description: string
    icon: typeof CheckCircle
    dotClass: string
    bannerClass: string
  }
> = {
  operational: {
    label: 'All Systems Operational',
    description: 'All services are running normally.',
    icon: CheckCircle,
    dotClass: 'bg-aviation-success',
    bannerClass: 'border-aviation-success/30 bg-aviation-success/5',
  },
  degraded: {
    label: 'Degraded Performance',
    description: 'Some services are experiencing issues.',
    icon: AlertTriangle,
    dotClass: 'bg-aviation-warning',
    bannerClass: 'border-aviation-warning/30 bg-aviation-warning/5',
  },
  maintenance: {
    label: 'Under Maintenance',
    description: 'Scheduled maintenance is in progress.',
    icon: Wrench,
    dotClass: 'bg-primary',
    bannerClass: 'border-primary/30 bg-primary/5',
  },
  outage: {
    label: 'Service Outage',
    description: 'One or more services are currently unavailable.',
    icon: XCircle,
    dotClass: 'bg-destructive',
    bannerClass: 'border-destructive/30 bg-destructive/5',
  },
}

function StatusDot({
  status,
  className,
}: {
  status: ServiceStatus
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn('relative flex h-3 w-3', className)}>
      {status === 'operational' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            config.dotClass,
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex h-3 w-3 rounded-full',
          config.dotClass,
        )}
      />
    </span>
  )
}

function OverallBanner({ status }: { status: OverallStatus }) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <Card className={cn('border-2', config.bannerClass)}>
      <CardContent className="flex items-center gap-4 py-2">
        <Icon
          className={cn(
            'h-8 w-8 shrink-0',
            status === 'operational' && 'text-aviation-success',
            status === 'degraded' && 'text-aviation-warning',
            status === 'maintenance' && 'text-primary',
            status === 'outage' && 'text-destructive',
          )}
        />
        <div>
          <p className="text-lg font-semibold">{config.label}</p>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const SERVICE_ICONS: Record<string, typeof Shield> = {
  'API Gateway': Shield,
  'API Backend': Server,
}

const CHECK_DISPLAY_NAMES: Record<string, string> = {
  database: 'Database',
  'blob-storage': 'Blob Storage',
  'noaa-weather': 'aviationweather.gov',
  'noaa-magvar': 'NOAA Geomagnetic Service',
  'faa-nms': 'FAA NOTAM Management Service',
}

function formatCheckName(name: string): string {
  return CHECK_DISPLAY_NAMES[name] ?? name
}

function checkStatusToServiceStatus(status: string): ServiceStatus {
  if (status === 'Healthy' || status === 'healthy') return 'operational'
  if (status === 'Unhealthy' || status === 'unhealthy') return 'outage'
  return 'degraded'
}

function renderChecks(checks: Array<BackendHealthCheck>) {
  return checks.map((check) => {
    const serviceStatus = checkStatusToServiceStatus(check.status)
    return (
      <div key={check.name} className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusDot status={serviceStatus} />
            <span className="text-sm">{formatCheckName(check.name)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(check.duration)} ms
          </span>
        </div>
        {check.description && (
          <p className="ml-6 text-xs text-muted-foreground">
            {check.description}
          </p>
        )}
      </div>
    )
  })
}

function HealthCheckGroups({ checks }: { checks: Array<BackendHealthCheck> }) {
  const ready = checks.filter((c) => c.tags?.includes('ready'))
  const external = checks.filter((c) => c.tags?.includes('external'))
  const other = checks.filter(
    (c) => !c.tags?.includes('ready') && !c.tags?.includes('external'),
  )

  return (
    <div className="space-y-4">
      {ready.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Core Services</CardTitle>
          </CardHeader>
          <CardContent className="-mt-2 space-y-3">
            {renderChecks(ready)}
          </CardContent>
        </Card>
      )}
      {external.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">External Dependencies</CardTitle>
          </CardHeader>
          <CardContent className="-mt-2 space-y-3">
            {renderChecks(external)}
          </CardContent>
        </Card>
      )}
      {other.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Other Checks</CardTitle>
          </CardHeader>
          <CardContent className="-mt-2 space-y-3">
            {renderChecks(other)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// --- Data Currency Section ---

const SEVERITY_CONFIG: Record<
  string,
  { dotClass: string; label: string; textClass: string }
> = {
  none: {
    dotClass: 'bg-aviation-success',
    label: 'Fresh',
    textClass: 'text-aviation-success',
  },
  info: {
    dotClass: 'bg-blue-400',
    label: 'Info',
    textClass: 'text-blue-400',
  },
  warning: {
    dotClass: 'bg-aviation-warning',
    label: 'Warning',
    textClass: 'text-aviation-warning',
  },
  critical: {
    dotClass: 'bg-destructive',
    label: 'Critical',
    textClass: 'text-destructive',
  },
}

const CURRENCY_STATUS_CONFIG: Record<
  string,
  {
    label: string
    icon: typeof CheckCircle
    bannerClass: string
    textClass: string
  }
> = {
  healthy: {
    label: 'All Data Fresh',
    icon: CheckCircle,
    bannerClass: 'border-aviation-success/30 bg-aviation-success/5',
    textClass: 'text-aviation-success',
  },
  degraded: {
    label: 'Some Data Stale',
    icon: AlertTriangle,
    bannerClass: 'border-aviation-warning/30 bg-aviation-warning/5',
    textClass: 'text-aviation-warning',
  },
  critical: {
    label: 'Critical Data Staleness',
    icon: XCircle,
    bannerClass: 'border-destructive/30 bg-destructive/5',
    textClass: 'text-destructive',
  },
  info: {
    label: 'Minor Data Delays',
    icon: AlertTriangle,
    bannerClass: 'border-blue-400/30 bg-blue-400/5',
    textClass: 'text-blue-400',
  },
}

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return 'Never'
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function formatCycleDate(isoDate: string | null): string {
  if (!isoDate) return 'Unknown'
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const SYNC_TYPE_DISPLAY_NAMES: Record<string, string> = {
  NotamDelta: 'NOTAMs',
  ObstacleDailyChange: 'Obstacle Daily Changes',
  GAirmet: 'G-AIRMETs',
  Metar: 'METARs',
  Taf: 'TAFs',
  Pirep: 'PIREPs',
  Sigmet: 'SIGMETs',
  SpecialUseAirspace: 'Special Use Airspace',
  ChartSupplement: 'Chart Supplements',
  TerminalProcedure: 'Terminal Procedures',
}

function formatSyncTypeName(syncType: string): string {
  return (
    SYNC_TYPE_DISPLAY_NAMES[syncType] ??
    // Fallback: convert PascalCase to spaced words
    syncType.replace(/([A-Z])/g, ' $1').trim()
  )
}

function SeverityDot({ severity }: { severity: string }) {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info
  return (
    <span className="relative flex h-2.5 w-2.5">
      {severity === 'none' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            config.dotClass,
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex h-2.5 w-2.5 rounded-full',
          config.dotClass,
        )}
      />
    </span>
  )
}

function DataCurrencyEntryRow({ entry }: { entry: DataCurrencyEntry }) {
  const severityConfig =
    SEVERITY_CONFIG[entry.severity] ?? SEVERITY_CONFIG.info

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <SeverityDot severity={entry.severity} />
        <span className="min-w-0 flex-1 truncate text-sm">
          {formatSyncTypeName(entry.syncType)}
        </span>
        <span
          className={cn(
            'w-[4.5rem] shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium',
            entry.isFresh
              ? 'bg-aviation-success/10 text-aviation-success'
              : `bg-current/10 ${severityConfig.textClass}`,
          )}
        >
          {severityConfig.label}
        </span>
        {entry.stalenessMode === 'CycleBased' ? (
          <span className="flex w-[7.5rem] shrink-0 items-center justify-end gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {formatCycleDate(entry.currentCycleDate)}
          </span>
        ) : (
          <span className="flex w-[7.5rem] shrink-0 items-center justify-end gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(entry.lastSuccessfulSync)}
          </span>
        )}
      </div>
      {!entry.isFresh && (
        <p className="ml-6 text-xs text-muted-foreground">{entry.message}</p>
      )}
      {entry.lastErrorMessage && !entry.isFresh && (
        <p className="ml-6 text-xs text-destructive/80">
          Error: {entry.lastErrorMessage}
        </p>
      )}
    </div>
  )
}

function DataCurrencySection({
  currency,
}: {
  currency: DataCurrencyStatus
}) {
  const statusConfig =
    CURRENCY_STATUS_CONFIG[currency.overallStatus] ??
    CURRENCY_STATUS_CONFIG.healthy
  const StatusIcon = statusConfig.icon

  // Group by data category rather than staleness mode so that non-weather
  // time-based entries (e.g. ObstacleDailyChange) don't land in "Weather Data"
  const WEATHER_SYNC_TYPES = new Set([
    'Metar',
    'Taf',
    'Pirep',
    'Sigmet',
    'GAirmet',
  ])
  const weatherData = currency.dataTypes.filter((d) =>
    WEATHER_SYNC_TYPES.has(d.syncType),
  )
  const publicationData = currency.dataTypes.filter(
    (d) => !WEATHER_SYNC_TYPES.has(d.syncType),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
          <Database className="h-5 w-5 text-accent" />
        </div>
        <h2 className="text-xl font-semibold">Data Currency</h2>
      </div>

      {/* Summary banner */}
      <Card className={cn('border', statusConfig.bannerClass)}>
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <StatusIcon className={cn('h-5 w-5', statusConfig.textClass)} />
            <span className="font-medium">{statusConfig.label}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{currency.summary.fresh} fresh</span>
            {currency.summary.stale > 0 && (
              <span className="text-destructive">
                {currency.summary.stale} stale
              </span>
            )}
            <span>{currency.summary.total} total</span>
          </div>
        </CardContent>
      </Card>

      {/* Weather Data (TimeBased) */}
      {weatherData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weather Data</CardTitle>
            <p className="text-xs text-muted-foreground">
              Synced continuously — timestamps show time since last successful
              update
            </p>
          </CardHeader>
          <CardContent className="-mt-2 space-y-3">
            {weatherData.map((entry) => (
              <DataCurrencyEntryRow key={entry.syncType} entry={entry} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* FAA Aeronautical Data — split cycle-based vs time-based */}
      {publicationData.length > 0 &&
        (() => {
          const cycleBased = publicationData.filter(
            (d) => d.stalenessMode === 'CycleBased',
          )
          const timeBased = publicationData.filter(
            (d) => d.stalenessMode !== 'CycleBased',
          )
          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  FAA Aeronautical Data
                </CardTitle>
              </CardHeader>
              <CardContent className="-mt-2 space-y-5">
                {cycleBased.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Publication cycle — dates show the current effective cycle
                    </p>
                    {cycleBased.map((entry) => (
                      <DataCurrencyEntryRow
                        key={entry.syncType}
                        entry={entry}
                      />
                    ))}
                  </div>
                )}
                {timeBased.length > 0 && (
                  <div className="space-y-3">
                    {cycleBased.length > 0 && (
                      <div className="border-t border-border" />
                    )}
                    <p className="text-xs font-medium text-muted-foreground">
                      Incremental updates — timestamps show time since last
                      successful sync
                    </p>
                    {timeBased.map((entry) => (
                      <DataCurrencyEntryRow
                        key={entry.syncType}
                        entry={entry}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })()}
    </div>
  )
}

function StatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: healthKeys.system(),
    queryFn: () => fetchSystemHealth(),
    refetchInterval: 30_000,
  })

  const { data: currency, isLoading: currencyLoading } = useQuery({
    queryKey: healthKeys.dataCurrency(),
    queryFn: () => fetchDataCurrency(),
    refetchInterval: 30_000,
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Activity className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            System Status
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Real-time operational status for PreflightAPI services.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-8 px-4 pb-20 sm:px-6 lg:px-8">
        {/* Overall status banner */}
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : data ? (
          <OverallBanner status={data.overall} />
        ) : null}

        {/* Service cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))
            : data?.services.map((service) => {
                const Icon = SERVICE_ICONS[service.name] ?? Server
                return (
                  <Card key={service.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                            <Icon className="h-5 w-5 text-accent" />
                          </div>
                          <CardTitle className="text-base">
                            {service.name}
                          </CardTitle>
                        </div>
                        <StatusDot status={service.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="-mt-2">
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
        </div>

        {/* Backend health checks detail — grouped by tags */}
        {data && data.backendChecks.length > 0 && (
          <HealthCheckGroups checks={data.backendChecks} />
        )}

        {/* Data Currency */}
        {currencyLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : currency ? (
          <DataCurrencySection currency={currency} />
        ) : null}

        {/* Footer info */}
        {data && (
          <p className="text-center text-xs text-muted-foreground">
            Last checked: {new Date(data.checkedAt).toLocaleTimeString()}
            {data.lastCheckedAt && (
              <>
                {' '}
                &middot; Backend checks ran{' '}
                {formatRelativeTime(data.lastCheckedAt)}
              </>
            )}
            {' '}&middot; Auto-refreshes every 30s
          </p>
        )}
      </section>
    </div>
  )
}
