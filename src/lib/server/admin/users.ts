import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getStripe } from '../stripe/client'
import {
  queryDailyTrend,
  queryEndpointBreakdown,
  queryErrorBreakdown,
  queryRateLimitAccess,
  queryRecentErrors,
  queryRequestLog,
  queryServiceHealth,
  queryUsageReport,
  queryUserHealthBatch,
  scopeFilter,
} from '../gateway/analytics'
import { GatewayError, adminFetch } from '../gateway/client'
import { gatewayDb, isGatewayDbConfigured } from '../gateway/db'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import type { User as ClerkUser } from '@clerk/backend'
import type { AdminAccountDetail } from '@/types/gateway'
import { env } from '@/env'

const log = createLogger('admin')

const userIdSchema = z.string().min(1).max(128)

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
  tier: string
}

/** Gateway tiers for the given users (users without an account are Student Pilot). */
async function tiersFor(userIds: Array<string>): Promise<Map<string, string>> {
  const tiers = new Map<string, string>()
  if (userIds.length === 0 || !isGatewayDbConfigured()) return tiers
  try {
    const sql = await gatewayDb()
    const rows = await sql<Array<{ userId: string; tier: string }>>`
      select user_id as "userId", tier from gateway.accounts
      where user_id in ${sql(userIds)}
    `
    for (const row of rows) tiers.set(row.userId, row.tier)
  } catch (err) {
    log.error({ err }, 'Failed to load gateway tiers')
  }
  return tiers
}

function toAdminUser(user: ClerkUser, tier: string | undefined): AdminUser {
  return {
    clerkId: user.id,
    email:
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? '',
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt,
    stripeCustomerId:
      (user.privateMetadata as { stripeCustomerId?: string })
        ?.stripeCustomerId ?? null,
    tier: tier ?? 'student',
  }
}

async function clerk() {
  const { createClerkClient } = await import('@clerk/backend')
  return createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
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
      const client = await clerk()

      const isTierFiltered = data.tier !== 'all'
      const offset = (data.page - 1) * data.pageSize

      // When filtering by tier we must fetch a larger batch and filter here
      // since Clerk doesn't know tiers. This only works reliably for page 1 —
      // pagination with tier filter is not supported.
      const clerkResponse = await client.users.getUserList({
        limit: isTierFiltered ? 100 : data.pageSize,
        offset: isTierFiltered ? 0 : offset,
        ...(data.search ? { query: data.search } : {}),
      })

      const tiers = await tiersFor(clerkResponse.data.map((u) => u.id))
      const allUsers = clerkResponse.data.map((u) =>
        toAdminUser(u, tiers.get(u.id)),
      )

      const filtered = isTierFiltered
        ? allUsers.filter((u) => u.tier === data.tier)
        : allUsers

      return {
        users: isTierFiltered ? filtered.slice(0, data.pageSize) : filtered,
        // When tier-filtered, report filtered.length as total so the UI
        // won't render pagination controls for pages we can't serve.
        totalCount: isTierFiltered ? filtered.length : clerkResponse.totalCount,
        page: data.page,
      }
    },
  )

export const getAdminUserHealthBatch = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userIds: z.array(userIdSchema).max(100) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const healthMap = await queryUserHealthBatch(data.userIds)
    return Object.fromEntries(healthMap)
  })

const advancedFilterSchema = z.enum([
  'high-error',
  'near-quota',
  'high-usage',
  'rate-limited',
])
export type AdvancedFilter = z.infer<typeof advancedFilterSchema>

/** User IDs matching an advanced filter, most notable first (max 50). */
async function filteredUserIds(filter: AdvancedFilter): Promise<Array<string>> {
  if (!isGatewayDbConfigured()) return []
  const sql = await gatewayDb()
  const scope = scopeFilter(sql, 'all')

  const queries: Record<
    AdvancedFilter,
    () => Promise<Array<{ userId: string }>>
  > = {
    'high-error': () => sql`
      select user_id as "userId"
      from gateway.api_requests
      where ts >= now() - interval '7 days' and user_id is not null ${scope}
      group by user_id
      having count(*) >= 50
        and 100.0 * count(*) filter (where status >= 500) / count(*) > 10
      order by 100.0 * count(*) filter (where status >= 500) / count(*) desc
      limit 50`,
    'near-quota': () => sql`
      select user_id as "userId"
      from gateway.api_requests
      where ts >= now() - interval '30 days' and user_id is not null ${scope}
      group by user_id
      having count(*) > 4000
      order by count(*) desc
      limit 50`,
    'high-usage': () => sql`
      select user_id as "userId"
      from gateway.api_requests
      where ts >= now() - interval '30 days' and user_id is not null ${scope}
      group by user_id
      order by count(*) desc
      limit 50`,
    'rate-limited': () => sql`
      select user_id as "userId"
      from gateway.api_requests
      where ts >= now() - interval '7 days' and status = 429 and user_id is not null ${scope}
      group by user_id
      order by count(*) desc
      limit 50`,
  }

  const rows = await queries[filter]()
  return rows.map((r) => r.userId)
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

      const userIds = await filteredUserIds(data.filter)
      const offset = (data.page - 1) * data.pageSize
      const pageIds = userIds.slice(offset, offset + data.pageSize)
      if (pageIds.length === 0) {
        return { users: [], totalCount: userIds.length, page: data.page }
      }

      const client = await clerk()
      const tiers = await tiersFor(pageIds)
      const users = await Promise.all(
        pageIds.map(async (userId): Promise<AdminUser | null> => {
          try {
            return toAdminUser(
              await client.users.getUser(userId),
              tiers.get(userId),
            )
          } catch {
            return null
          }
        }),
      )

      return {
        users: users.filter((u): u is AdminUser => u != null),
        totalCount: userIds.length,
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
  /** Gateway account (tier, keys); null if the user has never used the API or created a key. */
  gateway: AdminAccountDetail | null
  quota: {
    callsUsed: number
    callsLimit: number | null
    periodStart: string
    periodEnd: string
  } | null
}

export const getAdminUserDetail = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userId: userIdSchema }))
  .handler(async ({ data }): Promise<AdminUserDetail> => {
    await requireAdmin()

    const user = await (await clerk()).users.getUser(data.userId)
    const adminUser = toAdminUser(user, undefined)
    const stripeCustomerId = adminUser.stripeCustomerId

    const [gateway, stripeData] = await Promise.all([
      adminFetch<AdminAccountDetail>(
        `/users/${encodeURIComponent(data.userId)}`,
      ).catch((err: unknown) => {
        if (!(err instanceof GatewayError && err.status === 404)) {
          log.error({ err }, 'Failed to load gateway account')
        }
        return null
      }),
      (async (): Promise<AdminUserDetail['stripe']> => {
        if (!stripeCustomerId) {
          return {
            customerId: null,
            subscriptionStatus: null,
            planId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            recentInvoices: [],
          }
        }

        const stripe = getStripe()
        const [subscriptions, invoices] = await Promise.all([
          stripe.subscriptions.list({ customer: stripeCustomerId, limit: 1 }),
          stripe.invoices.list({ customer: stripeCustomerId, limit: 10 }),
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

    return {
      clerk: {
        id: user.id,
        email: adminUser.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      },
      stripe: stripeData,
      gateway,
      quota: gateway
        ? {
            callsUsed: gateway.quota.used,
            callsLimit: gateway.limits.callsPerMonth,
            periodStart: gateway.quota.periodStart,
            periodEnd: gateway.quota.periodEnd,
          }
        : null,
    }
  })

export const getAdminUserAnalytics = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userId: userIdSchema }))
  .handler(async ({ data }) => {
    await requireAdmin()

    const scope = { userId: data.userId }
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
      queryUsageReport(scope, monthStart.toISOString(), now.toISOString()),
      queryDailyTrend(scope),
      queryEndpointBreakdown(scope),
      queryErrorBreakdown(scope),
      queryRecentErrors(scope),
      queryRateLimitAccess(scope),
      queryServiceHealth(scope),
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

// Compound cursor: "timestamp|id"
const cursorSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?\|\d+$/,
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
      userId: userIdSchema,
      timeRange: requestLogTimeRangeSchema,
      statusFilter: requestLogFilterSchema,
      cursor: cursorSchema.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    return queryRequestLog(
      { userId: data.userId },
      {
        timeRange: data.timeRange,
        statusFilter: data.statusFilter,
        cursor: data.cursor,
        limit: data.limit,
      },
    )
  })

// --- Activity Heatmap ---

export interface ActivityHeatmapCell {
  dayOfWeek: number // 0=Sun, 6=Sat
  hour: number // 0-23
  calls: number
}

export const getAdminUserActivityHeatmap = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userId: userIdSchema }))
  .handler(async ({ data }): Promise<Array<ActivityHeatmapCell>> => {
    await requireAdmin()
    if (!isGatewayDbConfigured()) return []

    try {
      const sql = await gatewayDb()
      const rows = await sql<Array<ActivityHeatmapCell>>`
        select
          extract(dow from ts at time zone 'UTC')::int as "dayOfWeek",
          extract(hour from ts at time zone 'UTC')::int as "hour",
          count(*)::int as "calls"
        from gateway.api_requests
        where ts >= now() - interval '30 days' and user_id = ${data.userId}
        group by 1, 2
      `
      return Array.from(rows)
    } catch (err) {
      log.error({ err }, 'Failed to load activity heatmap')
      return []
    }
  })
