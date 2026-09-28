import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { scopeFilter } from '../gateway/analytics'
import { gatewayDb, isGatewayDbConfigured } from '../gateway/db'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import { env } from '@/env'

const log = createLogger('admin-search')

export interface AdminSearchResult {
  type: 'user' | 'api-key' | 'ip'
  title: string
  subtitle: string
  href: string
}

// API keys are stored hashed; their first 12 characters are kept as a display prefix
const API_KEY_PREFIX_LENGTH = 12

export const adminGlobalSearch = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ query: z.string().min(1).max(200) }))
  .handler(async ({ data }): Promise<Array<AdminSearchResult>> => {
    await requireAdmin()

    const q = data.query.trim()
    const results: Array<AdminSearchResult> = []

    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(q)
    const isUserId = /^user_\w+$/.test(q)
    const isApiKey = /^pf_live_\w{4}/.test(q)
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
            const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
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

    // IP address search over the gateway request log
    if (isIp && isGatewayDbConfigured()) {
      searches.push(
        (async () => {
          try {
            const sql = await gatewayDb()
            const rows = await sql<Array<{ userId: string; calls: number }>>`
              select user_id as "userId", count(*)::int as "calls"
              from gateway.api_requests
              where ts >= now() - interval '7 days' and client_ip = ${q}
                and user_id is not null ${scopeFilter(sql, 'all')}
              group by user_id
              order by "calls" desc
              limit 5
            `
            for (const row of rows) {
              results.push({
                type: 'ip',
                title: `IP ${q}`,
                subtitle: `${row.userId} · ${row.calls} calls (7d)`,
                href: `/dashboard/admin/users/${row.userId}`,
              })
            }
          } catch (err) {
            log.error({ err }, 'IP search failed')
          }
        })(),
      )
    }

    // API key lookup by its (non-secret) prefix
    if (isApiKey && isGatewayDbConfigured()) {
      searches.push(
        (async () => {
          try {
            const sql = await gatewayDb()
            const prefix = q.slice(0, API_KEY_PREFIX_LENGTH)
            const rows = await sql<
              Array<{ userId: string; name: string; revoked: boolean }>
            >`
              select user_id as "userId", name, revoked_at is not null as "revoked"
              from gateway.api_keys
              where prefix = ${prefix}
              limit 5
            `
            for (const row of rows) {
              results.push({
                type: 'api-key',
                title: `${prefix}… (${row.name})${row.revoked ? ' — revoked' : ''}`,
                subtitle: row.userId,
                href: `/dashboard/admin/users/${row.userId}`,
              })
            }
          } catch (err) {
            log.error({ err }, 'API key search failed')
          }
        })(),
      )
    }

    // Clerk user ID direct lookup
    if (isUserId) {
      results.push({
        type: 'user',
        title: q,
        subtitle: 'User ID',
        href: `/dashboard/admin/users/${q}`,
      })
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
                results[stripeResultIdx].href =
                  `/dashboard/admin/users/${clerkResult.data[0].id}`
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
