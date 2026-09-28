import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  queryEndpointBreakdown,
  queryServiceHealth,
  queryUsageReport,
  scopeFilter,
} from '../gateway/analytics'
import { gatewayDb, isGatewayDbConfigured } from '../gateway/db'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'

const log = createLogger('admin')

// --- System Overview ---

export interface SystemOverview {
  callsToday: number
  callsWeek: number
  callsMonth: number
  activeUsers: number
  errorRate: number
  avgLatency: number
}

const EMPTY_OVERVIEW: SystemOverview = {
  callsToday: 0,
  callsWeek: 0,
  callsMonth: 0,
  activeUsers: 0,
  errorRate: 0,
  avgLatency: 0,
}

export const getSystemOverview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SystemOverview> => {
    await requireAdmin()
    if (!isGatewayDbConfigured()) return EMPTY_OVERVIEW

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setUTCHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() - 7)
    const monthStart = new Date(now)
    monthStart.setUTCDate(now.getUTCDate() - 30)

    const toIso = (d: Date) => d.toISOString()

    try {
      const sql = await gatewayDb()
      const [todayReport, weekReport, monthReport, [active]] =
        await Promise.all([
          queryUsageReport('all', toIso(todayStart), toIso(now)),
          queryUsageReport('all', toIso(weekStart), toIso(now)),
          queryUsageReport('all', toIso(monthStart), toIso(now)),
          sql<Array<{ activeUsers: number }>>`
            select count(distinct user_id)::int as "activeUsers"
            from gateway.api_requests
            where ts >= now() - interval '30 days' ${scopeFilter(sql, 'all')}
          `,
        ])

      const errorRate =
        monthReport.callCountTotal > 0
          ? (monthReport.callCountServerError / monthReport.callCountTotal) *
            100
          : 0

      return {
        callsToday: todayReport.callCountTotal,
        callsWeek: weekReport.callCountTotal,
        callsMonth: monthReport.callCountTotal,
        activeUsers: active?.activeUsers ?? 0,
        errorRate: Math.round(errorRate * 100) / 100,
        avgLatency: Math.round(monthReport.apiTimeAvg * 100) / 100,
      }
    } catch (err) {
      log.error({ err }, 'Failed to fetch system overview')
      return EMPTY_OVERVIEW
    }
  },
)

interface SystemDailyPoint {
  date: string
  calls: number
  clientErrors: number
  serverErrors: number
}

export const getSystemDailyTrend = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<SystemDailyPoint>> => {
    await requireAdmin()
    if (!isGatewayDbConfigured()) return []

    try {
      const sql = await gatewayDb()
      const rows = await sql<Array<SystemDailyPoint>>`
        select
          to_char(date_trunc('day', ts at time zone 'UTC'), 'YYYY-MM-DD') as "date",
          count(*)::int as "calls",
          (count(*) filter (where status between 400 and 499 and status <> 429))::int as "clientErrors",
          (count(*) filter (where status >= 500))::int as "serverErrors"
        from gateway.api_requests
        where ts >= now() - interval '30 days' ${scopeFilter(sql, 'all')}
        group by 1
        order by 1
      `
      return Array.from(rows)
    } catch (err) {
      log.error({ err }, 'Failed to fetch system daily trend')
      return []
    }
  },
)

export const getTopEndpoints = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return queryEndpointBreakdown('all', 15, { percentiles: true })
  },
)

export const getSystemServiceHealth = createServerFn({
  method: 'GET',
}).handler(async () => {
  await requireAdmin()
  return queryServiceHealth('all')
})

// --- Error Correlation ---

export interface ErrorCorrelation {
  timeWindow: string
  endpoint: string
  errorCode: number
  affectedUsers: number
  totalErrors: number
}

const errorCorrelationIntervals = {
  '1h': '1 hour',
  '6h': '6 hours',
  '24h': '24 hours',
  '7d': '7 days',
} as const

export const getErrorCorrelation = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      timeRange: z.enum(['1h', '6h', '24h', '7d']).default('24h'),
    }),
  )
  .handler(async ({ data }): Promise<Array<ErrorCorrelation>> => {
    await requireAdmin()
    if (!isGatewayDbConfigured()) return []

    try {
      const sql = await gatewayDb()
      const rows = await sql<
        Array<Omit<ErrorCorrelation, 'timeWindow'> & { hour: Date }>
      >`
        select
          date_trunc('hour', ts) as "hour",
          coalesce(operation_id, route_group, path) as "endpoint",
          status::int as "errorCode",
          count(distinct user_id)::int as "affectedUsers",
          count(*)::int as "totalErrors"
        from gateway.api_requests
        where ts >= now() - ${errorCorrelationIntervals[data.timeRange]}::interval
          and status >= 500 ${scopeFilter(sql, 'all')}
        group by 1, 2, 3
        having count(distinct user_id) >= 2
        order by 1 desc, "totalErrors" desc
        limit 50
      `
      return rows.map(({ hour, ...row }) => ({
        ...row,
        timeWindow: hour.toISOString(),
      }))
    } catch (err) {
      log.error({ err }, 'Failed to fetch error correlation')
      return []
    }
  })

// --- Endpoint Top Users ---

export interface EndpointTopUser {
  userId: string
  calls: number
  errorRate: number
  avgLatencyMs: number
}

export const getEndpointTopUsers = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      operationId: z.string().regex(/^[\w-]+$/, 'Invalid operation ID'),
      timeRange: z.enum(['7d', '30d']).default('30d'),
    }),
  )
  .handler(async ({ data }): Promise<Array<EndpointTopUser>> => {
    await requireAdmin()
    if (!isGatewayDbConfigured()) return []

    try {
      const sql = await gatewayDb()
      const rows = await sql<Array<EndpointTopUser>>`
        select
          user_id as "userId",
          count(*)::int as "calls",
          round(100.0 * count(*) filter (where status >= 400) / count(*), 1)::float8 as "errorRate",
          avg(latency_ms)::float8 as "avgLatencyMs"
        from gateway.api_requests
        where ts >= now() - ${data.timeRange === '7d' ? '7 days' : '30 days'}::interval
          and operation_id = ${data.operationId}
          and user_id is not null
          ${scopeFilter(sql, 'all')}
        group by user_id
        order by "calls" desc
        limit 20
      `
      return Array.from(rows)
    } catch (err) {
      log.error({ err }, 'Failed to fetch endpoint top users')
      return []
    }
  })
