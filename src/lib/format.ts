export function statusColor(status: number): string {
  if (status >= 200 && status < 300)
    return 'bg-green-500/15 text-green-400 border-green-500/30'
  if (status >= 400 && status < 500)
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (status >= 500) return 'bg-red-500/15 text-red-400 border-red-500/30'
  return 'bg-muted text-muted-foreground'
}

export function maskApiKey(key: string): string {
  return key.slice(0, 6) + '••••••••••••••••••••••••••' + key.slice(-4)
}

export function getUsageColor(percent: number): string {
  if (percent > 85) return 'text-destructive'
  if (percent >= 60) return 'text-aviation-warning'
  return 'text-foreground'
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / Math.pow(1024, i)
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

export function cleanEndpointName(name: string): string {
  if (!name) return '—'
  return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatMs(ms: number): string {
  if (ms === 0) return '0 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}
