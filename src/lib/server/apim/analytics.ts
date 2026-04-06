import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { logAnalyticsQuery } from '../log-analytics-client'
import { requireAuth, requireOwnership } from '../auth'
import { createLogger } from '../logger'
import type {
  ApimUsageReport,
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
} from '@/types/plans'
import { env } from '@/env'

const log = createLogger('apim')

// Strict schemas to prevent KQL injection via string interpolation
const isoDateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/,
    'Invalid date/datetime',
  )
const subscriptionIdSchema = z
  .string()
  .regex(/^[\w-]+$/, 'Invalid subscription ID')

// --- Demo traffic exclusion ---
// Returns a KQL clause that excludes the demo APIM subscription from analytics.
// Applied to all queries so marketing demo requests don't pollute real metrics.
export function demoExclusion(): string {
  const id = env.DEMO_APIM_SUBSCRIPTION_ID
  if (!id) return ''
  return `and ApimSubscriptionId != '${id}'`
}

// --- Zero-value defaults ---

const ZERO_REPORT: ApimUsageReport = {
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

// --- Internal KQL helpers (reused by admin server functions) ---

/**
 * @param subscriptionFilter — e.g. `and ApimSubscriptionId == 'sub-id'` or `''` for system-wide
 */
export async function _queryUsageReport(
  subscriptionFilter: string,
  fromDate: string,
  toDate: string,
): Promise<ApimUsageReport> {
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return ZERO_REPORT

  const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= datetime('${fromDate}')
  and TimeGenerated < datetime('${toDate}')
  ${subscriptionFilter}
  ${demoExclusion()}
| summarize
    callCountTotal = count(),
    callCountSuccess = countif(ResponseCode >= 200 and ResponseCode < 300),
    callCountBlocked = countif(ResponseCode == 429),
    callCountClientError = countif(ResponseCode >= 400 and ResponseCode < 500 and ResponseCode != 429),
    callCountServerError = countif(ResponseCode >= 500),
    callCountOther = countif(ResponseCode < 200 or (ResponseCode >= 300 and ResponseCode < 400)),
    bandwidth = sum(ResponseSize),
    apiTimeAvg = avg(todecimal(TotalTime)),
    apiTimeMin = min(TotalTime),
    apiTimeMax = max(TotalTime)
`.trim()

  try {
    const result = await logAnalyticsQuery(kql)
    const table = result.tables[0]
    if (!table || table.rows.length === 0) return ZERO_REPORT

    const columns = table.columns.map((c) => c.name)
    const row = table.rows[0]

    function col(name: string): number {
      const idx = columns.indexOf(name)
      if (idx === -1) return 0
      return Number(row[idx]) || 0
    }

    return {
      callCountTotal: col('callCountTotal'),
      callCountSuccess: col('callCountSuccess'),
      callCountBlocked: col('callCountBlocked'),
      callCountClientError: col('callCountClientError'),
      callCountServerError: col('callCountServerError'),
      callCountOther: col('callCountOther'),
      bandwidth: col('bandwidth'),
      apiTimeAvg: col('apiTimeAvg'),
      apiTimeMin: col('apiTimeMin'),
      apiTimeMax: col('apiTimeMax'),
    } satisfies ApimUsageReport
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for usage data')
    return ZERO_REPORT
  }
}

export async function _queryDailyTrend(
  subscriptionFilter: string,
): Promise<Array<DailyUsagePoint>> {
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

  const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${subscriptionFilter}
  ${demoExclusion()}
| summarize calls = count() by bin(TimeGenerated, 1d)
| order by TimeGenerated asc
`.trim()

  try {
    const result = await logAnalyticsQuery(kql)
    const table = result.tables[0]
    if (!table || table.rows.length === 0) return []

    const columns = table.columns.map((c) => c.name)
    const dateIdx = columns.indexOf('TimeGenerated')
    const callsIdx = columns.indexOf('calls')

    return table.rows.map((row) => ({
      date: String(row[dateIdx]).split('T')[0],
      calls: Number(row[callsIdx]) || 0,
    }))
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for daily trend')
    return []
  }
}

export async function _queryEndpointBreakdown(
  subscriptionFilter: string,
  topN = 10,
  options?: { percentiles?: boolean },
): Promise<Array<EndpointBreakdownItem>> {
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

  const withPercentiles = options?.percentiles ?? false
  const percentileSummarize = withPercentiles
    ? `,
    p50LatencyMs = percentile(TotalTime, 50),
    p95LatencyMs = percentile(TotalTime, 95),
    p99LatencyMs = percentile(TotalTime, 99)`
    : ''
  const percentileProject = withPercentiles
    ? ', p50LatencyMs, p95LatencyMs, p99LatencyMs'
    : ''

  const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${subscriptionFilter}
  ${demoExclusion()}
  and isnotempty(OperationId)
| summarize
    calls = count(),
    clientErrors = countif(ResponseCode >= 400 and ResponseCode < 500 and ResponseCode != 429),
    serverErrors = countif(ResponseCode >= 500),
    avgLatencyMs = avg(todecimal(TotalTime))${percentileSummarize}
  by OperationId
| extend
    clientErrorRate = round(todecimal(clientErrors) / todecimal(calls) * 100, 1),
    serverErrorRate = round(todecimal(serverErrors) / todecimal(calls) * 100, 1)
| top ${topN} by calls desc
| project OperationId, calls, clientErrorRate, serverErrorRate, avgLatencyMs${percentileProject}
`.trim()

  try {
    const result = await logAnalyticsQuery(kql)
    const table = result.tables[0]
    if (!table || table.rows.length === 0) return []

    const columns = table.columns.map((c) => c.name)
    const endpointIdx = columns.indexOf('OperationId')
    const callsIdx = columns.indexOf('calls')
    const clientErrorIdx = columns.indexOf('clientErrorRate')
    const serverErrorIdx = columns.indexOf('serverErrorRate')
    const latencyIdx = columns.indexOf('avgLatencyMs')
    const p50Idx = columns.indexOf('p50LatencyMs')
    const p95Idx = columns.indexOf('p95LatencyMs')
    const p99Idx = columns.indexOf('p99LatencyMs')

    return table.rows.map((row) => ({
      endpoint: String(row[endpointIdx]),
      calls: Number(row[callsIdx]) || 0,
      clientErrorRate: Number(row[clientErrorIdx]) || 0,
      serverErrorRate: Number(row[serverErrorIdx]) || 0,
      avgLatencyMs: Number(row[latencyIdx]) || 0,
      ...(p50Idx !== -1 && {
        p50LatencyMs: Number(row[p50Idx]) || 0,
        p95LatencyMs: Number(row[p95Idx]) || 0,
        p99LatencyMs: Number(row[p99Idx]) || 0,
      }),
    }))
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for endpoint breakdown')
    return []
  }
}

export async function _queryErrorBreakdown(
  subscriptionFilter: string,
): Promise<Array<ErrorCodeBreakdownItem>> {
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

  const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${subscriptionFilter}
  ${demoExclusion()}
  and ResponseCode >= 400
| summarize count = count() by ResponseCode
| top 10 by count desc
`.trim()

  try {
    const result = await logAnalyticsQuery(kql)
    const table = result.tables[0]
    if (!table || table.rows.length === 0) return []

    const columns = table.columns.map((c) => c.name)
    const codeIdx = columns.indexOf('ResponseCode')
    const countIdx = columns.indexOf('count')

    return table.rows.map((row) => ({
      statusCode: Number(row[codeIdx]) || 0,
      count: Number(row[countIdx]) || 0,
    }))
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for error breakdown')
    return []
  }
}

export async function _queryRecentErrors(
  subscriptionFilter: string,
): Promise<Array<RecentError>> {
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

  const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(24h)
  ${subscriptionFilter}
  ${demoExclusion()}
  and ResponseCode >= 400
| project TimeGenerated, OperationId, ResponseCode, Method
| order by TimeGenerated desc
| take 20
`.trim()

  try {
    const result = await logAnalyticsQuery(kql)
    const table = result.tables[0]
    if (!table || table.rows.length === 0) return []

    const columns = table.columns.map((c) => c.name)
    const timeIdx = columns.indexOf('TimeGenerated')
    const opIdx = columns.indexOf('OperationId')
    const codeIdx = columns.indexOf('ResponseCode')
    const methodIdx = columns.indexOf('Method')

    return table.rows.map((row) => ({
      timestamp: String(row[timeIdx]),
      endpoint: String(row[opIdx]),
      statusCode: Number(row[codeIdx]) || 0,
      method: String(row[methodIdx]),
    }))
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for recent errors')
    return []
  }
}

export async function _queryRateLimitAccess(
  subscriptionFilter: string,
): Promise<RateLimitAccessStats> {
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return ZERO_RATE_LIMIT_ACCESS

  const statsKql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${subscriptionFilter}
  ${demoExclusion()}
  and (LastErrorSource in ("rate-limit-by-key", "quota-by-key")
       or (ResponseCode == 403 and (isnull(BackendResponseCode) or BackendResponseCode == 0)))
| summarize
    rateLimitHits = countif(LastErrorSource == "rate-limit-by-key"),
    quotaExceeded = countif(LastErrorSource == "quota-by-key"),
    tierRestricted = countif(ResponseCode == 403 and (isnull(BackendResponseCode) or BackendResponseCode == 0))
`.trim()

  const endpointsKql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${subscriptionFilter}
  ${demoExclusion()}
  and ResponseCode == 403
  and (isnull(BackendResponseCode) or BackendResponseCode == 0)
  and isnotempty(OperationId)
| summarize count = count() by OperationId
| top 5 by count desc
`.trim()

  try {
    const [statsResult, endpointsResult] = await Promise.all([
      logAnalyticsQuery(statsKql),
      logAnalyticsQuery(endpointsKql),
    ])

    const statsTable = statsResult.tables[0]
    let stats = { ...ZERO_RATE_LIMIT_ACCESS }
    if (statsTable && statsTable.rows.length > 0) {
      const cols = statsTable.columns.map((c) => c.name)
      const row = statsTable.rows[0]
      const col = (name: string) => {
        const idx = cols.indexOf(name)
        return idx === -1 ? 0 : Number(row[idx]) || 0
      }
      stats = {
        rateLimitHits: col('rateLimitHits'),
        quotaExceeded: col('quotaExceeded'),
        tierRestricted: col('tierRestricted'),
        tierRestrictedEndpoints: [],
      }
    }

    const epTable = endpointsResult.tables[0]
    if (epTable && epTable.rows.length > 0) {
      const cols = epTable.columns.map((c) => c.name)
      const opIdx = cols.indexOf('OperationId')
      const countIdx = cols.indexOf('count')
      stats.tierRestrictedEndpoints = epTable.rows.map((row) => ({
        endpoint: String(row[opIdx]),
        count: Number(row[countIdx]) || 0,
      }))
    }

    return stats
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for rate limit/access')
    return ZERO_RATE_LIMIT_ACCESS
  }
}

export async function _queryServiceHealth(
  subscriptionFilter: string,
): Promise<ServiceHealthStats> {
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return ZERO_SERVICE_HEALTH

  const statsKql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d)
  ${subscriptionFilter}
  ${demoExclusion()}
  and (ResponseCode >= 500 or LastErrorSource == "forward-request")
| summarize
    totalIssues = count(),
    backendErrors = countif(ResponseCode >= 500 and LastErrorSource != "forward-request"),
    backendUnavailable = countif(LastErrorSource == "forward-request")
`.trim()

  const recentKql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(24h)
  ${subscriptionFilter}
  ${demoExclusion()}
  and (ResponseCode >= 500 or LastErrorSource == "forward-request")
| project TimeGenerated, OperationId, ResponseCode, LastErrorReason, LastErrorMessage
| order by TimeGenerated desc
| take 10
`.trim()

  try {
    const [statsResult, recentResult] = await Promise.all([
      logAnalyticsQuery(statsKql),
      logAnalyticsQuery(recentKql),
    ])

    const stats = { ...ZERO_SERVICE_HEALTH }

    const statsTable = statsResult.tables[0]
    if (statsTable && statsTable.rows.length > 0) {
      const cols = statsTable.columns.map((c) => c.name)
      const row = statsTable.rows[0]
      const col = (name: string) => {
        const idx = cols.indexOf(name)
        return idx === -1 ? 0 : Number(row[idx]) || 0
      }
      stats.totalIssues = col('totalIssues')
      stats.backendErrors = col('backendErrors')
      stats.backendUnavailable = col('backendUnavailable')
    }

    const recentTable = recentResult.tables[0]
    if (recentTable && recentTable.rows.length > 0) {
      const cols = recentTable.columns.map((c) => c.name)
      const timeIdx = cols.indexOf('TimeGenerated')
      const opIdx = cols.indexOf('OperationId')
      const codeIdx = cols.indexOf('ResponseCode')
      const reasonIdx = cols.indexOf('LastErrorReason')
      const msgIdx = cols.indexOf('LastErrorMessage')

      stats.recentIssues = recentTable.rows.map(
        (row): ServiceIssue => ({
          timestamp: String(row[timeIdx]),
          endpoint: String(row[opIdx]),
          statusCode: Number(row[codeIdx]) || 0,
          errorReason: String(row[reasonIdx] ?? ''),
          errorMessage: String(row[msgIdx] ?? ''),
        }),
      )
    }

    return stats
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for service health')
    return ZERO_SERVICE_HEALTH
  }
}

const TIME_RANGE_KQL: Record<RequestLogTimeRange, string> = {
  '1h': 'ago(1h)',
  '6h': 'ago(6h)',
  '24h': 'ago(24h)',
  '7d': 'ago(7d)',
  '30d': 'ago(30d)',
}

const STATUS_FILTER_KQL: Record<RequestLogFilter, string> = {
  all: '',
  success: 'and ResponseCode >= 200 and ResponseCode < 300',
  'client-error':
    'and ResponseCode >= 400 and ResponseCode < 500 and ResponseCode != 429',
  'server-error': 'and ResponseCode >= 500',
  'rate-limited': 'and ResponseCode == 429',
}

export async function _queryRequestLog(
  subscriptionFilter: string,
  options: {
    timeRange: RequestLogTimeRange
    statusFilter: RequestLogFilter
    cursor?: string
    limit: number
  },
): Promise<Array<RequestLogEntry>> {
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

  const timeRangeExpr = TIME_RANGE_KQL[options.timeRange]
  const statusExpr = STATUS_FILTER_KQL[options.statusFilter]
  let cursorExpr = ''
  if (options.cursor) {
    const pipeIdx = options.cursor.indexOf('|')
    if (pipeIdx !== -1) {
      const ts = options.cursor.slice(0, pipeIdx)
      const itemId = options.cursor.slice(pipeIdx + 1)
      cursorExpr = `and (TimeGenerated < datetime('${ts}') or (TimeGenerated == datetime('${ts}') and _ItemId < '${itemId}'))`
    } else {
      cursorExpr = `and TimeGenerated < datetime('${options.cursor}')`
    }
  }

  const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ${timeRangeExpr}
  ${subscriptionFilter}
  ${demoExclusion()}
  ${statusExpr}
  ${cursorExpr}
| project _ItemId, TimeGenerated, Method, OperationId, Url,
    ResponseCode, BackendResponseCode, TotalTime, BackendTime, ResponseSize,
    CallerIpAddress, LastErrorReason, LastErrorMessage, LastErrorSource
| order by TimeGenerated desc, _ItemId desc
| take ${options.limit}
`.trim()

  try {
    const result = await logAnalyticsQuery(kql)
    const table = result.tables[0]
    if (!table || table.rows.length === 0) return []

    const cols = table.columns.map((c) => c.name)
    const idx = (name: string) => cols.indexOf(name)

    return table.rows.map((row): RequestLogEntry => {
      const backendCode = row[idx('BackendResponseCode')]
      return {
        id: String(row[idx('_ItemId')] ?? ''),
        timestamp: String(row[idx('TimeGenerated')]),
        method: String(row[idx('Method')] ?? ''),
        endpoint: String(row[idx('OperationId')] ?? ''),
        url: String(row[idx('Url')] ?? ''),
        statusCode: Number(row[idx('ResponseCode')]) || 0,
        backendStatusCode:
          backendCode != null && backendCode !== '' && Number(backendCode) !== 0
            ? Number(backendCode)
            : null,
        totalTimeMs: Number(row[idx('TotalTime')]) || 0,
        backendTimeMs: Number(row[idx('BackendTime')]) || 0,
        responseSize: Number(row[idx('ResponseSize')]) || 0,
        callerIp: String(row[idx('CallerIpAddress')] ?? ''),
        errorReason: String(row[idx('LastErrorReason')] ?? ''),
        errorMessage: String(row[idx('LastErrorMessage')] ?? ''),
        errorSource: String(row[idx('LastErrorSource')] ?? ''),
      }
    })
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for request log')
    return []
  }
}

// --- Batch health query for admin user list ---

export interface UserHealthData {
  subscriptionId: string
  totalCalls7d: number
  errorCount7d: number
  errorRate7d: number
  lastRequestTime: string | null
  rateLimitHits7d: number
}

export async function _queryUserHealthBatch(
  subscriptionIds: Array<string>,
): Promise<Map<string, UserHealthData>> {
  const result = new Map<string, UserHealthData>()
  if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID || subscriptionIds.length === 0)
    return result

  // Validate every ID before interpolation
  const safeIds = subscriptionIds.filter((id) =>
    /^[\w-]+$/.test(id),
  )
  if (safeIds.length === 0) return result

  const inClause = safeIds.map((id) => `'${id}'`).join(', ')

  const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d)
  and ApimSubscriptionId in (${inClause})
| summarize
    totalCalls = count(),
    errorCount = countif(ResponseCode >= 500),
    lastRequest = max(TimeGenerated),
    rateLimitHits = countif(ResponseCode == 429)
  by ApimSubscriptionId
| extend errorRate = round(todouble(errorCount) / todouble(totalCalls) * 100, 1)
`.trim()

  try {
    const queryResult = await logAnalyticsQuery(kql)
    const table = queryResult.tables[0]
    if (!table || table.rows.length === 0) return result

    const cols = table.columns.map((c) => c.name)
    const subIdx = cols.indexOf('ApimSubscriptionId')
    const totalIdx = cols.indexOf('totalCalls')
    const errorIdx = cols.indexOf('errorCount')
    const lastIdx = cols.indexOf('lastRequest')
    const rlIdx = cols.indexOf('rateLimitHits')
    const rateIdx = cols.indexOf('errorRate')

    for (const row of table.rows) {
      const subId = String(row[subIdx])
      result.set(subId, {
        subscriptionId: subId,
        totalCalls7d: Number(row[totalIdx]) || 0,
        errorCount7d: Number(row[errorIdx]) || 0,
        errorRate7d: Number(row[rateIdx]) || 0,
        lastRequestTime: row[lastIdx] ? String(row[lastIdx]) : null,
        rateLimitHits7d: Number(row[rlIdx]) || 0,
      })
    }

    return result
  } catch (err) {
    log.error({ err }, 'Failed to query Log Analytics for user health batch')
    return result
  }
}

// --- Server Functions (delegate to internal helpers) ---

export const getUsageAnalytics = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      subscriptionId: subscriptionIdSchema,
      fromDate: isoDateTimeSchema,
      toDate: isoDateTimeSchema,
    }).parse,
  )
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    return _queryUsageReport(filter, data.fromDate, data.toDate)
  })

export const getDailyUsageTrend = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<Array<DailyUsagePoint>> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    return _queryDailyTrend(filter)
  })

export const getEndpointBreakdown = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<Array<EndpointBreakdownItem>> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    return _queryEndpointBreakdown(filter)
  })

export const getErrorBreakdown = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<Array<ErrorCodeBreakdownItem>> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    return _queryErrorBreakdown(filter)
  })

export const getRecentErrors = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<Array<RecentError>> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    return _queryRecentErrors(filter)
  })

export const getRateLimitAccess = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<RateLimitAccessStats> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    return _queryRateLimitAccess(filter)
  })

export const getServiceHealth = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<ServiceHealthStats> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    return _queryServiceHealth(filter)
  })
