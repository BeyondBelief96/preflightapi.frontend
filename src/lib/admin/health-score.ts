import type { UserHealthData } from '@/lib/server/apim/analytics'

export type HealthLevel = 'healthy' | 'warning' | 'critical'

export function computeHealthLevel(
  health: UserHealthData | undefined,
): HealthLevel {
  if (!health) return 'healthy'
  if (health.errorRate7d > 20 || health.rateLimitHits7d > 100) return 'critical'
  if (health.errorRate7d > 5 || health.rateLimitHits7d > 20) return 'warning'
  return 'healthy'
}

export const healthColors: Record<HealthLevel, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
}
