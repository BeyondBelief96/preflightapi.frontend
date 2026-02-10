import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import type Stripe from 'stripe'
import type { getStripe as GetStripeFn } from '../../../src/lib/server/stripe-client'
import type { apimFetch as ApimFetchFn } from '../../../src/lib/server/apim-client'
import type { planIdFromPriceId as PlanIdFromPriceIdFn } from '../../../src/lib/server/stripe-utils'
import type { getApimProductIds as GetApimProductIdsFn } from '../../../src/lib/server/apim-products'
import type { SubscriptionListResponse } from '../../../src/types/apim'

export default defineEventHandler(async (event) => {
  let getStripe: typeof GetStripeFn
  let apimFetch: typeof ApimFetchFn
  let planIdFromPriceId: typeof PlanIdFromPriceIdFn
  let getApimProductIds: typeof GetApimProductIdsFn

  try {
    const stripeClientMod =
      await import('../../../src/lib/server/stripe-client')
    const apimClientMod = await import('../../../src/lib/server/apim-client')
    const stripeUtilsMod = await import('../../../src/lib/server/stripe-utils')
    const apimProductsMod = await import(
      '../../../src/lib/server/apim-products'
    )
    getStripe = stripeClientMod.getStripe
    apimFetch = apimClientMod.apimFetch
    planIdFromPriceId = stripeUtilsMod.planIdFromPriceId
    getApimProductIds = apimProductsMod.getApimProductIds
  } catch (err) {
    console.error('[Stripe Webhook] Failed to import modules:', err)
    return { received: true }
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return { received: true }
  }

  // Warn about missing price env vars (makes misconfiguration visible in logs)
  if (!process.env.STRIPE_PRIVATE_PRICE_ID) {
    console.warn(
      '[Stripe Webhook] STRIPE_PRIVATE_PRICE_ID is not set — price-based tier mapping will fail for private plans',
    )
  }
  if (!process.env.STRIPE_COMMERCIAL_PRICE_ID) {
    console.warn(
      '[Stripe Webhook] STRIPE_COMMERCIAL_PRICE_ID is not set — price-based tier mapping will fail for commercial plans',
    )
  }

  const body = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  if (!body || !sig) {
    console.error('[Stripe Webhook] Missing body or signature')
    return { received: true }
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return { received: true }
  }

  const productIds = getApimProductIds()
  const studentProductId = productIds.student

  // Maps legacy Stripe metadata plan IDs to current plan IDs
  const LEGACY_PLAN_IDS: Record<string, string> = {
    free: 'student',
    starter: 'private',
    professional: 'commercial',
  }
  const normalizePlanId = (id: string) => LEGACY_PLAN_IDS[id] ?? id

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
          const apimProductId = productIds[normalizePlanId(planId)]
          if (apimProductId) {
            await syncTierToApim(apimFetch, clerkUserId, apimProductId)
          } else {
            console.warn(`[Stripe Webhook] No APIM product found for planId=${planId}`)
          }
        } else {
          console.warn(
            '[Stripe Webhook] Missing clerkUserId or planId in checkout session metadata',
          )
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (!clerkUserId) {
          console.warn(
            '[Stripe Webhook] Could not resolve clerkUserId for subscription, skipping',
          )
          break
        }

        if (subscription.status === 'active') {
          const metadataPlanId = subscription.metadata?.planId
          const priceId = subscription.items.data[0]?.price.id
          // Price ID is the source of truth — portal upgrades change the price
          // but don't update our custom metadata
          const resolvedPlanId = planIdFromPriceId(priceId) || (metadataPlanId ? normalizePlanId(metadataPlanId) : undefined)
          const apimProductId = resolvedPlanId
            ? productIds[resolvedPlanId]
            : undefined

          if (apimProductId) {
            await syncTierToApim(apimFetch, clerkUserId, apimProductId)
          } else {
            console.warn(
              `[Stripe Webhook] Could not resolve plan — priceId=${priceId}, metadataPlanId=${metadataPlanId}`,
            )
          }
        } else {
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
          console.warn(
            '[Stripe Webhook] Could not resolve clerkUserId for paused subscription',
          )
        }
        break
      }

      case 'customer.subscription.resumed': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (!clerkUserId) {
          console.warn(
            '[Stripe Webhook] Could not resolve clerkUserId for resumed subscription',
          )
          break
        }

        const metadataPlanId = subscription.metadata?.planId
        const priceId = subscription.items.data[0]?.price.id
        const resolvedPlanId = planIdFromPriceId(priceId) || (metadataPlanId ? normalizePlanId(metadataPlanId) : undefined)
        const apimProductId = resolvedPlanId
          ? productIds[resolvedPlanId]
          : undefined

        if (apimProductId) {
          await syncTierToApim(apimFetch, clerkUserId, apimProductId)
        } else {
          console.warn(
            `[Stripe Webhook] Could not resolve plan for resumed sub — priceId=${priceId}, metadataPlanId=${metadataPlanId}`,
          )
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (clerkUserId) {
          await syncTierToApim(apimFetch, clerkUserId, studentProductId)
        } else {
          console.warn(
            '[Stripe Webhook] Could not resolve clerkUserId for deleted subscription',
          )
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object
        console.warn(
          `[Stripe Webhook] Payment failed for customer ${invoice.customer}`,
        )
        break
      }
    }
  } catch (err) {
    // APIM sync failed — return 500 so Stripe retries the webhook
    console.error('[Stripe Webhook] APIM sync error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'APIM sync failed',
    })
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

  // Fallback: look up the Stripe customer's metadata
  try {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return undefined
    return (customer as Stripe.Customer).metadata?.clerkUserId || undefined
  } catch (err) {
    console.error('[Stripe Webhook] Failed to look up customer metadata:', err)
    return undefined
  }
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
    console.warn(
      `[Stripe Webhook] No active APIM subscription found for user ${clerkUserId}`,
    )
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
}
