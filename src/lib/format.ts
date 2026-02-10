export function statusColor(status: number): string {
  if (status >= 200 && status < 300)
    return 'bg-green-500/15 text-green-400 border-green-500/30'
  if (status >= 400 && status < 500)
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (status >= 500)
    return 'bg-red-500/15 text-red-400 border-red-500/30'
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
