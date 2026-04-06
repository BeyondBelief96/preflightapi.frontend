import { createServerFn } from '@tanstack/react-start'
import { logAnalyticsQuery } from '../log-analytics-client'
import { demoExclusion } from '../apim/analytics'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import { env } from '@/env'

const log = createLogger('admin')

// --- Abuse Detection ---

export interface AbuseIndicators {
  highErrorUsers: Array<{
    subscriptionId: string
    totalCalls: number
    errorCount: number
    errorRate: number
  }>
  rateLimitAbusers: Array<{
    subscriptionId: string
    count429: number
  }>
  trafficSpikes: Array<{
    subscriptionId: string
    avgHourly: number
    maxHourly: number
    spikeFactor: number
  }>
  suspiciousIps: Array<{
    ip: string
    callCount: number
    distinctSubscriptions: number
    errorRate: number
  }>
  quotaExceeders: Array<{
    subscriptionId: string
    totalCalls: number
  }>
}

export const getAbuseIndicators = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AbuseIndicators> => {
    await requireAdmin()

    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      return {
        highErrorUsers: [],
        rateLimitAbusers: [],
        trafficSpikes: [],
        suspiciousIps: [],
        quotaExceeders: [],
      }
    }

    try {
      const [
        highErrorResult,
        rateLimitResult,
        spikeResult,
        ipResult,
        quotaResult,
      ] = await Promise.all([
        logAnalyticsQuery(
          `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d)
  ${demoExclusion()}
| summarize totalCalls = count(), errorCount = countif(ResponseCode >= 500) by ApimSubscriptionId
| where totalCalls >= 50
| extend errorRate = round(todouble(errorCount) / todouble(totalCalls) * 100, 2)
| where errorRate > 20
| top 20 by errorRate desc
        `.trim(),
        ),
        logAnalyticsQuery(
          `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d) and ResponseCode == 429
  ${demoExclusion()}
| summarize count429 = count() by ApimSubscriptionId
| top 20 by count429 desc
        `.trim(),
        ),
        logAnalyticsQuery(
          `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d)
  ${demoExclusion()}
| summarize hourlyCalls = count() by ApimSubscriptionId, bin(TimeGenerated, 1h)
| summarize avgHourly = avg(hourlyCalls), maxHourly = max(hourlyCalls) by ApimSubscriptionId
| where maxHourly > avgHourly * 3 and maxHourly > 100
| extend spikeFactor = round(maxHourly / avgHourly, 2)
| top 20 by spikeFactor desc
        `.trim(),
        ),
        logAnalyticsQuery(
          `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(24h) and isnotempty(CallerIpAddress)
  ${demoExclusion()}
| summarize callCount = count(), distinctSubs = dcount(ApimSubscriptionId), errorRate = round(todouble(countif(ResponseCode >= 500)) / todouble(count()) * 100, 2) by CallerIpAddress
| where callCount > 500 or distinctSubs > 3
| top 20 by callCount desc
        `.trim(),
        ),
        logAnalyticsQuery(
          `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${demoExclusion()}
| summarize totalCalls = count() by ApimSubscriptionId
| where totalCalls > 5000
| top 20 by totalCalls desc
        `.trim(),
        ),
      ])

      function parseTable<T>(
        result: Awaited<ReturnType<typeof logAnalyticsQuery>>,
        mapper: (
          row: Array<string | number | null>,
          colIdx: (name: string) => number,
        ) => T,
      ): Array<T> {
        const table = result.tables[0]
        if (!table || table.rows.length === 0) return []
        const columns = table.columns.map((c) => c.name)
        const colIdx = (name: string) => columns.indexOf(name)
        return table.rows.map((row) => mapper(row, colIdx))
      }

      return {
        highErrorUsers: parseTable(highErrorResult, (row, col) => ({
          subscriptionId: String(row[col('ApimSubscriptionId')]),
          totalCalls: Number(row[col('totalCalls')]) || 0,
          errorCount: Number(row[col('errorCount')]) || 0,
          errorRate: Number(row[col('errorRate')]) || 0,
        })),
        rateLimitAbusers: parseTable(rateLimitResult, (row, col) => ({
          subscriptionId: String(row[col('ApimSubscriptionId')]),
          count429: Number(row[col('count429')]) || 0,
        })),
        trafficSpikes: parseTable(spikeResult, (row, col) => ({
          subscriptionId: String(row[col('ApimSubscriptionId')]),
          avgHourly: Number(row[col('avgHourly')]) || 0,
          maxHourly: Number(row[col('maxHourly')]) || 0,
          spikeFactor: Number(row[col('spikeFactor')]) || 0,
        })),
        suspiciousIps: parseTable(ipResult, (row, col) => ({
          ip: String(row[col('CallerIpAddress')]),
          callCount: Number(row[col('callCount')]) || 0,
          distinctSubscriptions: Number(row[col('distinctSubs')]) || 0,
          errorRate: Number(row[col('errorRate')]) || 0,
        })),
        quotaExceeders: parseTable(quotaResult, (row, col) => ({
          subscriptionId: String(row[col('ApimSubscriptionId')]),
          totalCalls: Number(row[col('totalCalls')]) || 0,
        })),
      }
    } catch (err) {
      log.error({ err }, 'Failed to fetch abuse indicators')
      return {
        highErrorUsers: [],
        rateLimitAbusers: [],
        trafficSpikes: [],
        suspiciousIps: [],
        quotaExceeders: [],
      }
    }
  },
)
