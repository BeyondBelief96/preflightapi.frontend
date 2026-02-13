import { HTTPError, defineHandler } from 'h3'
import type Stripe from 'stripe'
import type { getStripe as GetStripeFn } from '@/lib/server/stripe-client'
import type { apimFetch as ApimFetchFn } from '@/lib/server/apim-client'
import type { getApimProductIds as GetApimProductIdsFn } from '@/lib/server/apim-products'
import type { resolveApimProductId as ResolveApimProductIdFn } from '@/lib/server/stripe-tier-resolver'
import type { SubscriptionListResponse } from '@/types/apim'
import { createLogger } from '@/lib/server/logger'

const log = createLogger('stripe-webhook')

export default defineHandler(async (event) => {
  let getStripe: typeof GetStripeFn
  let apimFetch: typeof ApimFetchFn
  let getApimProductIds: typeof GetApimProductIdsFn
  let resolveApimProductId: typeof ResolveApimProductIdFn

  try {
    const stripeClientMod = await import('@/lib/server/stripe-client')
    const apimClientMod = await import('@/lib/server/apim-client')
    const apimProductsMod = await import('@/lib/server/apim-products')
    const tierResolverMod = await import('@/lib/server/stripe-tier-resolver')
    getStripe = stripeClientMod.getStripe
    apimFetch = apimClientMod.apimFetch
    getApimProductIds = apimProductsMod.getApimProductIds
    resolveApimProductId = tierResolverMod.resolveApimProductId
  } catch (err) {
    log.error({ err }, 'Failed to import modules')
    return { received: true }
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    log.error('STRIPE_WEBHOOK_SECRET not configured')
    return { received: true }
  }

  // Warn about missing price env vars (makes misconfiguration visible in logs)
  if (!process.env.STRIPE_PRIVATE_PRICE_ID) {
    log.warn('STRIPE_PRIVATE_PRICE_ID is not set — price-based tier mapping will fail for private plans')
  }
  if (!process.env.STRIPE_COMMERCIAL_PRICE_ID) {
    log.warn('STRIPE_COMMERCIAL_PRICE_ID is not set — price-based tier mapping will fail for commercial plans')
  }

  const body = await event.req.text()
  const sig = event.req.headers.get('stripe-signature')

  if (!body || !sig) {
    log.error('Missing body or signature')
    return { received: true }
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    log.error({ err }, 'Signature verification failed')
    throw new HTTPError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const productIds = getApimProductIds()
  const studentProductId = productIds.student

  // Event parsed successfully — now handle it.
  // APIM sync errors throw a 500 so Stripe retries the webhook.
  // Non-critical warnings (missing metadata, unknown plan) return 200.
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object
        const clerkUserId = session.metadata?.clerkUserId
        const planId = session.metadata?.planId

        if (clerkUserId && planId) {
          const apimProductId = productIds[planId]
          if (apimProductId) {
            await syncTierToApim(apimFetch, clerkUserId, apimProductId)
          } else {
            log.warn({ planId }, 'No APIM product found for planId')
          }
        } else {
          log.warn('Missing clerkUserId or planId in checkout session metadata')
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (!clerkUserId) {
          log.warn('Could not resolve clerkUserId for subscription, skipping')
          break
        }

        if (subscription.status === 'active') {
          const apimProductId = resolveApimProductId(
            subscription.items.data[0]?.price.id,
            subscription.metadata?.planId,
            productIds,
          )
          await syncTierToApim(apimFetch, clerkUserId, apimProductId)
        } else {
          // Any non-active status loses paid access immediately.
          // If Stripe recovers a past_due payment, subscription.updated
          // fires again with status=active and we re-sync the paid tier.
          await syncTierToApim(apimFetch, clerkUserId, studentProductId)
        }
        break
      }

      case 'customer.subscription.paused': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (clerkUserId) {
          await syncTierToApim(apimFetch, clerkUserId, studentProductId)
        } else {
          log.warn('Could not resolve clerkUserId for paused subscription')
        }
        break
      }

      case 'customer.subscription.resumed': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (!clerkUserId) {
          log.warn('Could not resolve clerkUserId for resumed subscription')
          break
        }

        const apimProductId = resolveApimProductId(
          subscription.items.data[0]?.price.id,
          subscription.metadata?.planId,
          productIds,
        )
        await syncTierToApim(apimFetch, clerkUserId, apimProductId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (clerkUserId) {
          await syncTierToApim(apimFetch, clerkUserId, studentProductId)
        } else {
          log.warn('Could not resolve clerkUserId for deleted subscription')
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object
        log.warn({ customerId: invoice.customer }, 'Payment failed for customer')

        // Downgrade to student tier so user doesn't keep paid access
        const subRef = invoice.parent?.subscription_details?.subscription
        if (subRef) {
          const subId = typeof subRef === 'string' ? subRef : subRef.id
          const subscription = await stripe.subscriptions.retrieve(subId)
          const clerkUserId = await resolveClerkUserId(stripe, subscription)

          if (clerkUserId) {
            await syncTierToApim(apimFetch, clerkUserId, studentProductId)
          } else {
            log.warn('Could not resolve clerkUserId for failed invoice subscription')
          }
        }
        break
      }
    }
  } catch (err) {
    // APIM sync failed — return 500 so Stripe retries the webhook
    log.error({ err }, 'APIM sync error')
    throw new HTTPError({ statusCode: 500, statusMessage: 'APIM sync failed' })
  }

  return { received: true }
})

// --- Resolve Clerk User ID ---
// Checks subscription metadata first, then falls back to Stripe customer metadata.

async function resolveClerkUserId(
  stripe: ReturnType<typeof GetStripeFn>,
  subscription: { metadata: Record<string, string>; customer: string | { id: string } },
): Promise<string | undefined> {
  // Fast path: subscription metadata
  const fromSub = subscription.metadata?.clerkUserId
  if (fromSub) return fromSub

  // Fallback: look up the Stripe customer's metadata.
  // Network errors throw so Stripe retries the webhook.
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return undefined
  return (customer as Stripe.Customer).metadata?.clerkUserId || undefined
}

// --- APIM Sync Helper ---

type ApimFetchFn = <T = unknown>(
  path: string,
  options?: RequestInit,
) => Promise<T>

async function syncTierToApim(
  apimFetch: ApimFetchFn,
  clerkUserId: string,
  apimProductId: string,
): Promise<void> {
  const result = await apimFetch<SubscriptionListResponse>(
    `/users/${clerkUserId}/subscriptions`,
  )

  const activeSubs = result.value.filter(
    (s) => s.properties.state === 'active',
  )

  if (activeSubs.length === 0) {
    log.warn({ userId: clerkUserId }, 'No active APIM subscription found for user')
    return
  }

  // Sync ALL active subscriptions to prevent orphaned subs with stale tiers
  await Promise.all(
    activeSubs.map((sub) =>
      apimFetch(`/subscriptions/${sub.name}`, {
        method: 'PATCH',
        body: JSON.stringify({
          properties: {
            scope: `/products/${apimProductId}`,
          },
        }),
      }),
    ),
  )

  log.info(
    { userId: clerkUserId, productId: apimProductId, subCount: activeSubs.length },
    'Synced user to APIM product',
  )
}
