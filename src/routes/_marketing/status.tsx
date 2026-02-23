import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Server,
  Shield,
  Wrench,
  XCircle,
} from 'lucide-react'
import type { OverallStatus, ServiceStatus } from '@/types/health'
import { createPageHead } from '@/lib/seo'
import { fetchSystemHealth } from '@/lib/server/health'
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
          className={cn('h-8 w-8 shrink-0', `text-${getStatusColor(status)}`)}
        />
        <div>
          <p className="text-lg font-semibold">{config.label}</p>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'operational':
      return 'aviation-success'
    case 'degraded':
      return 'aviation-warning'
    case 'maintenance':
      return 'primary'
    case 'outage':
      return 'destructive'
  }
}

const SERVICE_ICONS: Record<string, typeof Shield> = {
  'API Gateway': Shield,
  'API Backend': Server,
}

function StatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: healthKeys.system(),
    queryFn: () => fetchSystemHealth(),
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

        {/* Backend health checks detail */}
        {data && data.backendChecks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Health Checks</CardTitle>
            </CardHeader>
            <CardContent className="-mt-2 space-y-3">
              {data.backendChecks.map((check) => {
                const isHealthy =
                  check.status === 'Healthy' || check.status === 'healthy'
                return (
                  <div
                    key={check.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <StatusDot
                        status={isHealthy ? 'operational' : 'degraded'}
                      />
                      <span className="text-sm capitalize">{check.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(Number(check.duration))} ms
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Footer info */}
        {data && (
          <p className="text-center text-xs text-muted-foreground">
            Last checked: {new Date(data.checkedAt).toLocaleTimeString()}{' '}
            &middot; Auto-refreshes every 30s
          </p>
        )}
      </section>
    </div>
  )
}
