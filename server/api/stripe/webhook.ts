import { HTTPError, defineHandler } from 'h3'
import type Stripe from 'stripe'
import type { getStripe as GetStripeFn } from '@/lib/server/stripe-client'
import type { apimFetch as ApimFetchFn } from '@/lib/server/apim-client'
import type {
  getApimProductIds as GetApimProductIdsFn,
  isDowngrade as IsDowngradeFn,
  planIdFromProductId as PlanIdFromProductIdFn,
} from '@/lib/server/apim-products'
import type { resolveApimProductId as ResolveApimProductIdFn } from '@/lib/server/stripe-tier-resolver'
import type { SubscriptionListResponse } from '@/types/apim'
import { createLogger } from '@/lib/server/logger'

const log = createLogger('stripe-webhook')

// In-memory idempotency cache to prevent duplicate event processing.
// Serverless cold starts naturally clear this, which is acceptable —
// the worst case is a harmless re-process after a cold start.
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
  let apimFetch: typeof ApimFetchFn
  let getApimProductIds: typeof GetApimProductIdsFn
  let resolveApimProductId: typeof ResolveApimProductIdFn
  let isDowngrade: typeof IsDowngradeFn
  let planIdFromProductId: typeof PlanIdFromProductIdFn

  try {
    const stripeClientMod = await import('@/lib/server/stripe-client')
    const apimClientMod = await import('@/lib/server/apim-client')
    const apimProductsMod = await import('@/lib/server/apim-products')
    const tierResolverMod = await import('@/lib/server/stripe-tier-resolver')
    getStripe = stripeClientMod.getStripe
    apimFetch = apimClientMod.apimFetch
    getApimProductIds = apimProductsMod.getApimProductIds
    isDowngrade = apimProductsMod.isDowngrade
    planIdFromProductId = apimProductsMod.planIdFromProductId
    resolveApimProductId = tierResolverMod.resolveApimProductId
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

  // In production, price IDs are required — without them every paid customer
  // silently falls back to the student (free) tier.
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.STRIPE_PRIVATE_PRICE_ID) {
      log.error(
        'STRIPE_PRIVATE_PRICE_ID is not set — paid tier mapping will fail',
      )
      throw new HTTPError({
        statusCode: 500,
        statusMessage: 'Missing price configuration',
      })
    }
    if (!process.env.STRIPE_COMMERCIAL_PRICE_ID) {
      log.error(
        'STRIPE_COMMERCIAL_PRICE_ID is not set — paid tier mapping will fail',
      )
      throw new HTTPError({
        statusCode: 500,
        statusMessage: 'Missing price configuration',
      })
    }
  } else {
    if (!process.env.STRIPE_PRIVATE_PRICE_ID) {
      log.warn(
        'STRIPE_PRIVATE_PRICE_ID is not set — price-based tier mapping will fail for private plans',
      )
    }
    if (!process.env.STRIPE_COMMERCIAL_PRICE_ID) {
      log.warn(
        'STRIPE_COMMERCIAL_PRICE_ID is not set — price-based tier mapping will fail for commercial plans',
      )
    }
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

  // Idempotency: skip events we've already processed
  if (PROCESSED_EVENTS.has(stripeEvent.id)) {
    log.info({ eventId: stripeEvent.id }, 'Skipping duplicate event')
    return { received: true }
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

          // Defensive guard: if a subscription schedule is managing this
          // subscription (e.g. portal-initiated deferred downgrade), don't
          // sync a downgrade immediately. The schedule will apply the change
          // at the end of the billing period, firing subscription.updated
          // again with schedule=null once the schedule is released.
          if (subscription.schedule) {
            const currentProductId = await getCurrentApimProductId(
              apimFetch,
              clerkUserId,
            )
            if (currentProductId) {
              const currentPlanId = planIdFromProductId(currentProductId)
              const newPlanId = planIdFromProductId(apimProductId)
              if (isDowngrade(currentPlanId, newPlanId)) {
                log.info(
                  {
                    userId: clerkUserId,
                    currentTier: currentPlanId,
                    newTier: newPlanId,
                    schedule: subscription.schedule,
                  },
                  'Skipping immediate downgrade — subscription schedule will apply at period end',
                )
                break
              }
            }
          }

          await syncTierToApim(apimFetch, clerkUserId, apimProductId)
        } else {
          // Any non-active status loses paid access immediately.
          // If Stripe recovers a past_due payment, subscription.updated
          // fires again with status=active and we re-sync the paid tier.
          await syncTierToApim(
            apimFetch,
            clerkUserId,
            studentProductId,
            true,
          )
        }
        break
      }

      case 'customer.subscription.paused': {
        const subscription = stripeEvent.data.object
        const clerkUserId = await resolveClerkUserId(stripe, subscription)

        if (clerkUserId) {
          await syncTierToApim(
            apimFetch,
            clerkUserId,
            studentProductId,
            true,
          )
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
          await syncTierToApim(
            apimFetch,
            clerkUserId,
            studentProductId,
            true,
          )
        } else {
          log.warn('Could not resolve clerkUserId for deleted subscription')
        }
        break
      }

      case 'customer.deleted': {
        // When a customer is deleted, Stripe cancels their subscriptions but
        // customer.deleted fires BEFORE customer.subscription.deleted. By the
        // time the subscription event arrives, the customer is already gone and
        // resolveClerkUserId can't look up metadata. Handle it here instead.
        const customer = stripeEvent.data.object
        const clerkUserId = customer.metadata?.clerkUserId

        if (clerkUserId) {
          await syncTierToApim(
            apimFetch,
            clerkUserId,
            studentProductId,
            true,
          )

          // Clear stale stripeCustomerId from Clerk so getOrCreateStripeCustomer
          // will create a fresh customer on the next checkout attempt.
          try {
            const { clerkClient } =
              await import('@clerk/tanstack-react-start/server')
            const clerk = clerkClient()
            await clerk.users.updateUserMetadata(clerkUserId, {
              privateMetadata: { stripeCustomerId: null },
            })
          } catch (err) {
            // Non-fatal — getOrCreateStripeCustomer also handles stale IDs
            log.warn(
              { err, userId: clerkUserId },
              'Failed to clear stale stripeCustomerId from Clerk',
            )
          }

          log.info(
            { userId: clerkUserId, customerId: customer.id },
            'Customer deleted — downgraded to student tier and cleared Clerk metadata',
          )
        } else {
          log.warn(
            { customerId: customer.id },
            'Customer deleted but no clerkUserId in metadata — cannot downgrade',
          )
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object
        log.warn(
          { customerId: invoice.customer },
          'Payment failed for customer',
        )

        // Downgrade to student tier so user doesn't keep paid access
        const subRef = invoice.parent?.subscription_details?.subscription
        if (subRef) {
          const subId = typeof subRef === 'string' ? subRef : subRef.id
          const subscription = await stripe.subscriptions.retrieve(subId)
          const clerkUserId = await resolveClerkUserId(stripe, subscription)

          if (clerkUserId) {
            await syncTierToApim(
              apimFetch,
              clerkUserId,
              studentProductId,
              true,
            )
          } else {
            log.warn(
              'Could not resolve clerkUserId for failed invoice subscription',
            )
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = stripeEvent.data.object
        const billingReason = invoice.billing_reason

        // Only update epoch on new subscriptions and renewals
        // NOT on subscription_update (mid-cycle tier change)
        if (
          billingReason === 'subscription_create' ||
          billingReason === 'subscription_cycle'
        ) {
          const subRef = invoice.parent?.subscription_details?.subscription
          if (subRef) {
            const subId = typeof subRef === 'string' ? subRef : subRef.id
            const subscription = await stripe.subscriptions.retrieve(subId)
            const clerkUserId = await resolveClerkUserId(stripe, subscription)

            if (clerkUserId) {
              const firstItem = subscription.items.data[0]
              const periodStart = firstItem?.current_period_start

              if (!periodStart || periodStart < 1_000_000_000) {
                log.error(
                  {
                    userId: clerkUserId,
                    periodStart,
                    subscriptionId: subscription.id,
                  },
                  'Invalid period_start on subscription item — skipping epoch sync',
                )
              } else {
                await syncQuotaEpoch(apimFetch, clerkUserId, periodStart)
              }
            } else {
              log.warn(
                'Could not resolve clerkUserId for invoice.paid subscription',
              )
            }
          }
        }
        break
      }

      // --- Subscription Schedule Events ---
      // Portal-initiated deferred downgrades create subscription schedules.
      // The actual tier change happens via customer.subscription.updated when
      // the schedule phase transitions. These handlers provide visibility.

      case 'subscription_schedule.created': {
        const schedule = stripeEvent.data.object
        log.info(
          {
            scheduleId: schedule.id,
            subscriptionId: schedule.subscription,
            phases: schedule.phases.length,
          },
          'Subscription schedule created (deferred plan change)',
        )
        break
      }

      case 'subscription_schedule.updated': {
        const schedule = stripeEvent.data.object
        log.info(
          {
            scheduleId: schedule.id,
            subscriptionId: schedule.subscription,
            status: schedule.status,
          },
          'Subscription schedule updated',
        )
        break
      }

      case 'subscription_schedule.canceled': {
        const schedule = stripeEvent.data.object
        log.info(
          {
            scheduleId: schedule.id,
            subscriptionId: schedule.subscription,
          },
          'Subscription schedule canceled — user keeps current tier',
        )
        break
      }

      case 'subscription_schedule.completed': {
        const schedule = stripeEvent.data.object
        log.info(
          {
            scheduleId: schedule.id,
            subscriptionId: schedule.subscription,
          },
          'Subscription schedule completed — tier change applied',
        )
        break
      }

      case 'subscription_schedule.released': {
        const schedule = stripeEvent.data.object
        log.info(
          {
            scheduleId: schedule.id,
            subscriptionId: schedule.subscription,
          },
          'Subscription schedule released from subscription',
        )
        break
      }
    }
  } catch (err) {
    // APIM sync failed — return 500 so Stripe retries the webhook.
    // Do NOT mark as processed so retries can succeed.
    log.error({ err }, 'APIM sync error')
    throw new HTTPError({ statusCode: 500, statusMessage: 'APIM sync failed' })
  }

  // Mark as processed only on success to allow retries on failure
  markEventProcessed(stripeEvent.id)
  return { received: true }
})

// --- Resolve Clerk User ID ---
// Checks subscription metadata first, then falls back to Stripe customer metadata.

async function resolveClerkUserId(
  stripe: ReturnType<typeof GetStripeFn>,
  subscription: {
    metadata: Record<string, string>
    customer: string | { id: string }
  },
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

// --- Current APIM Tier Lookup ---

async function getCurrentApimProductId(
  apimFetch: ApimFetchFn,
  clerkUserId: string,
): Promise<string | undefined> {
  try {
    const result = await apimFetch<SubscriptionListResponse>(
      `/users/${clerkUserId}/subscriptions`,
    )
    const activeSub = result.value.find((s) => s.properties.state === 'active')
    if (!activeSub) return undefined
    return activeSub.properties.scope.split('/').pop() ?? undefined
  } catch {
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
  resetEpoch?: boolean,
): Promise<void> {
  const result = await apimFetch<SubscriptionListResponse>(
    `/users/${clerkUserId}/subscriptions`,
  )

  const activeSubs = result.value.filter((s) => s.properties.state === 'active')

  if (activeSubs.length === 0) {
    log.warn(
      { userId: clerkUserId },
      'No active APIM subscription found for user',
    )
    return
  }

  // Build the PATCH payload — always update scope, optionally reset epoch
  const properties: Record<string, string> = {
    scope: `/products/${apimProductId}`,
  }
  if (resetEpoch) {
    properties.displayName = `${clerkUserId}|0`
  }

  // Sync ALL active subscriptions to prevent orphaned subs with stale tiers
  const results = await Promise.allSettled(
    activeSubs.map((sub) =>
      apimFetch(`/subscriptions/${sub.name}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      }),
    ),
  )

  const failures = results.filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected',
  )
  if (failures.length > 0) {
    log.error(
      {
        userId: clerkUserId,
        productId: apimProductId,
        failedCount: failures.length,
        totalCount: activeSubs.length,
        errors: failures.map((f) => String(f.reason)),
      },
      'Some APIM subscription PATCHes failed',
    )
    throw new Error(
      `Failed to sync ${failures.length}/${activeSubs.length} APIM subscriptions`,
    )
  }

  log.info(
    {
      userId: clerkUserId,
      productId: apimProductId,
      subCount: activeSubs.length,
      resetEpoch: !!resetEpoch,
    },
    'Synced user to APIM product',
  )
}

// --- Quota Epoch Sync Helper ---

async function syncQuotaEpoch(
  apimFetch: ApimFetchFn,
  clerkUserId: string,
  periodStartUnix: number,
): Promise<void> {
  const result = await apimFetch<SubscriptionListResponse>(
    `/users/${clerkUserId}/subscriptions`,
  )
  const activeSubs = result.value.filter((s) => s.properties.state === 'active')

  if (activeSubs.length === 0) return

  const newDisplayName = `${clerkUserId}|${periodStartUnix}`

  await Promise.allSettled(
    activeSubs.map((sub) =>
      apimFetch(`/subscriptions/${sub.name}`, {
        method: 'PATCH',
        body: JSON.stringify({
          properties: { displayName: newDisplayName },
        }),
      }),
    ),
  )

  log.info(
    {
      userId: clerkUserId,
      epoch: periodStartUnix,
      subCount: activeSubs.length,
    },
    'Synced quota epoch to APIM subscriptions',
  )
}
