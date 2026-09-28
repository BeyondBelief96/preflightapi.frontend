import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAuth } from '../auth'
import { createLogger } from '../logger'
import { gatewayDb, isGatewayDbConfigured } from './db'
import type { Fragment, Sql } from 'postgres'
import type {
  DailyUsagePoint,
  EndpointBreakdownItem,
  ErrorCodeBreakdownItem,
  RateLimitAccessStats,
  RecentError,
  RequestLogEntry,
  RequestLogFilter,
  RequestLogTimeRange,
  ServiceHealthStats,
  ServiceIssue,
  UsageReport,
} from '@/types/plans'
import { env } from '@/env'

const log = createLogger('usage-analytics')

/**
 * Whose requests to include: one user, or everyone (admin views). Marketing
 * demo traffic (DEMO_USER_ID) is always excluded.
 */
export type UsageScope = { userId: string } | 'all'

const ZERO_REPORT: UsageReport = {
  callCountTotal: 0,
  callCountSuccess: 0,
  callCountBlocked: 0,
  callCountClientError: 0,
  callCountServerError: 0,
  callCountOther: 0,
  bandwidth: 0,
  apiTimeAvg: 0,
  apiTimeMin: 0,
  apiTimeMax: 0,
}

const ZERO_RATE_LIMIT_ACCESS: RateLimitAccessStats = {
  rateLimitHits: 0,
  quotaExceeded: 0,
  tierRestricted: 0,
  tierRestrictedEndpoints: [],
}

const ZERO_SERVICE_HEALTH: ServiceHealthStats = {
  totalIssues: 0,
  backendErrors: 0,
  backendUnavailable: 0,
  recentIssues: [],
}

/** `and ...` filter for the scope, always excluding demo traffic. */
export function scopeFilter(sql: Sql, scope: UsageScope): Fragment {
  const excludeDemo = sql`and user_id is distinct from ${env.DEMO_USER_ID}`
  return scope === 'all'
    ? excludeDemo
    : sql`and user_id = ${scope.userId} ${excludeDemo}`
}

/** Runs an analytics query, returning `fallback` if the database isn't configured or the query fails. */
async function safely<T>(
  label: string,
  fallback: T,
  query: () => Promise<T>,
): Promise<T> {
  if (!isGatewayDbConfigured()) return fallback
  try {
    const result = await query()
    // postgres.js returns RowList (an Array subclass); hand plain arrays to
    // the server-function serializer.
    return (Array.isArray(result) ? Array.from(result) : result) as T
  } catch (err) {
    log.error({ err }, `Failed to query ${label}`)
    return fallback
  }
}

export function queryUsageReport(
  scope: UsageScope,
  fromDate: string,
  toDate: string,
): Promise<UsageReport> {
  return safely('usage report', ZERO_REPORT, async () => {
    const sql = await gatewayDb()
    const [row] = await sql<Array<UsageReport>>`
      select
        count(*)::int as "callCountTotal",
        (count(*) filter (where status between 200 and 299))::int as "callCountSuccess",
        (count(*) filter (where status = 429))::int as "callCountBlocked",
        (count(*) filter (where status between 400 and 499 and status <> 429))::int as "callCountClientError",
        (count(*) filter (where status >= 500))::int as "callCountServerError",
        (count(*) filter (where status < 200 or status between 300 and 399))::int as "callCountOther",
        coalesce(sum(response_bytes), 0)::float8 as "bandwidth",
        coalesce(avg(latency_ms), 0)::float8 as "apiTimeAvg",
        coalesce(min(latency_ms), 0)::int as "apiTimeMin",
        coalesce(max(latency_ms), 0)::int as "apiTimeMax"
      from gateway.api_requests
      where ts >= ${new Date(fromDate)} and ts < ${new Date(toDate)}
        ${scopeFilter(sql, scope)}
    `
    return row ?? ZERO_REPORT
  })
}

/** Calls per UTC day over the last 30 days. */
export function queryDailyTrend(
  scope: UsageScope,
): Promise<Array<DailyUsagePoint>> {
  return safely<Array<DailyUsagePoint>>('daily trend', [], async () => {
    const sql = await gatewayDb()
    return sql<Array<DailyUsagePoint>>`
      select to_char(date_trunc('day', ts at time zone 'UTC'), 'YYYY-MM-DD') as "date",
             count(*)::int as "calls"
      from gateway.api_requests
      where ts >= now() - interval '30 days' ${scopeFilter(sql, scope)}
      group by 1
      order by 1
    `
  })
}

export function queryEndpointBreakdown(
  scope: UsageScope,
  topN = 10,
  options?: { percentiles?: boolean },
): Promise<Array<EndpointBreakdownItem>> {
  return safely<Array<EndpointBreakdownItem>>(
    'endpoint breakdown',
    [],
    async () => {
      const sql = await gatewayDb()
      const percentiles = options?.percentiles
        ? sql`,
        percentile_cont(0.5) within group (order by latency_ms)::float8 as "p50LatencyMs",
        percentile_cont(0.95) within group (order by latency_ms)::float8 as "p95LatencyMs",
        percentile_cont(0.99) within group (order by latency_ms)::float8 as "p99LatencyMs"`
        : sql``
      return sql<Array<EndpointBreakdownItem>>`
      select
        operation_id as "endpoint",
        count(*)::int as "calls",
        round(100.0 * count(*) filter (where status between 400 and 499 and status <> 429) / count(*), 1)::float8 as "clientErrorRate",
        round(100.0 * count(*) filter (where status >= 500) / count(*), 1)::float8 as "serverErrorRate",
        avg(latency_ms)::float8 as "avgLatencyMs"
        ${percentiles}
      from gateway.api_requests
      where ts >= now() - interval '30 days'
        and operation_id is not null
        ${scopeFilter(sql, scope)}
      group by operation_id
      order by "calls" desc
      limit ${topN}
    `
    },
  )
}

export function queryErrorBreakdown(
  scope: UsageScope,
): Promise<Array<ErrorCodeBreakdownItem>> {
  return safely<Array<ErrorCodeBreakdownItem>>(
    'error breakdown',
    [],
    async () => {
      const sql = await gatewayDb()
      return sql<Array<ErrorCodeBreakdownItem>>`
      select status::int as "statusCode", count(*)::int as "count"
      from gateway.api_requests
      where ts >= now() - interval '30 days' and status >= 400 ${scopeFilter(sql, scope)}
      group by status
      order by "count" desc
      limit 10
    `
    },
  )
}

export function queryRecentErrors(
  scope: UsageScope,
): Promise<Array<RecentError>> {
  return safely('recent errors', [], async () => {
    const sql = await gatewayDb()
    const rows = await sql<
      Array<{ ts: Date; endpoint: string; statusCode: number; method: string }>
    >`
      select ts, coalesce(operation_id, path) as "endpoint", status::int as "statusCode", method
      from gateway.api_requests
      where ts >= now() - interval '24 hours' and status >= 400 ${scopeFilter(sql, scope)}
      order by ts desc
      limit 20
    `
    return rows.map(({ ts, ...r }) => ({ ...r, timestamp: ts.toISOString() }))
  })
}

export function queryRateLimitAccess(
  scope: UsageScope,
): Promise<RateLimitAccessStats> {
  return safely('rate limit access', ZERO_RATE_LIMIT_ACCESS, async () => {
    const sql = await gatewayDb()
    const [stats] = await sql<
      Array<Omit<RateLimitAccessStats, 'tierRestrictedEndpoints'>>
    >`
      select
        (count(*) filter (where error_code = 'RATE_LIMIT_EXCEEDED'))::int as "rateLimitHits",
        (count(*) filter (where error_code = 'QUOTA_EXCEEDED'))::int as "quotaExceeded",
        (count(*) filter (where error_code = 'TIER_RESTRICTED'))::int as "tierRestricted"
      from gateway.api_requests
      where ts >= now() - interval '30 days'
        and error_code in ('RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED', 'TIER_RESTRICTED')
        ${scopeFilter(sql, scope)}
    `
    const endpoints = await sql<Array<{ endpoint: string; count: number }>>`
      select coalesce(operation_id, route_group, path) as "endpoint", count(*)::int as "count"
      from gateway.api_requests
      where ts >= now() - interval '30 days' and error_code = 'TIER_RESTRICTED' ${scopeFilter(sql, scope)}
      group by 1
      order by "count" desc
      limit 5
    `
    return {
      ...(stats ?? ZERO_RATE_LIMIT_ACCESS),
      tierRestrictedEndpoints: [...endpoints],
    }
  })
}

export function queryServiceHealth(
  scope: UsageScope,
): Promise<ServiceHealthStats> {
  return safely('service health', ZERO_SERVICE_HEALTH, async () => {
    const sql = await gatewayDb()
    const [stats] = await sql<Array<Omit<ServiceHealthStats, 'recentIssues'>>>`
      select
        count(*)::int as "totalIssues",
        (count(*) filter (where error_code is distinct from 'BACKEND_UNAVAILABLE'))::int as "backendErrors",
        (count(*) filter (where error_code = 'BACKEND_UNAVAILABLE'))::int as "backendUnavailable"
      from gateway.api_requests
      where ts >= now() - interval '7 days' and status >= 500 ${scopeFilter(sql, scope)}
    `
    const recent = await sql<
      Array<{
        ts: Date
        endpoint: string
        statusCode: number
        errorCode: string | null
      }>
    >`
      select ts, coalesce(operation_id, path) as "endpoint", status::int as "statusCode", error_code as "errorCode"
      from gateway.api_requests
      where ts >= now() - interval '24 hours' and status >= 500 ${scopeFilter(sql, scope)}
      order by ts desc
      limit 10
    `
    return {
      ...(stats ?? ZERO_SERVICE_HEALTH),
      recentIssues: recent.map(
        (r): ServiceIssue => ({
          timestamp: r.ts.toISOString(),
          endpoint: r.endpoint,
          statusCode: r.statusCode,
          errorReason: r.errorCode ?? 'Backend error',
          errorMessage: '',
        }),
      ),
    }
  })
}

const TIME_RANGE_INTERVAL: Record<RequestLogTimeRange, string> = {
  '1h': '1 hour',
  '6h': '6 hours',
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
}

/**
 * Pages newest-first. `cursor` is `<timestamp>|<id>` of the last row of the
 * previous page.
 */
export function queryRequestLog(
  scope: UsageScope,
  options: {
    timeRange: RequestLogTimeRange
    statusFilter: RequestLogFilter
    cursor?: string
    limit: number
  },
): Promise<Array<RequestLogEntry>> {
  return safely('request log', [], async () => {
    const sql = await gatewayDb()

    const status: Record<RequestLogFilter, Fragment> = {
      all: sql``,
      success: sql`and status between 200 and 299`,
      'client-error': sql`and status between 400 and 499 and status <> 429`,
      'server-error': sql`and status >= 500`,
      'rate-limited': sql`and status = 429`,
    }

    let cursorFilter = sql``
    if (options.cursor) {
      const [ts, id] = options.cursor.split('|')
      const cursorTs = new Date(ts ?? '')
      if (!Number.isNaN(cursorTs.getTime()) && id && /^\d+$/.test(id)) {
        cursorFilter = sql`and (ts, id) < (${cursorTs}, ${id}::bigint)`
      }
    }

    const rows = await sql<
      Array<{
        id: string
        ts: Date
        method: string
        endpoint: string | null
        path: string
        status: number
        latencyMs: number
        upstreamMs: number | null
        responseBytes: number | null
        clientIp: string | null
        errorCode: string | null
      }>
    >`
      select id::text as "id", ts, method, operation_id as "endpoint", path, status::int as "status",
             latency_ms as "latencyMs", upstream_ms as "upstreamMs", response_bytes as "responseBytes",
             client_ip as "clientIp", error_code as "errorCode"
      from gateway.api_requests
      where ts >= now() - ${TIME_RANGE_INTERVAL[options.timeRange]}::interval
        ${scopeFilter(sql, scope)}
        ${status[options.statusFilter]}
        ${cursorFilter}
      order by ts desc, id desc
      limit ${options.limit}
    `

    return rows.map(
      (r): RequestLogEntry => ({
        id: r.id,
        timestamp: r.ts.toISOString(),
        method: r.method,
        endpoint: r.endpoint ?? '',
        url: r.path,
        statusCode: r.status,
        // A response that came from the backend has an upstream time.
        backendStatusCode: r.upstreamMs != null ? r.status : null,
        totalTimeMs: r.latencyMs,
        backendTimeMs: r.upstreamMs ?? 0,
        responseSize: r.responseBytes ?? 0,
        callerIp: r.clientIp ?? '',
        errorReason: r.errorCode ?? '',
        errorMessage: '',
        errorSource: r.errorCode ? 'gateway' : '',
      }),
    )
  })
}

// --- Batch health query for the admin user list ---

export interface UserHealthData {
  userId: string
  totalCalls7d: number
  errorCount7d: number
  errorRate7d: number
  lastRequestTime: string | null
  rateLimitHits7d: number
}

export function queryUserHealthBatch(
  userIds: Array<string>,
): Promise<Map<string, UserHealthData>> {
  return safely('user health batch', new Map(), async () => {
    const result = new Map<string, UserHealthData>()
    if (userIds.length === 0) return result

    const sql = await gatewayDb()
    const rows = await sql<
      Array<
        Omit<UserHealthData, 'lastRequestTime'> & { lastRequest: Date | null }
      >
    >`
      select
        user_id as "userId",
        count(*)::int as "totalCalls7d",
        (count(*) filter (where status >= 500))::int as "errorCount7d",
        round(100.0 * count(*) filter (where status >= 500) / count(*), 1)::float8 as "errorRate7d",
        max(ts) as "lastRequest",
        (count(*) filter (where status = 429))::int as "rateLimitHits7d"
      from gateway.api_requests
      where ts >= now() - interval '7 days' and user_id in ${sql(userIds)}
      group by user_id
    `
    for (const { lastRequest, ...row } of rows) {
      result.set(row.userId, {
        ...row,
        lastRequestTime: lastRequest?.toISOString() ?? null,
      })
    }
    return result
  })
}

// --- Server functions for the signed-in user's dashboard ---

const isoDateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/,
    'Invalid date/datetime',
  )

async function currentUserScope(): Promise<UsageScope> {
  return { userId: await requireAuth() }
}

export const getUsageAnalytics = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ fromDate: isoDateTimeSchema, toDate: isoDateTimeSchema }).parse,
  )
  .handler(async ({ data }) =>
    queryUsageReport(await currentUserScope(), data.fromDate, data.toDate),
  )

export const getDailyUsageTrend = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<DailyUsagePoint>> =>
    queryDailyTrend(await currentUserScope()),
)

export const getEndpointBreakdown = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<EndpointBreakdownItem>> =>
    queryEndpointBreakdown(await currentUserScope()),
)

export const getErrorBreakdown = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<ErrorCodeBreakdownItem>> =>
    queryErrorBreakdown(await currentUserScope()),
)

export const getRecentErrors = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<RecentError>> =>
    queryRecentErrors(await currentUserScope()),
)

export const getRateLimitAccess = createServerFn({ method: 'GET' }).handler(
  async (): Promise<RateLimitAccessStats> =>
    queryRateLimitAccess(await currentUserScope()),
)

export const getServiceHealth = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ServiceHealthStats> =>
    queryServiceHealth(await currentUserScope()),
)
