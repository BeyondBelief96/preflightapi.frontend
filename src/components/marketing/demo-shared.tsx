import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function CardSkeleton({ message }: { message?: string }) {
  return (
    <div className="space-y-3 p-5">
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <p className="p-5 text-sm text-muted-foreground">{message}</p>
  )
}

export function DemoCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border bg-card">{children}</div>
}

export function DemoCardHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon
  title: string
}) {
  return (
    <div className="flex items-center gap-2 border-b px-5 py-3 text-sm font-semibold">
      <Icon className="h-4 w-4 text-accent" />
      {title}
    </div>
  )
}

export function EndpointFooter({
  endpoints,
}: {
  endpoints: Array<{ method: 'GET' | 'POST'; path: string }>
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
      <span>Endpoints used:</span>
      {endpoints.map((ep) => (
        <code
          key={`${ep.method} ${ep.path}`}
          className="rounded bg-muted/60 px-1.5 py-0.5 font-mono"
        >
          <span
            className={
              ep.method === 'POST'
                ? 'text-yellow-400'
                : 'text-green-400'
            }
          >
            {ep.method}
          </span>{' '}
          {ep.path}
        </code>
      ))}
    </div>
  )
}

export const flightCategoryColors: Record<string, string> = {
  VFR: 'bg-green-500/20 text-green-400 border-green-500/30',
  MVFR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IFR: 'bg-red-500/20 text-red-400 border-red-500/30',
  LIFR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}
