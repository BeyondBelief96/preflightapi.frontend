import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import type Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  let getStripe: typeof import('../../../src/lib/server/stripe-client').getStripe
  let apimFetch: typeof import('../../../src/lib/server/apim-client').apimFetch
  let PLANS: typeof import('../../../src/lib/constants').PLANS

  try {
    const stripeClientMod =
      await import('../../../src/lib/server/stripe-client')
    const apimClientMod = await import('../../../src/lib/server/apim-client')
    const constantsMod = await import('../../../src/lib/constants')
    getStripe = stripeClientMod.getStripe
    apimFetch = apimClientMod.apimFetch
    PLANS = constantsMod.PLANS
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
  if (!process.env.STRIPE_STARTER_PRICE_ID) {
    console.warn(
      '[Stripe Webhook] STRIPE_STARTER_PRICE_ID is not set — price-based tier mapping will fail for starter plans',
    )
  }
  if (!process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
    console.warn(
      '[Stripe Webhook] STRIPE_PROFESSIONAL_PRICE_ID is not set — price-based tier mapping will fail for professional plans',
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
          const plan = PLANS.find((p) => p.id === planId)
          if (plan) {
            await syncTierToApim(apimFetch, clerkUserId, plan.apimProductId)
          } else {
            console.warn(`[Stripe Webhook] No plan found for planId=${planId}`)
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
          const resolvedPlanId = planIdFromPriceId(priceId) || metadataPlanId
          const plan = PLANS.find((p) => p.id === resolvedPlanId)

          if (plan) {
            await syncTierToApim(apimFetch, clerkUserId, plan.apimProductId)
          } else {
            console.warn(
              `[Stripe Webhook] Could not resolve plan — priceId=${priceId}, metadataPlanId=${metadataPlanId}`,
            )
          }
        } else {
          await syncTierToApim(apimFetch, clerkUserId, 'free-tier')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (clerkUserId) {
          await syncTierToApim(apimFetch, clerkUserId, 'free-tier')
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
  stripe: ReturnType<typeof import('../../../src/lib/server/stripe-client').getStripe>,
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

// --- Price ID → Plan ID Lookup ---

function planIdFromPriceId(priceId: string | undefined): string | undefined {
  if (!priceId) return undefined
  const map: Record<string, string | undefined> = {
    [process.env.STRIPE_STARTER_PRICE_ID ?? '']: 'starter',
    [process.env.STRIPE_PROFESSIONAL_PRICE_ID ?? '']: 'professional',
  }
  return map[priceId]
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
  type SubscriptionListResponse = {
    value: Array<{
      name: string
      properties: { scope: string; state: string }
    }>
  }

  const result = await apimFetch<SubscriptionListResponse>(
    `/users/${clerkUserId}/subscriptions`,
  )

  const activeSub = result.value.find((s) => s.properties.state === 'active')

  if (!activeSub) {
    console.warn(
      `[Stripe Webhook] No active APIM subscription found for user ${clerkUserId}`,
    )
    return
  }

  await apimFetch(`/subscriptions/${activeSub.name}`, {
    method: 'PATCH',
    body: JSON.stringify({
      properties: {
        scope: `/products/${apimProductId}`,
      },
    }),
  })
}
