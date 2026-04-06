import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { logAnalyticsQuery } from '../log-analytics-client'
import {
  _queryEndpointBreakdown,
  _queryServiceHealth,
  _queryUsageReport,
  demoExclusion,
} from '../apim/analytics'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import { env } from '@/env'

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

export const getSystemOverview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SystemOverview> => {
    await requireAdmin()

    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      return {
        callsToday: 0,
        callsWeek: 0,
        callsMonth: 0,
        activeUsers: 0,
        errorRate: 0,
        avgLatency: 0,
      }
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setUTCHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() - 7)
    const monthStart = new Date(now)
    monthStart.setUTCDate(now.getUTCDate() - 30)

    const toIso = (d: Date) => d.toISOString()

    try {
      const [todayReport, weekReport, monthReport, activeUsersResult] =
        await Promise.all([
          _queryUsageReport('', toIso(todayStart), toIso(now)),
          _queryUsageReport('', toIso(weekStart), toIso(now)),
          _queryUsageReport('', toIso(monthStart), toIso(now)),
          logAnalyticsQuery(
            `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${demoExclusion()}
| summarize activeUsers = dcount(ApimSubscriptionId)
          `.trim(),
          ),
        ])

      const activeUsersTable = activeUsersResult.tables[0]
      const activeUsers =
        activeUsersTable?.rows.length > 0
          ? Number(activeUsersTable.rows[0][0]) || 0
          : 0

      const errorRate =
        monthReport.callCountTotal > 0
          ? (monthReport.callCountServerError / monthReport.callCountTotal) *
            100
          : 0

      return {
        callsToday: todayReport.callCountTotal,
        callsWeek: weekReport.callCountTotal,
        callsMonth: monthReport.callCountTotal,
        activeUsers,
        errorRate: Math.round(errorRate * 100) / 100,
        avgLatency: Math.round(monthReport.apiTimeAvg * 100) / 100,
      }
    } catch (err) {
      log.error({ err }, 'Failed to fetch system overview')
      return {
        callsToday: 0,
        callsWeek: 0,
        callsMonth: 0,
        activeUsers: 0,
        errorRate: 0,
        avgLatency: 0,
      }
    }
  },
)

export const getSystemDailyTrend = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()

    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

    try {
      const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${demoExclusion()}
| summarize calls = count(), clientErrors = countif(ResponseCode >= 400 and ResponseCode < 500 and ResponseCode != 429), serverErrors = countif(ResponseCode >= 500) by bin(TimeGenerated, 1d)
| order by TimeGenerated asc
`.trim()

      const result = await logAnalyticsQuery(kql)
      const table = result.tables[0]
      if (!table || table.rows.length === 0) return []

      const columns = table.columns.map((c) => c.name)
      const dateIdx = columns.indexOf('TimeGenerated')
      const callsIdx = columns.indexOf('calls')
      const clientErrorsIdx = columns.indexOf('clientErrors')
      const serverErrorsIdx = columns.indexOf('serverErrors')

      return table.rows.map((row) => ({
        date: String(row[dateIdx]).split('T')[0],
        calls: Number(row[callsIdx]) || 0,
        clientErrors: Number(row[clientErrorsIdx]) || 0,
        serverErrors: Number(row[serverErrorsIdx]) || 0,
      }))
    } catch (err) {
      log.error({ err }, 'Failed to fetch system daily trend')
      return []
    }
  },
)

export const getTopEndpoints = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return _queryEndpointBreakdown('', 15, { percentiles: true })
  },
)

export const getSystemServiceHealth = createServerFn({
  method: 'GET',
}).handler(async () => {
  await requireAdmin()
  return _queryServiceHealth('')
})

// --- Error Correlation ---

export interface ErrorCorrelation {
  timeWindow: string
  endpoint: string
  errorCode: number
  affectedSubscriptions: number
  totalErrors: number
}

const errorCorrelationTimeRangeSchema = z.enum(['1h', '6h', '24h', '7d'])

export const getErrorCorrelation = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      timeRange: errorCorrelationTimeRangeSchema.default('24h'),
    }),
  )
  .handler(async ({ data }): Promise<Array<ErrorCorrelation>> => {
    await requireAdmin()
    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

    const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(${data.timeRange}) and ResponseCode >= 500
  ${demoExclusion()}
| summarize
    totalErrors = count(),
    affectedSubs = dcount(ApimSubscriptionId)
  by OperationId, ResponseCode, bin(TimeGenerated, 1h)
| where affectedSubs >= 2
| order by TimeGenerated desc, totalErrors desc
| take 50
`.trim()

    try {
      const result = await logAnalyticsQuery(kql)
      const table = result.tables[0]
      if (!table || table.rows.length === 0) return []

      const cols = table.columns.map((c) => c.name)
      const opIdx = cols.indexOf('OperationId')
      const codeIdx = cols.indexOf('ResponseCode')
      const timeIdx = cols.indexOf('TimeGenerated')
      const errIdx = cols.indexOf('totalErrors')
      const subsIdx = cols.indexOf('affectedSubs')

      return table.rows.map((row) => ({
        timeWindow: String(row[timeIdx]),
        endpoint: String(row[opIdx]),
        errorCode: Number(row[codeIdx]) || 0,
        affectedSubscriptions: Number(row[subsIdx]) || 0,
        totalErrors: Number(row[errIdx]) || 0,
      }))
    } catch (err) {
      log.error({ err }, 'Failed to fetch error correlation')
      return []
    }
  })

// --- Endpoint Top Users ---

export interface EndpointTopUser {
  subscriptionId: string
  calls: number
  errorRate: number
  avgLatencyMs: number
}

const operationIdSchema = z
  .string()
  .regex(/^[\w-]+$/, 'Invalid operation ID')

export const getEndpointTopUsers = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      operationId: operationIdSchema,
      timeRange: z.enum(['7d', '30d']).default('30d'),
    }),
  )
  .handler(async ({ data }): Promise<Array<EndpointTopUser>> => {
    await requireAdmin()
    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

    const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(${data.timeRange})
  and OperationId == '${data.operationId}'
  ${demoExclusion()}
| summarize
    calls = count(),
    errorRate = round(todouble(countif(ResponseCode >= 400)) / todouble(count()) * 100, 1),
    avgLatency = avg(todecimal(TotalTime))
  by ApimSubscriptionId
| top 20 by calls desc
`.trim()

    try {
      const result = await logAnalyticsQuery(kql)
      const table = result.tables[0]
      if (!table || table.rows.length === 0) return []

      const cols = table.columns.map((c) => c.name)
      const subIdx = cols.indexOf('ApimSubscriptionId')
      const callsIdx = cols.indexOf('calls')
      const errIdx = cols.indexOf('errorRate')
      const latIdx = cols.indexOf('avgLatency')

      return table.rows.map((row) => ({
        subscriptionId: String(row[subIdx]),
        calls: Number(row[callsIdx]) || 0,
        errorRate: Number(row[errIdx]) || 0,
        avgLatencyMs: Number(row[latIdx]) || 0,
      }))
    } catch (err) {
      log.error({ err }, 'Failed to fetch endpoint top users')
      return []
    }
  })

// --- Upgrade Signals ---

export interface UpgradeSignal {
  subscriptionId: string
  signalType: 'high-usage' | 'tier-restricted'
  value: number
}

export const getUpgradeSignals = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<UpgradeSignal>> => {
    await requireAdmin()
    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

    const usageKql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${demoExclusion()}
| summarize totalCalls = count() by ApimSubscriptionId
| where totalCalls > 4000
| top 30 by totalCalls desc
| project ApimSubscriptionId, totalCalls
`.trim()

    const tierRestrictedKql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${demoExclusion()}
  and ResponseCode == 403
  and (isnull(BackendResponseCode) or BackendResponseCode == 0)
| summarize blockedCount = count() by ApimSubscriptionId
| where blockedCount > 5
| top 30 by blockedCount desc
| project ApimSubscriptionId, blockedCount
`.trim()

    try {
      const [usageResult, restrictedResult] = await Promise.all([
        logAnalyticsQuery(usageKql),
        logAnalyticsQuery(tierRestrictedKql),
      ])

      const signals: Array<UpgradeSignal> = []

      const usageTable = usageResult.tables[0]
      if (usageTable && usageTable.rows.length > 0) {
        const cols = usageTable.columns.map((c) => c.name)
        const subIdx = cols.indexOf('ApimSubscriptionId')
        const callsIdx = cols.indexOf('totalCalls')
        for (const row of usageTable.rows) {
          signals.push({
            subscriptionId: String(row[subIdx]),
            signalType: 'high-usage',
            value: Number(row[callsIdx]) || 0,
          })
        }
      }

      const restrictedTable = restrictedResult.tables[0]
      if (restrictedTable && restrictedTable.rows.length > 0) {
        const cols = restrictedTable.columns.map((c) => c.name)
        const subIdx = cols.indexOf('ApimSubscriptionId')
        const countIdx = cols.indexOf('blockedCount')
        for (const row of restrictedTable.rows) {
          signals.push({
            subscriptionId: String(row[subIdx]),
            signalType: 'tier-restricted',
            value: Number(row[countIdx]) || 0,
          })
        }
      }

      return signals
    } catch (err) {
      log.error({ err }, 'Failed to fetch upgrade signals')
      return []
    }
  },
)
