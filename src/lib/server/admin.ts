import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { isAdmin, requireAdmin } from './admin-auth'
import { requireAuth } from './auth'
import { apimFetch } from './apim-client'
import { logAnalyticsQuery } from './log-analytics-client'
import {
  _queryDailyTrend,
  _queryEndpointBreakdown,
  _queryErrorBreakdown,
  _queryRecentErrors,
  _queryUsageReport,
} from './apim'
import { getApimProductIds, planIdFromProductId } from './apim-products'
import { getStripe } from './stripe-client'
import { createLogger } from './logger'
import type { SubscriptionListResponse } from '@/types/apim'
import { PLANS } from '@/lib/constants'
import { env } from '@/env'

const log = createLogger('admin')

// --- Admin check (used by sidebar + route guard) ---

export const checkIsAdmin = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()
    return isAdmin(session)
  },
)

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
          logAnalyticsQuery(`
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
| summarize activeUsers = dcount(ApimSubscriptionId)
          `.trim()),
        ])

      const activeUsersTable = activeUsersResult.tables[0]
      const activeUsers =
        activeUsersTable?.rows.length > 0
          ? Number(activeUsersTable.rows[0][0]) || 0
          : 0

      const errorRate =
        monthReport.callCountTotal > 0
          ? ((monthReport.callCountFailed + monthReport.callCountBlocked) /
              monthReport.callCountTotal) *
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
| summarize calls = count(), errors = countif(ResponseCode >= 400) by bin(TimeGenerated, 1d)
| order by TimeGenerated asc
`.trim()

      const result = await logAnalyticsQuery(kql)
      const table = result.tables[0]
      if (!table || table.rows.length === 0) return []

      const columns = table.columns.map((c) => c.name)
      const dateIdx = columns.indexOf('TimeGenerated')
      const callsIdx = columns.indexOf('calls')
      const errorsIdx = columns.indexOf('errors')

      return table.rows.map((row) => ({
        date: String(row[dateIdx]).split('T')[0],
        calls: Number(row[callsIdx]) || 0,
        errors: Number(row[errorsIdx]) || 0,
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
    return _queryEndpointBreakdown('', 15)
  },
)

// --- User Management ---

export interface AdminUser {
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string
  createdAt: number
  lastSignInAt: number | null
  stripeCustomerId: string | null
  apimSubscriptionId: string | null
  tier: string
}

export const getAdminUsers = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      search: z.string().optional().default(''),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ users: Array<AdminUser>; totalCount: number; page: number }> => {
      await requireAdmin()

      const { createClerkClient } = await import('@clerk/backend')
      const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })

      const offset = (data.page - 1) * data.pageSize
      const clerkResponse = await clerk.users.getUserList({
        limit: data.pageSize,
        offset,
        ...(data.search ? { query: data.search } : {}),
      })

      const users: Array<AdminUser> = await Promise.all(
        clerkResponse.data.map(async (user) => {
          const email =
            user.emailAddresses.find(
              (e) => e.id === user.primaryEmailAddressId,
            )?.emailAddress ?? ''
          const stripeCustomerId =
            (user.privateMetadata as { stripeCustomerId?: string })
              ?.stripeCustomerId ?? null

          let apimSubscriptionId: string | null = null
          let tier = 'student'

          try {
            const subs = await apimFetch<SubscriptionListResponse>(
              `/users/${user.id}/subscriptions`,
            )
            const activeSub = subs.value.find(
              (s) => s.properties.state === 'active',
            )
            if (activeSub) {
              apimSubscriptionId = activeSub.name
              const productId =
                activeSub.properties.scope.split('/').pop() ?? ''
              tier = planIdFromProductId(productId)
            }
          } catch {
            // User may not exist in APIM yet
          }

          return {
            clerkId: user.id,
            email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt,
            stripeCustomerId,
            apimSubscriptionId,
            tier,
          }
        }),
      )

      return {
        users,
        totalCount: clerkResponse.totalCount,
        page: data.page,
      }
    },
  )

export interface AdminUserDetail {
  clerk: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    imageUrl: string
    createdAt: number
    lastSignInAt: number | null
  }
  stripe: {
    customerId: string | null
    subscriptionStatus: string | null
    planId: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    recentInvoices: Array<{
      id: string
      amount: number
      currency: string
      status: string | null
      created: number
      hostedUrl: string | null
      attemptCount: number
      paid: boolean
      lastPaymentError: string | null
    }>
  }
  apim: {
    subscriptions: Array<{
      id: string
      productId: string
      planId: string
      state: string
      createdDate: string
    }>
  }
  quota: {
    callsUsed: number
    callsLimit: number | null
    resetEpoch: number
  } | null
}

export const getAdminUserDetail = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }): Promise<AdminUserDetail> => {
    await requireAdmin()

    const { createClerkClient } = await import('@clerk/backend')
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
    const user = await clerk.users.getUser(data.userId)

    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? ''
    const stripeCustomerId =
      (user.privateMetadata as { stripeCustomerId?: string })
        ?.stripeCustomerId ?? null

    // Parallel fetch APIM + Stripe
    const [apimSubs, stripeData] = await Promise.all([
      apimFetch<SubscriptionListResponse>(
        `/users/${data.userId}/subscriptions`,
      ).catch(() => ({ value: [] }) as SubscriptionListResponse),
      (async () => {
        if (!stripeCustomerId) {
          return {
            customerId: null,
            subscriptionStatus: null,
            planId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            recentInvoices: [] as AdminUserDetail['stripe']['recentInvoices'],
          }
        }

        const stripe = getStripe()
        const [subscriptions, invoices] = await Promise.all([
          stripe.subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
          }),
          stripe.invoices.list({
            customer: stripeCustomerId,
            limit: 10,
          }),
        ])

        const sub = subscriptions.data[0]
        const item = sub?.items?.data[0]

        return {
          customerId: stripeCustomerId,
          subscriptionStatus: sub?.status ?? null,
          planId:
            (sub?.metadata?.planId) ??
            item?.price?.lookup_key ??
            null,
          currentPeriodEnd: item?.current_period_end
            ? new Date(item.current_period_end * 1000).toISOString()
            : null,
          cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
          recentInvoices: invoices.data.map((inv) => ({
            id: inv.id,
            amount: inv.amount_paid,
            currency: inv.currency,
            status: inv.status,
            created: inv.created,
            hostedUrl: inv.hosted_invoice_url ?? null,
            attemptCount: inv.attempt_count ?? 0,
            paid: inv.amount_paid > 0,
            lastPaymentError:
              (inv.last_finalization_error?.message) ?? null,
          })),
        }
      })(),
    ])

    const subscriptions = apimSubs.value.map((sub) => {
      const productId = sub.properties.scope.split('/').pop() ?? ''
      return {
        id: sub.name,
        productId,
        planId: planIdFromProductId(productId),
        state: sub.properties.state,
        createdDate: sub.properties.createdDate,
        displayName: sub.properties.displayName,
      }
    })

    // Compute quota usage for the active subscription
    let quota: AdminUserDetail['quota'] = null
    const activeSub = subscriptions.find((s) => s.state === 'active')
    if (activeSub && env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      try {
        const parts = activeSub.displayName.split('|')
        const resetEpoch = parts.length === 2 ? Number(parts[1]) : 0
        const resetDate = resetEpoch > 0
          ? new Date(resetEpoch * 1000)
          : new Date(activeSub.createdDate)

        const safeId = subscriptionIdSchema.parse(activeSub.id)
        const filter = `and ApimSubscriptionId == '${safeId}'`
        const usageReport = await _queryUsageReport(
          filter,
          resetDate.toISOString(),
          new Date().toISOString(),
        )

        const plan = PLANS.find((p) => p.id === activeSub.planId)
        quota = {
          callsUsed: usageReport.callCountTotal,
          callsLimit: plan?.limits.callsPerMonth ?? null,
          resetEpoch,
        }
      } catch (err) {
        log.error({ err }, 'Failed to fetch quota usage for admin user detail')
      }
    }

    return {
      clerk: {
        id: user.id,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      },
      stripe: stripeData,
      apim: {
        subscriptions: subscriptions.map(({ displayName: _, ...rest }) => rest),
      },
      quota,
    }
  })

const subscriptionIdSchema = z
  .string()
  .regex(/^[\w-]+$/, 'Invalid subscription ID')

const planIdSchema = z.enum(['student', 'private', 'commercial', 'atp'])

export const getAdminUserAnalytics = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }))
  .handler(async ({ data }) => {
    await requireAdmin()

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    const now = new Date()
    const monthStart = new Date(now)
    monthStart.setUTCDate(now.getUTCDate() - 30)

    const [usageReport, dailyTrend, endpoints, errors, recentErrors] =
      await Promise.all([
        _queryUsageReport(filter, monthStart.toISOString(), now.toISOString()),
        _queryDailyTrend(filter),
        _queryEndpointBreakdown(filter),
        _queryErrorBreakdown(filter),
        _queryRecentErrors(filter),
      ])

    return { usageReport, dailyTrend, endpoints, errors, recentErrors }
  })

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
        logAnalyticsQuery(`
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d)
| summarize totalCalls = count(), errorCount = countif(ResponseCode >= 400) by ApimSubscriptionId
| where totalCalls >= 50
| extend errorRate = round(todouble(errorCount) / todouble(totalCalls) * 100, 2)
| where errorRate > 20
| top 20 by errorRate desc
        `.trim()),
        logAnalyticsQuery(`
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d) and ResponseCode == 429
| summarize count429 = count() by ApimSubscriptionId
| top 20 by count429 desc
        `.trim()),
        logAnalyticsQuery(`
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d)
| summarize hourlyCalls = count() by ApimSubscriptionId, bin(TimeGenerated, 1h)
| summarize avgHourly = avg(hourlyCalls), maxHourly = max(hourlyCalls) by ApimSubscriptionId
| where maxHourly > avgHourly * 3 and maxHourly > 100
| extend spikeFactor = round(maxHourly / avgHourly, 2)
| top 20 by spikeFactor desc
        `.trim()),
        logAnalyticsQuery(`
ApiManagementGatewayLogs
| where TimeGenerated >= ago(24h) and isnotempty(CallerIpAddress)
| summarize callCount = count(), distinctSubs = dcount(ApimSubscriptionId), errorRate = round(todouble(countif(ResponseCode >= 400)) / todouble(count()) * 100, 2) by CallerIpAddress
| where callCount > 500 or distinctSubs > 3
| top 20 by callCount desc
        `.trim()),
        logAnalyticsQuery(`
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
| summarize totalCalls = count() by ApimSubscriptionId
| where totalCalls > 5000
| top 20 by totalCalls desc
        `.trim()),
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

// --- Admin Actions ---

export const adminChangeTier = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ userId: z.string(), planId: planIdSchema }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const productIds = getApimProductIds()
    const apimProductId = productIds[data.planId]
    if (!apimProductId) {
      throw new Error(`Unknown plan ID: ${data.planId}`)
    }

    const result = await apimFetch<SubscriptionListResponse>(
      `/users/${data.userId}/subscriptions`,
    )
    const activeSubs = result.value.filter(
      (s) => s.properties.state === 'active',
    )

    if (activeSubs.length === 0) {
      throw new Error('No active APIM subscription found for user')
    }

    const patchResults = await Promise.allSettled(
      activeSubs.map((sub) =>
        apimFetch(`/subscriptions/${sub.name}`, {
          method: 'PATCH',
          body: JSON.stringify({
            properties: { scope: `/products/${apimProductId}` },
          }),
        }),
      ),
    )

    const failures = patchResults.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    )
    if (failures.length > 0) {
      throw new Error(
        `Failed to update ${failures.length}/${activeSubs.length} subscriptions`,
      )
    }

    log.info(
      { userId: data.userId, planId: data.planId, apimProductId },
      'Admin changed user tier',
    )

    return { success: true, planId: data.planId }
  })

export const adminCancelSubscription = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()

    const { createClerkClient } = await import('@clerk/backend')
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
    const user = await clerk.users.getUser(data.userId)
    const stripeCustomerId =
      (user.privateMetadata as { stripeCustomerId?: string })
        ?.stripeCustomerId ?? null

    if (stripeCustomerId) {
      const stripe = getStripe()
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 5,
      })
      const activeSub = subscriptions.data.find(
        (s) => s.status === 'active' || s.status === 'past_due',
      )
      if (activeSub) {
        await stripe.subscriptions.cancel(activeSub.id)
        log.info(
          { userId: data.userId, subscriptionId: activeSub.id },
          'Admin canceled Stripe subscription',
        )
      }
    }

    const productIds = getApimProductIds()
    const apimResult = await apimFetch<SubscriptionListResponse>(
      `/users/${data.userId}/subscriptions`,
    )
    const activeSubs = apimResult.value.filter(
      (s) => s.properties.state === 'active',
    )

    await Promise.allSettled(
      activeSubs.map((sub) =>
        apimFetch(`/subscriptions/${sub.name}`, {
          method: 'PATCH',
          body: JSON.stringify({
            properties: {
              scope: `/products/${productIds.student}`,
              displayName: `${data.userId}|0`,
            },
          }),
        }),
      ),
    )

    log.info(
      { userId: data.userId },
      'Admin canceled subscription and downgraded to student',
    )

    return { success: true }
  })

export const adminResetQuota = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()

    const result = await apimFetch<SubscriptionListResponse>(
      `/users/${data.userId}/subscriptions`,
    )
    const activeSubs = result.value.filter(
      (s) => s.properties.state === 'active',
    )

    if (activeSubs.length === 0) {
      throw new Error('No active APIM subscription found for user')
    }

    await Promise.allSettled(
      activeSubs.map((sub) =>
        apimFetch(`/subscriptions/${sub.name}`, {
          method: 'PATCH',
          body: JSON.stringify({
            properties: { displayName: `${data.userId}|0` },
          }),
        }),
      ),
    )

    log.info({ userId: data.userId }, 'Admin reset user quota')

    return { success: true }
  })

// --- Revenue Summary ---

export interface RevenueSummary {
  mrr: number
  customersByTier: Array<{ tier: string; count: number }>
  recentChurn: number
}

export const getRevenueSummary = createServerFn({ method: 'GET' }).handler(
  async (): Promise<RevenueSummary> => {
    await requireAdmin()

    const stripe = getStripe()

    try {
      const allSubs: Array<{ priceId: string; amount: number }> = []
      for await (const sub of stripe.subscriptions.list({
        status: 'active',
        limit: 100,
        expand: ['data.items'],
      })) {
        const item = sub.items.data[0]
        if (item) {
          allSubs.push({
            priceId: item.price.id,
            amount: item.price.unit_amount ?? 0,
          })
        }
      }

      const mrr = allSubs.reduce((sum, s) => sum + s.amount, 0) / 100

      const { planIdFromPriceId } = await import('./stripe-utils')
      const tierCounts: Record<string, number> = {
        student: 0,
        private: 0,
        commercial: 0,
        atp: 0,
      }
      for (const sub of allSubs) {
        const planId = planIdFromPriceId(sub.priceId) || 'student'
        tierCounts[planId] = (tierCounts[planId] ?? 0) + 1
      }

      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400
      let recentChurn = 0
      for await (const _sub of stripe.subscriptions.list({
        status: 'canceled',
        limit: 100,
        created: { gte: thirtyDaysAgo },
      })) {
        recentChurn++
      }

      return {
        mrr,
        customersByTier: Object.entries(tierCounts).map(([tier, count]) => ({
          tier,
          count,
        })),
        recentChurn,
      }
    } catch (err) {
      log.error({ err }, 'Failed to fetch revenue summary')
      return { mrr: 0, customersByTier: [], recentChurn: 0 }
    }
  },
)
