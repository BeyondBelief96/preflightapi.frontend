import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { apimFetch } from './apim-client'
import { logAnalyticsQuery } from './log-analytics-client'
import { getApimProductIds, planIdFromProductId } from './apim-products'
import { getTierConfig } from './tier-config'
import { requireAuth, requireOwnership } from './auth'
import { createLogger } from './logger'
import type {
  ApimUsageReport,
  DailyUsagePoint,
  EndpointBreakdownItem,
  ErrorCodeBreakdownItem,
  RecentError,
} from '@/types/plans'
import type { SubscriptionListResponse } from '@/types/apim'
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

// --- User Management ---

export const getOrCreateApimUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireAuth()

    const result = await apimFetch<{
      properties: { firstName: string; lastName: string; email: string }
    }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        properties: {
          firstName: 'API',
          lastName: 'User',
          email: `${userId}@clerk.user`,
        },
      }),
    })

    return { userId, ...result.properties }
  },
)

// --- Subscription Management ---

export const getUserSubscription = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireAuth()
    const productIds = getApimProductIds()

    // Ensure the APIM user exists before querying subscriptions
    await apimFetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        properties: {
          firstName: 'API',
          lastName: 'User',
          email: `${userId}@clerk.user`,
        },
      }),
    })

    // Fetch existing subscriptions (all states, not just active)
    const result = await apimFetch<SubscriptionListResponse>(
      `/users/${userId}/subscriptions`,
    )
    let subscriptions = result.value

    // Auto-provision a free-tier subscription only if the user has NO
    // subscriptions in any state. This prevents creating a duplicate
    // free-tier sub when a paid subscription was recently cancelled/suspended.
    if (subscriptions.length === 0) {
      log.info(
        { userId },
        'No subscriptions found — auto-provisioning free tier',
      )
      const freeTierSubId = `${userId}-${productIds.student}`
      await apimFetch(`/subscriptions/${freeTierSubId}`, {
        method: 'PUT',
        body: JSON.stringify({
          properties: {
            ownerId: `/users/${userId}`,
            scope: `/products/${productIds.student}`,
            displayName: `${userId}|0`,
            state: 'active',
          },
        }),
      })

      // Re-fetch subscriptions after provisioning
      const refreshed = await apimFetch<SubscriptionListResponse>(
        `/users/${userId}/subscriptions`,
      )
      subscriptions = refreshed.value
    }

    return subscriptions.map((sub) => {
      const productId = sub.properties.scope.split('/').pop() ?? ''
      return {
        id: sub.name,
        name: sub.properties.displayName,
        productId,
        planId: planIdFromProductId(productId),
        userId,
        state: sub.properties.state as
          | 'active'
          | 'suspended'
          | 'submitted'
          | 'rejected'
          | 'cancelled'
          | 'expired',
        createdDate: sub.properties.createdDate,
        expirationDate: sub.properties.expirationDate,
      }
    })
  },
)

export const getSubscriptionKeys = createServerFn({ method: 'POST' })
  .inputValidator((input: { subscriptionId: string }) => input)
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const result = await apimFetch<{
      primaryKey: string
      secondaryKey: string
    }>(`/subscriptions/${data.subscriptionId}/listSecrets`, {
      method: 'POST',
    })

    return {
      primaryKey: result.primaryKey,
      secondaryKey: result.secondaryKey,
    }
  })

export const regenerateKey = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { subscriptionId: string; keyType: 'primary' | 'secondary' }) =>
      input,
  )
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const endpoint =
      data.keyType === 'primary'
        ? 'regeneratePrimaryKey'
        : 'regenerateSecondaryKey'

    log.info(
      { userId, subscriptionId: data.subscriptionId, keyType: data.keyType },
      'Regenerating API key',
    )

    await apimFetch(`/subscriptions/${data.subscriptionId}/${endpoint}`, {
      method: 'POST',
    })

    // Fetch the new keys
    const keys = await apimFetch<{
      primaryKey: string
      secondaryKey: string
    }>(`/subscriptions/${data.subscriptionId}/listSecrets`, {
      method: 'POST',
    })

    return keys
  })

// --- Usage Analytics (via Azure Monitor Log Analytics) ---

const ZERO_REPORT: ApimUsageReport = {
  callCountTotal: 0,
  callCountSuccess: 0,
  callCountBlocked: 0,
  callCountFailed: 0,
  callCountOther: 0,
  bandwidth: 0,
  apiTimeAvg: 0,
  apiTimeMin: 0,
  apiTimeMax: 0,
}

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

    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      log.warn('LOG_ANALYTICS_WORKSPACE_ID not configured — returning zeros')
      return ZERO_REPORT
    }

    const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= datetime('${data.fromDate}')
  and TimeGenerated < datetime('${data.toDate}')
  and ApimSubscriptionId == '${data.subscriptionId}'
| summarize
    callCountTotal = count(),
    callCountSuccess = countif(ResponseCode >= 200 and ResponseCode < 300),
    callCountBlocked = countif(ResponseCode == 429),
    callCountFailed = countif(ResponseCode >= 400 and ResponseCode != 429),
    callCountOther = countif(ResponseCode < 200 or (ResponseCode >= 300 and ResponseCode < 400)),
    bandwidth = sum(ResponseSize),
    apiTimeAvg = avg(todecimal(TotalTime)),
    apiTimeMin = min(TotalTime),
    apiTimeMax = max(TotalTime)
`.trim()

    try {
      const result = await logAnalyticsQuery(kql)

      const table = result.tables[0]
      if (!table || table.rows.length === 0) {
        return ZERO_REPORT
      }

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
        callCountFailed: col('callCountFailed'),
        callCountOther: col('callCountOther'),
        bandwidth: col('bandwidth'),
        apiTimeAvg: col('apiTimeAvg'),
        apiTimeMin: col('apiTimeMin'),
        apiTimeMax: col('apiTimeMax'),
      } satisfies ApimUsageReport
    } catch (err) {
      log.error(
        { err, subscriptionId: data.subscriptionId },
        'Failed to query Log Analytics for usage data',
      )
      return ZERO_REPORT
    }
  })

// --- Daily Usage Trend (via Azure Monitor Log Analytics) ---

export const getDailyUsageTrend = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<Array<DailyUsagePoint>> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      log.warn(
        'LOG_ANALYTICS_WORKSPACE_ID not configured — returning empty trend',
      )
      return []
    }

    const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  and ApimSubscriptionId == '${data.subscriptionId}'
| summarize calls = count() by bin(TimeGenerated, 1d)
| order by TimeGenerated asc
`.trim()

    try {
      const result = await logAnalyticsQuery(kql)

      const table = result.tables[0]
      if (!table || table.rows.length === 0) {
        return []
      }

      const columns = table.columns.map((c) => c.name)
      const dateIdx = columns.indexOf('TimeGenerated')
      const callsIdx = columns.indexOf('calls')

      return table.rows.map((row) => ({
        date: String(row[dateIdx]).split('T')[0],
        calls: Number(row[callsIdx]) || 0,
      }))
    } catch (err) {
      log.error(
        { err, subscriptionId: data.subscriptionId },
        'Failed to query Log Analytics for daily trend',
      )
      return []
    }
  })

// --- Endpoint Breakdown (via Azure Monitor Log Analytics) ---

export const getEndpointBreakdown = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<Array<EndpointBreakdownItem>> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      log.warn(
        'LOG_ANALYTICS_WORKSPACE_ID not configured — returning empty breakdown',
      )
      return []
    }

    const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  and ApimSubscriptionId == '${data.subscriptionId}'
  and isnotempty(OperationId)
| summarize calls = count() by OperationId
| top 10 by calls desc
`.trim()

    try {
      const result = await logAnalyticsQuery(kql)

      const table = result.tables[0]
      if (!table || table.rows.length === 0) {
        return []
      }

      const columns = table.columns.map((c) => c.name)
      const endpointIdx = columns.indexOf('OperationId')
      const callsIdx = columns.indexOf('calls')

      return table.rows.map((row) => ({
        endpoint: String(row[endpointIdx]),
        calls: Number(row[callsIdx]) || 0,
      }))
    } catch (err) {
      log.error(
        { err, subscriptionId: data.subscriptionId },
        'Failed to query Log Analytics for endpoint breakdown',
      )
      return []
    }
  })

// --- Error Breakdown (via Azure Monitor Log Analytics) ---

export const getErrorBreakdown = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<Array<ErrorCodeBreakdownItem>> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      log.warn(
        'LOG_ANALYTICS_WORKSPACE_ID not configured — returning empty error breakdown',
      )
      return []
    }

    const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  and ApimSubscriptionId == '${data.subscriptionId}'
  and ResponseCode >= 400
| summarize count = count() by ResponseCode
| top 10 by count desc
`.trim()

    try {
      const result = await logAnalyticsQuery(kql)

      const table = result.tables[0]
      if (!table || table.rows.length === 0) {
        return []
      }

      const columns = table.columns.map((c) => c.name)
      const codeIdx = columns.indexOf('ResponseCode')
      const countIdx = columns.indexOf('count')

      return table.rows.map((row) => ({
        statusCode: Number(row[codeIdx]) || 0,
        count: Number(row[countIdx]) || 0,
      }))
    } catch (err) {
      log.error(
        { err, subscriptionId: data.subscriptionId },
        'Failed to query Log Analytics for error breakdown',
      )
      return []
    }
  })

// --- Recent Errors (via Azure Monitor Log Analytics) ---

export const getRecentErrors = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }).parse)
  .handler(async ({ data }): Promise<Array<RecentError>> => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      log.warn(
        'LOG_ANALYTICS_WORKSPACE_ID not configured — returning empty recent errors',
      )
      return []
    }

    const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(24h)
  and ApimSubscriptionId == '${data.subscriptionId}'
  and ResponseCode >= 400
| project TimeGenerated, OperationId, ResponseCode, Method
| order by TimeGenerated desc
| take 20
`.trim()

    try {
      const result = await logAnalyticsQuery(kql)

      const table = result.tables[0]
      if (!table || table.rows.length === 0) {
        return []
      }

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
      log.error(
        { err, subscriptionId: data.subscriptionId },
        'Failed to query Log Analytics for recent errors',
      )
      return []
    }
  })

// --- Tier Configuration (public, no auth required) ---

export const fetchTierConfig = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getTierConfig()
  },
)
