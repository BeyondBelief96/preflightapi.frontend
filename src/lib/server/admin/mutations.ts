import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminFetch } from '../gateway/client'
import { getStripe } from '../stripe/client'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import { env } from '@/env'

const log = createLogger('admin')

const planIdSchema = z.enum(['student', 'private', 'commercial'])
const userIdSchema = z.string().min(1).max(128)

function userPath(userId: string): string {
  return `/users/${encodeURIComponent(userId)}`
}

/**
 * Manual tier override in the gateway. A later Stripe event for the user
 * (renewal, plan change, cancellation) will overwrite it.
 */
export const adminChangeTier = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: userIdSchema, planId: planIdSchema }))
  .handler(async ({ data }) => {
    await requireAdmin()

    await adminFetch(`${userPath(data.userId)}/tier`, {
      method: 'PUT',
      body: JSON.stringify({ tier: data.planId }),
    })

    log.info(
      { userId: data.userId, planId: data.planId },
      'Admin changed user tier',
    )
    return { success: true, planId: data.planId }
  })

export const adminCancelSubscription = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: userIdSchema }))
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

    // The gateway's Stripe webhook also downgrades on cancellation; do it
    // here too so the change is immediate.
    await adminFetch(`${userPath(data.userId)}/tier`, {
      method: 'PUT',
      body: JSON.stringify({ tier: 'student' }),
    })

    log.info(
      { userId: data.userId },
      'Admin canceled subscription and downgraded to student',
    )
    return { success: true }
  })

export const adminResetQuota = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: userIdSchema }))
  .handler(async ({ data }) => {
    await requireAdmin()

    await adminFetch(`${userPath(data.userId)}/quota/reset`, {
      method: 'POST',
    })

    log.info({ userId: data.userId }, 'Admin reset user quota')
    return { success: true }
  })

export const adminRevokeApiKey = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: userIdSchema, keyId: z.uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin()

    await adminFetch(`${userPath(data.userId)}/keys/${data.keyId}`, {
      method: 'DELETE',
    })

    log.info(
      { userId: data.userId, keyId: data.keyId },
      'Admin revoked API key',
    )
    return { success: true }
  })
