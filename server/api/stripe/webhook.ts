import { HTTPError, defineHandler } from 'h3'
import type Stripe from 'stripe'
import type { getStripe as GetStripeFn } from '@/lib/server/stripe/client'
import type { resolvePlanId as ResolvePlanIdFn } from '@/lib/server/stripe/tier-resolver'
import type { PlanId } from '@/types/plans'
import { createLogger } from '@/lib/server/logger'

const log = createLogger('stripe-webhook')

// Tier changes are applied by the API gateway's own Stripe webhook
// (POST /webhooks/stripe on the gateway). This endpoint only handles the
// frontend's side effects: Resend audience segments and Clerk metadata.

// In-memory idempotency cache to prevent duplicate event processing.
// Restarts naturally clear this, which is acceptable — the worst case is a
// harmless re-sync of a Resend segment.
const PROCESSED_EVENTS = new Set<string>()
const MAX_CACHE_SIZE = 1000

function markEventProcessed(eventId: string) {
  if (PROCESSED_EVENTS.size >= MAX_CACHE_SIZE) {
    // Evict oldest entries (Set iterates in insertion order)
    const iterator = PROCESSED_EVENTS.values()
    for (let i = 0; i < MAX_CACHE_SIZE / 2; i++) {
      const next = iterator.next()
      if (next.done) break
      PROCESSED_EVENTS.delete(next.value)
    }
  }
  PROCESSED_EVENTS.add(eventId)
}

export default defineHandler(async (event) => {
  let getStripe: typeof GetStripeFn
  let resolvePlanId: typeof ResolvePlanIdFn

  try {
    const stripeClientMod = await import('@/lib/server/stripe/client')
    const tierResolverMod = await import('@/lib/server/stripe/tier-resolver')
    getStripe = stripeClientMod.getStripe
    resolvePlanId = tierResolverMod.resolvePlanId
  } catch (err) {
    log.error({ err }, 'Failed to import modules')
    throw new HTTPError({ statusCode: 500, statusMessage: 'Internal error' })
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    log.error('STRIPE_WEBHOOK_SECRET not configured')
    throw new HTTPError({
      statusCode: 500,
      statusMessage: 'Webhook secret not configured',
    })
  }

  const body = await event.req.text()
  const sig = event.req.headers.get('stripe-signature')

  if (!body || !sig) {
    log.error('Missing body or signature')
    throw new HTTPError({
      statusCode: 400,
      statusMessage: 'Missing body or signature',
    })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    log.error({ err }, 'Signature verification failed')
    throw new HTTPError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  if (PROCESSED_EVENTS.has(stripeEvent.id)) {
    log.info({ eventId: stripeEvent.id }, 'Skipping duplicate event')
    return { received: true }
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object
        const clerkUserId = session.metadata?.clerkUserId
        const planId = session.metadata?.planId
        if (clerkUserId && planId) {
          await syncResendSegment(clerkUserId, resolvePlanId(undefined, planId))
        } else {
          log.warn('Missing clerkUserId or planId in checkout session metadata')
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.resumed': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)
        if (!clerkUserId) break

        if (
          subscription.status !== 'active' &&
          subscription.status !== 'trialing'
        ) {
          await syncResendSegment(clerkUserId, 'student')
          break
        }
        // A subscription schedule defers plan changes to period end; the
        // segment follows when the schedule applies the change.
        if (subscription.schedule) break

        await syncResendSegment(
          clerkUserId,
          resolvePlanId(
            subscription.items.data[0]?.price.id,
            subscription.metadata?.planId,
          ),
        )
        break
      }

      case 'customer.subscription.paused':
      case 'customer.subscription.deleted': {
        const clerkUserId = await resolveClerkUserId(
          stripe,
          stripeEvent.data.object,
        )
        if (clerkUserId) await syncResendSegment(clerkUserId, 'student')
        break
      }

      case 'customer.deleted': {
        const customer = stripeEvent.data.object
        const clerkUserId = customer.metadata?.clerkUserId
        if (!clerkUserId) {
          log.warn(
            { customerId: customer.id },
            'Customer deleted but no clerkUserId in metadata',
          )
          break
        }

        // Clear the stale stripeCustomerId from Clerk so the next checkout
        // creates a fresh customer.
        try {
          const { clearStripeCustomerId } =
            await import('@/lib/server/clerk-admin')
          await clearStripeCustomerId(clerkUserId)
        } catch (err) {
          // Non-fatal — getOrCreateStripeCustomer also handles stale IDs
          log.warn(
            { err, userId: clerkUserId },
            'Failed to clear stale stripeCustomerId from Clerk',
          )
        }
        await syncResendSegment(clerkUserId, 'student')
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object
        log.warn(
          { customerId: invoice.customer },
          'Payment failed for customer',
        )
        const subRef = invoice.parent?.subscription_details?.subscription
        if (subRef) {
          const subId = typeof subRef === 'string' ? subRef : subRef.id
          const subscription = await stripe.subscriptions.retrieve(subId)
          const clerkUserId = await resolveClerkUserId(stripe, subscription)
          if (clerkUserId) await syncResendSegment(clerkUserId, 'student')
        }
        break
      }
    }
  } catch (err) {
    // Stripe lookups failed — return 500 so Stripe retries the webhook.
    log.error({ err }, 'Stripe webhook handling failed')
    throw new HTTPError({ statusCode: 500, statusMessage: 'Webhook failed' })
  }

  markEventProcessed(stripeEvent.id)
  return { received: true }
})

// --- Resend Segment Sync ---
// Updates the user's Resend segment after a tier change. Never throws —
// failures are logged.

async function syncResendSegment(
  clerkUserId: string,
  newTier: PlanId,
): Promise<void> {
  try {
    const { getUserPrimaryEmail } = await import('@/lib/server/clerk-admin')
    const email = await getUserPrimaryEmail(clerkUserId)

    if (!email) {
      log.warn(
        { userId: clerkUserId },
        'No email found for user — skipping Resend segment sync',
      )
      return
    }

    const { updateContactTierSegment } =
      await import('@/lib/server/email/contacts')
    await updateContactTierSegment(email, newTier)
  } catch (err) {
    log.warn(
      { err, userId: clerkUserId },
      'Failed to sync Resend segment (non-fatal)',
    )
  }
}

// --- Resolve Clerk User ID ---
// Checks subscription metadata first, then falls back to Stripe customer metadata.

async function resolveClerkUserId(
  stripe: ReturnType<typeof GetStripeFn>,
  subscription: {
    metadata: Record<string, string>
    customer: string | { id: string }
  },
): Promise<string | undefined> {
  const fromSub = subscription.metadata?.clerkUserId
  if (fromSub) return fromSub

  // Network errors throw so Stripe retries the webhook.
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return undefined
  return (customer as Stripe.Customer).metadata?.clerkUserId || undefined
}
