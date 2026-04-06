import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { apimFetch } from '../apim/client'
import { planIdFromProductId } from '../apim/products'
import { getStripe } from '../stripe/client'
import {
  _queryDailyTrend,
  _queryEndpointBreakdown,
  _queryErrorBreakdown,
  _queryRateLimitAccess,
  _queryRecentErrors,
  _queryRequestLog,
  _queryServiceHealth,
  _queryUsageReport,
  _queryUserHealthBatch,
  demoExclusion,
} from '../apim/analytics'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import type { SubscriptionListResponse } from '@/types/apim'
import { PLANS } from '@/lib/constants'
import { env } from '@/env'

const log = createLogger('admin')

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
      tier: z
        .enum(['all', 'student', 'private', 'commercial'])
        .optional()
        .default('all'),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      users: Array<AdminUser>
      totalCount: number
      page: number
    }> => {
      await requireAdmin()

      const { createClerkClient } = await import('@clerk/backend')
      const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })

      // When filtering by tier, over-fetch to compensate for post-filter reduction
      const fetchMultiplier = data.tier !== 'all' ? 3 : 1
      const fetchSize = data.pageSize * fetchMultiplier
      const offset = (data.page - 1) * data.pageSize

      const clerkResponse = await clerk.users.getUserList({
        limit: data.tier !== 'all' ? Math.min(fetchSize, 100) : data.pageSize,
        offset: data.tier !== 'all' ? 0 : offset,
        ...(data.search ? { query: data.search } : {}),
      })

      const allUsers: Array<AdminUser> = await Promise.all(
        clerkResponse.data.map(async (user) => {
          const email =
            user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
              ?.emailAddress ?? ''
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

      // Apply tier filter if set
      const filtered =
        data.tier !== 'all'
          ? allUsers.filter((u) => u.tier === data.tier)
          : allUsers

      // Paginate filtered results when tier filter is active
      const users =
        data.tier !== 'all'
          ? filtered.slice(0, data.pageSize)
          : filtered

      const totalCount =
        data.tier !== 'all'
          ? filtered.length
          : clerkResponse.totalCount

      return {
        users,
        totalCount,
        page: data.page,
      }
    },
  )

export const getAdminUserHealthBatch = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      subscriptionIds: z.array(z.string().regex(/^[\w-]+$/)).max(100),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const healthMap = await _queryUserHealthBatch(data.subscriptionIds)
    return Object.fromEntries(healthMap)
  })

const advancedFilterSchema = z.enum([
  'high-error',
  'near-quota',
  'high-usage',
  'rate-limited',
])
export type AdvancedFilter = z.infer<typeof advancedFilterSchema>

function filterKql(filter: AdvancedFilter): string {
  const exclude = demoExclusion()
  const filters: Record<AdvancedFilter, string> = {
    'high-error': `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d)
  ${exclude}
| summarize totalCalls = count(), errorCount = countif(ResponseCode >= 500) by ApimSubscriptionId
| where totalCalls >= 50
| extend errorRate = round(todouble(errorCount) / todouble(totalCalls) * 100, 1)
| where errorRate > 10
| top 50 by errorRate desc
| project ApimSubscriptionId`,
    'near-quota': `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${exclude}
| summarize totalCalls = count() by ApimSubscriptionId
| where totalCalls > 4000
| top 50 by totalCalls desc
| project ApimSubscriptionId`,
    'high-usage': `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  ${exclude}
| summarize totalCalls = count() by ApimSubscriptionId
| top 50 by totalCalls desc
| project ApimSubscriptionId`,
    'rate-limited': `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d) and ResponseCode == 429
  ${exclude}
| summarize count429 = count() by ApimSubscriptionId
| top 50 by count429 desc
| project ApimSubscriptionId`,
  }
  return filters[filter]
}

function extractUserIdFromSubscription(subscriptionId: string): string | null {
  const match = subscriptionId.match(/^(user_[^-]+)/)
  return match?.[1] ?? null
}

export const getFilteredAdminUsers = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      filter: advancedFilterSchema,
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      users: Array<AdminUser>
      totalCount: number
      page: number
    }> => {
      await requireAdmin()

      const { logAnalyticsQuery } = await import('../log-analytics-client')
      const kql = filterKql(data.filter).trim()

      const queryResult = await logAnalyticsQuery(kql)
      const table = queryResult.tables[0]
      if (!table || table.rows.length === 0) {
        return { users: [], totalCount: 0, page: data.page }
      }

      const subIds = table.rows.map((row) => String(row[0]))
      const userIds = subIds
        .map(extractUserIdFromSubscription)
        .filter((id): id is string => id != null)
      const uniqueUserIds = [...new Set(userIds)]

      // Paginate
      const offset = (data.page - 1) * data.pageSize
      const pageIds = uniqueUserIds.slice(offset, offset + data.pageSize)
      if (pageIds.length === 0) {
        return { users: [], totalCount: uniqueUserIds.length, page: data.page }
      }

      const { createClerkClient } = await import('@clerk/backend')
      const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })

      const usersRaw = await Promise.all(
        pageIds.map(async (userId): Promise<AdminUser | null> => {
          try {
            const user = await clerk.users.getUser(userId)
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
                `/users/${userId}/subscriptions`,
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
              // APIM lookup may fail
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
          } catch {
            return null
          }
        }),
      )

      return {
        users: usersRaw.filter((u): u is AdminUser => u != null),
        totalCount: uniqueUserIds.length,
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

const subscriptionIdSchema = z
  .string()
  .regex(/^[\w-]+$/, 'Invalid subscription ID')

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
          planId: sub?.metadata?.planId ?? item?.price?.lookup_key ?? null,
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
            lastPaymentError: inv.last_finalization_error?.message ?? null,
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
        const resetDate =
          resetEpoch > 0
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

export const getAdminUserAnalytics = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }))
  .handler(async ({ data }) => {
    await requireAdmin()

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    const now = new Date()
    const monthStart = new Date(now)
    monthStart.setUTCDate(now.getUTCDate() - 30)

    const [
      usageReport,
      dailyTrend,
      endpoints,
      errors,
      recentErrors,
      rateLimitAccess,
      serviceHealth,
    ] = await Promise.all([
      _queryUsageReport(filter, monthStart.toISOString(), now.toISOString()),
      _queryDailyTrend(filter),
      _queryEndpointBreakdown(filter),
      _queryErrorBreakdown(filter),
      _queryRecentErrors(filter),
      _queryRateLimitAccess(filter),
      _queryServiceHealth(filter),
    ])

    return {
      usageReport,
      dailyTrend,
      endpoints,
      errors,
      recentErrors,
      rateLimitAccess,
      serviceHealth,
    }
  })

// Compound cursor: "timestamp|itemId" or legacy "timestamp"
const cursorTimestampSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?(\|[\w-]+)?$/,
    'Invalid cursor',
  )

const requestLogFilterSchema = z.enum([
  'all',
  'success',
  'client-error',
  'server-error',
  'rate-limited',
])

const requestLogTimeRangeSchema = z.enum(['1h', '6h', '24h', '7d', '30d'])

export const getAdminRequestLog = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      subscriptionId: subscriptionIdSchema,
      timeRange: requestLogTimeRangeSchema,
      statusFilter: requestLogFilterSchema,
      cursor: cursorTimestampSchema.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const filter = `and ApimSubscriptionId == '${data.subscriptionId}'`
    return _queryRequestLog(filter, {
      timeRange: data.timeRange,
      statusFilter: data.statusFilter,
      cursor: data.cursor,
      limit: data.limit,
    })
  })

// --- Activity Heatmap ---

export interface ActivityHeatmapCell {
  dayOfWeek: number // 0=Sun, 6=Sat
  hour: number // 0-23
  calls: number
}

export const getAdminUserActivityHeatmap = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subscriptionId: subscriptionIdSchema }))
  .handler(async ({ data }): Promise<Array<ActivityHeatmapCell>> => {
    await requireAdmin()

    const { logAnalyticsQuery } = await import('../log-analytics-client')
    const { env } = await import('@/env')
    if (!env.APIM_LOG_ANALYTICS_WORKSPACE_ID) return []

    const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(30d)
  and ApimSubscriptionId == '${data.subscriptionId}'
| extend dow = dayofweek(TimeGenerated) / 1d, hourOfDay = hourofday(TimeGenerated)
| summarize calls = count() by toint(dow), toint(hourOfDay)
| project dayOfWeek = dow, hour = hourOfDay, calls
`.trim()

    try {
      const result = await logAnalyticsQuery(kql)
      const table = result.tables[0]
      if (!table || table.rows.length === 0) return []

      const cols = table.columns.map((c) => c.name)
      const dowIdx = cols.indexOf('dayOfWeek')
      const hourIdx = cols.indexOf('hour')
      const callsIdx = cols.indexOf('calls')

      return table.rows.map((row) => ({
        dayOfWeek: Number(row[dowIdx]) || 0,
        hour: Number(row[hourIdx]) || 0,
        calls: Number(row[callsIdx]) || 0,
      }))
    } catch {
      return []
    }
  })
