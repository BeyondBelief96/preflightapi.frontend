import { cn } from '@/lib/utils'

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/15 text-green-400 border-green-500/30',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  PATCH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-bold',
        methodColors[method] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {method}
    </span>
  )
}
