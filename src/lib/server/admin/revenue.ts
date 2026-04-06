import { createServerFn } from '@tanstack/react-start'
import { getStripe } from '../stripe/client'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import { env } from '@/env'

const log = createLogger('admin')

// --- Revenue Summary ---

export interface RevenueSummary {
  mrr: number
  customersByTier: Array<{ tier: string; count: number }>
  recentChurn: number
  totalUsers: number
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

      const { planIdFromPriceId } = await import('../stripe/utils')
      const tierCounts: Record<string, number> = {
        private: 0,
        commercial: 0,
      }
      for (const sub of allSubs) {
        const planId = planIdFromPriceId(sub.priceId)
        if (planId && tierCounts[planId] !== undefined) {
          tierCounts[planId]++
        }
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

      let totalUsers = 0
      try {
        const { createClerkClient } = await import('@clerk/backend')
        const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
        const { totalCount } = await clerk.users.getUserList({ limit: 1 })
        totalUsers = totalCount
      } catch (clerkErr) {
        log.warn({ err: clerkErr }, 'Failed to fetch total user count')
      }

      return {
        mrr,
        customersByTier: Object.entries(tierCounts).map(([tier, count]) => ({
          tier,
          count,
        })),
        recentChurn,
        totalUsers,
      }
    } catch (err) {
      log.error({ err }, 'Failed to fetch revenue summary')
      return { mrr: 0, customersByTier: [], recentChurn: 0, totalUsers: 0 }
    }
  },
)
