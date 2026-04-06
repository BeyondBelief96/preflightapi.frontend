import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { demoExclusion } from '../apim/analytics'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import { env } from '@/env'

const log = createLogger('admin-search')

export interface AdminSearchResult {
  type: 'user' | 'subscription' | 'ip'
  title: string
  subtitle: string
  href: string
}

function extractUserIdFromSubscription(subscriptionId: string): string | null {
  const match = subscriptionId.match(/^(user_[^-]+)/)
  return match?.[1] ?? null
}

export const adminGlobalSearch = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ query: z.string().min(1).max(200) }))
  .handler(async ({ data }): Promise<Array<AdminSearchResult>> => {
    await requireAdmin()

    const q = data.query.trim()
    const results: Array<AdminSearchResult> = []

    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(q)
    const isSubscriptionId = /^user_\w/.test(q)
    const isStripeId = /^cus_\w/.test(q)

    const searches: Array<Promise<void>> = []

    // Always search Clerk by name/email
    searches.push(
      (async () => {
        try {
          const { createClerkClient } = await import('@clerk/backend')
          const clerk = createClerkClient({
            secretKey: env.CLERK_SECRET_KEY,
          })
          const clerkResult = await clerk.users.getUserList({
            query: q,
            limit: 5,
          })
          for (const user of clerkResult.data) {
            const email =
              user.emailAddresses.find(
                (e) => e.id === user.primaryEmailAddressId,
              )?.emailAddress ?? ''
            const name =
              `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
            results.push({
              type: 'user',
              title: name || email,
              subtitle: name ? email : user.id,
              href: `/dashboard/admin/users/${user.id}`,
            })
          }
        } catch (err) {
          log.error({ err }, 'Clerk search failed')
        }
      })(),
    )

    // IP address search via KQL
    if (isIp && env.APIM_LOG_ANALYTICS_WORKSPACE_ID) {
      searches.push(
        (async () => {
          try {
            const { logAnalyticsQuery } = await import(
              '../log-analytics-client'
            )
            const safeIp = q.replace(/[^0-9.]/g, '')
            const kql = `
ApiManagementGatewayLogs
| where TimeGenerated >= ago(7d) and CallerIpAddress == '${safeIp}'
  ${demoExclusion()}
| summarize calls = count() by ApimSubscriptionId
| top 5 by calls desc`.trim()

            const result = await logAnalyticsQuery(kql)
            const table = result.tables[0]
            if (table && table.rows.length > 0) {
              for (const row of table.rows) {
                const subId = String(row[0])
                const userId = extractUserIdFromSubscription(subId)
                if (userId) {
                  results.push({
                    type: 'ip',
                    title: `IP ${safeIp}`,
                    subtitle: subId,
                    href: `/dashboard/admin/users/${userId}`,
                  })
                }
              }
            }
          } catch (err) {
            log.error({ err }, 'IP search failed')
          }
        })(),
      )
    }

    // Subscription ID direct lookup
    if (isSubscriptionId) {
      const userId = extractUserIdFromSubscription(q)
      if (userId) {
        results.push({
          type: 'subscription',
          title: q,
          subtitle: 'APIM Subscription',
          href: `/dashboard/admin/users/${userId}`,
        })
      }
    }

    // Stripe customer ID lookup
    if (isStripeId) {
      searches.push(
        (async () => {
          try {
            const { getStripe } = await import('../stripe/client')
            const stripe = getStripe()
            const customer = await stripe.customers.retrieve(q)
            if (!customer.deleted && customer.email) {
              const stripeResultIdx = results.length
              results.push({
                type: 'user',
                title: customer.email,
                subtitle: `Stripe: ${q}`,
                href: `/dashboard/admin/users/`, // Will need to look up Clerk ID
              })

              // Try to find corresponding Clerk user
              const { createClerkClient } = await import('@clerk/backend')
              const clerk = createClerkClient({
                secretKey: env.CLERK_SECRET_KEY,
              })
              const clerkResult = await clerk.users.getUserList({
                query: customer.email,
                limit: 1,
              })
              if (clerkResult.data.length > 0) {
                results[stripeResultIdx].href = `/dashboard/admin/users/${clerkResult.data[0].id}`
              }
            }
          } catch (err) {
            log.error({ err }, 'Stripe search failed')
          }
        })(),
      )
    }

    await Promise.allSettled(searches)
    return results.slice(0, 15)
  })
