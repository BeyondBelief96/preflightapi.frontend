import { createServerFn } from '@tanstack/react-start'
import { scopeFilter } from '../gateway/analytics'
import { gatewayDb, isGatewayDbConfigured } from '../gateway/db'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'

const log = createLogger('admin')

// --- Abuse Detection ---

export interface AbuseIndicators {
  highErrorUsers: Array<{
    userId: string
    totalCalls: number
    errorCount: number
    errorRate: number
  }>
  rateLimitAbusers: Array<{
    userId: string
    count429: number
  }>
  trafficSpikes: Array<{
    userId: string
    avgHourly: number
    maxHourly: number
    spikeFactor: number
  }>
  suspiciousIps: Array<{
    ip: string
    callCount: number
    distinctUsers: number
    errorRate: number
  }>
  quotaExceeders: Array<{
    userId: string
    totalCalls: number
  }>
}

const EMPTY: AbuseIndicators = {
  highErrorUsers: [],
  rateLimitAbusers: [],
  trafficSpikes: [],
  suspiciousIps: [],
  quotaExceeders: [],
}

export const getAbuseIndicators = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AbuseIndicators> => {
    await requireAdmin()
    if (!isGatewayDbConfigured()) return EMPTY

    const sql = await gatewayDb()
    const scope = scopeFilter(sql, 'all')

    try {
      const [
        highErrorUsers,
        rateLimitAbusers,
        trafficSpikes,
        suspiciousIps,
        quotaExceeders,
      ] = await Promise.all([
        sql<AbuseIndicators['highErrorUsers']>`
          select user_id as "userId",
                 count(*)::int as "totalCalls",
                 (count(*) filter (where status >= 500))::int as "errorCount",
                 round(100.0 * count(*) filter (where status >= 500) / count(*), 2)::float8 as "errorRate"
          from gateway.api_requests
          where ts >= now() - interval '7 days' and user_id is not null ${scope}
          group by user_id
          having count(*) >= 50
             and 100.0 * count(*) filter (where status >= 500) / count(*) > 20
          order by "errorRate" desc
          limit 20`,
        sql<AbuseIndicators['rateLimitAbusers']>`
          select user_id as "userId", count(*)::int as "count429"
          from gateway.api_requests
          where ts >= now() - interval '7 days' and status = 429 and user_id is not null ${scope}
          group by user_id
          order by "count429" desc
          limit 20`,
        sql<AbuseIndicators['trafficSpikes']>`
          with hourly as (
            select user_id, date_trunc('hour', ts) as hour, count(*) as calls
            from gateway.api_requests
            where ts >= now() - interval '7 days' and user_id is not null ${scope}
            group by user_id, hour
          )
          select user_id as "userId",
                 avg(calls)::float8 as "avgHourly",
                 max(calls)::int as "maxHourly",
                 round((max(calls) / avg(calls))::numeric, 2)::float8 as "spikeFactor"
          from hourly
          group by user_id
          having max(calls) > avg(calls) * 3 and max(calls) > 100
          order by "spikeFactor" desc
          limit 20`,
        sql<AbuseIndicators['suspiciousIps']>`
          select client_ip as "ip",
                 count(*)::int as "callCount",
                 count(distinct user_id)::int as "distinctUsers",
                 round(100.0 * count(*) filter (where status >= 500) / count(*), 2)::float8 as "errorRate"
          from gateway.api_requests
          where ts >= now() - interval '24 hours' and client_ip is not null ${scope}
          group by client_ip
          having count(*) > 500 or count(distinct user_id) > 3
          order by "callCount" desc
          limit 20`,
        sql<AbuseIndicators['quotaExceeders']>`
          select user_id as "userId", count(*)::int as "totalCalls"
          from gateway.api_requests
          where ts >= now() - interval '30 days' and user_id is not null ${scope}
          group by user_id
          having count(*) > 5000
          order by "totalCalls" desc
          limit 20`,
      ])

      return {
        highErrorUsers: [...highErrorUsers],
        rateLimitAbusers: [...rateLimitAbusers],
        trafficSpikes: [...trafficSpikes],
        suspiciousIps: [...suspiciousIps],
        quotaExceeders: [...quotaExceeders],
      }
    } catch (err) {
      log.error({ err }, 'Failed to fetch abuse indicators')
      return EMPTY
    }
  },
)
