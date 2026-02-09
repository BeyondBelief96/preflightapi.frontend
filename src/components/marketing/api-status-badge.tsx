import { useQuery } from '@tanstack/react-query'
import { checkApiHealth } from '@/lib/server/health'
import type { ApiStatus } from '@/lib/server/health'

const statusConfig: Record<
  ApiStatus,
  { label: string; dotClass: string }
> = {
  operational: {
    label: 'All systems operational',
    dotClass: 'bg-aviation-success',
  },
  degraded: {
    label: 'Degraded performance',
    dotClass: 'bg-yellow-500',
  },
  down: {
    label: 'API unreachable',
    dotClass: 'bg-destructive',
  },
  unknown: {
    label: 'Checking status…',
    dotClass: 'bg-muted-foreground animate-pulse',
  },
}

export function ApiStatusBadge() {
  const { data } = useQuery({
    queryKey: ['api-health'],
    queryFn: () => checkApiHealth(),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  })

  const status = data?.status ?? 'unknown'
  const { label, dotClass } = statusConfig[status]

  return (
    <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </div>
  )
}
