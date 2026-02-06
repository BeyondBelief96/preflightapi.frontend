import { defineEventHandler, readRawBody, getHeader } from 'h3'
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  let getStripe: typeof import('../../../src/lib/server/stripe-client').getStripe
  let apimFetch: typeof import('../../../src/lib/server/apim-client').apimFetch
  let PLANS: typeof import('../../../src/lib/constants').PLANS

  try {
    const stripeClientMod = await import('../../../src/lib/server/stripe-client')
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

  console.log(`[Stripe Webhook] Received event: ${stripeEvent.type}`)

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.clerkUserId
        const planId = session.metadata?.planId

        console.log(`[Stripe Webhook] checkout.session.completed — clerkUserId=${clerkUserId}, planId=${planId}`)

        if (clerkUserId && planId) {
          const plan = PLANS.find((p) => p.id === planId)
          if (plan) {
            console.log(`[Stripe Webhook] Syncing to APIM product: ${plan.apimProductId}`)
            await syncTierToApim(apimFetch, clerkUserId, plan.apimProductId)
          } else {
            console.warn(`[Stripe Webhook] No plan found for planId=${planId}`)
          }
        } else {
          console.warn('[Stripe Webhook] Missing clerkUserId or planId in checkout session metadata')
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const clerkUserId = subscription.metadata?.clerkUserId

        console.log(`[Stripe Webhook] subscription.updated — clerkUserId=${clerkUserId}, status=${subscription.status}`)

        if (!clerkUserId) {
          console.warn('[Stripe Webhook] No clerkUserId in subscription metadata, skipping')
          break
        }

        if (subscription.status === 'active') {
          const metadataPlanId = subscription.metadata?.planId
          const priceId = subscription.items.data[0]?.price.id
          // Price ID is the source of truth — portal upgrades change the price
          // but don't update our custom metadata
          const resolvedPlanId = planIdFromPriceId(priceId) || metadataPlanId

          console.log(`[Stripe Webhook] Active subscription — metadataPlanId=${metadataPlanId}, priceId=${priceId}, resolvedPlanId=${resolvedPlanId}`)

          const plan = PLANS.find((p) => p.id === resolvedPlanId)

          if (plan) {
            console.log(`[Stripe Webhook] Syncing to APIM product: ${plan.apimProductId}`)
            await syncTierToApim(apimFetch, clerkUserId, plan.apimProductId)
          } else {
            console.warn(`[Stripe Webhook] Could not resolve plan — metadataPlanId=${metadataPlanId}, priceId=${priceId}`)
          }
        } else {
          console.log(`[Stripe Webhook] Subscription not active (${subscription.status}), downgrading to free`)
          await syncTierToApim(apimFetch, clerkUserId, 'free-tier')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const clerkUserId = subscription.metadata?.clerkUserId

        console.log(`[Stripe Webhook] subscription.deleted — clerkUserId=${clerkUserId}`)

        if (clerkUserId) {
          await syncTierToApim(apimFetch, clerkUserId, 'free-tier')
        } else {
          console.warn('[Stripe Webhook] No clerkUserId in deleted subscription metadata')
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        console.warn(
          `[Stripe Webhook] Payment failed for customer ${invoice.customer}`,
        )
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${stripeEvent.type}`)
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err)
  }

  return { received: true }
})

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

  console.log(`[Stripe Webhook] syncTierToApim — user=${clerkUserId}, product=${apimProductId}`)

  const result = await apimFetch<SubscriptionListResponse>(
    `/users/${clerkUserId}/subscriptions`,
  )

  console.log(`[Stripe Webhook] Found ${result.value.length} APIM subscriptions`)

  const activeSub = result.value.find(
    (s) => s.properties.state === 'active',
  )

  if (!activeSub) {
    console.warn(
      `[Stripe Webhook] No active APIM subscription found for user ${clerkUserId}`,
    )
    return
  }

  console.log(`[Stripe Webhook] PATCHing APIM subscription ${activeSub.name} → /products/${apimProductId}`)

  await apimFetch(`/subscriptions/${activeSub.name}`, {
    method: 'PATCH',
    body: JSON.stringify({
      properties: {
        scope: `/products/${apimProductId}`,
      },
    }),
  })

  console.log(
    `[Stripe Webhook] Successfully synced APIM tier for ${clerkUserId} → ${apimProductId}`,
  )
}
