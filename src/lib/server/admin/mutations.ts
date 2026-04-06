import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { apimFetch } from '../apim/client'
import { getApimProductIds } from '../apim/products'
import { getStripe } from '../stripe/client'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
import type { SubscriptionListResponse } from '@/types/apim'
import { env } from '@/env'

const log = createLogger('admin')

const planIdSchema = z.enum(['student', 'private', 'commercial', 'atp'])

export const adminChangeTier = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: z.string(), planId: planIdSchema }))
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

    const patchResults = await Promise.allSettled(
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

    const failures = patchResults.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    )
    if (failures.length > 0) {
      log.error(
        { userId: data.userId, failures: failures.length },
        'Failed to downgrade APIM subscriptions after cancellation',
      )
    }

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
