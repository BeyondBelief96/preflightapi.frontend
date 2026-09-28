import { createServerFn } from '@tanstack/react-start'
import { clerkClient } from '@clerk/tanstack-react-start/server'
import { requireAuth } from '../auth'
import { adminFetch } from '../gateway/client'
import { getPriceIdForPlan, planIdFromPriceId } from './utils'
import { getStripe } from './client'
import type { PlanId, StripeSubscriptionStatus } from '@/types/plans'
import type { AdminAccountDetail } from '@/types/gateway'
import { env } from '@/env'

async function getOrCreateStripeCustomer(clerkUserId: string): Promise<string> {
  const clerk = clerkClient()
  const stripe = getStripe()
  const user = await clerk.users.getUser(clerkUserId)
  const existingId = (user.privateMetadata as { stripeCustomerId?: string })
    .stripeCustomerId

  if (existingId) {
    // Verify the customer still exists — it may have been deleted from
    // the Stripe dashboard, leaving a stale reference in Clerk metadata.
    const existing = await stripe.customers.retrieve(existingId)
    if (!existing.deleted) {
      return existingId
    }
    // Customer was deleted — clear the stale reference and create a new one
    await clerk.users.updateUserMetadata(clerkUserId, {
      privateMetadata: { stripeCustomerId: null },
    })
  }

  const customer = await stripe.customers.create({
    metadata: { clerkUserId },
    email:
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? undefined,
  })

  // Race condition check: another concurrent request may have already set the ID
  const freshUser = await clerk.users.getUser(clerkUserId)
  const concurrentId = (
    freshUser.privateMetadata as { stripeCustomerId?: string }
  ).stripeCustomerId

  if (concurrentId) {
    // Another request won the race — delete our duplicate and use theirs
    await stripe.customers.del(customer.id)
    return concurrentId
  }

  await clerk.users.updateUserMetadata(clerkUserId, {
    privateMetadata: { stripeCustomerId: customer.id },
  })

  return customer.id
}

// --- Checkout Session ---

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .inputValidator((input: { planId: string }) => input)
  .handler(async ({ data }) => {
    const userId = await requireAuth()

    const priceId = getPriceIdForPlan(data.planId)
    if (!priceId) {
      throw new Error(
        `Invalid plan or missing Stripe price ID for: ${data.planId}`,
      )
    }

    const customerId = await getOrCreateStripeCustomer(userId)
    const stripe = getStripe()

    // Check for existing subscription — prevent duplicates.
    // Include past_due so users with a failing payment can't start a second sub.
    const existing = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 5,
    })
    const blocking = existing.data.find(
      (s) => s.status === 'active' || s.status === 'past_due',
    )

    if (blocking) {
      throw new Error(
        'You already have an active subscription. Please manage it from the billing page.',
      )
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getBaseUrl()}/dashboard/billing?checkout=success&plan=${data.planId}`,
      cancel_url: `${getBaseUrl()}/dashboard/billing?checkout=canceled`,
      metadata: { clerkUserId: userId, planId: data.planId },
      subscription_data: {
        metadata: { clerkUserId: userId, planId: data.planId },
      },
    })

    return { url: session.url }
  })

// --- Customer Portal Session ---

export const createPortalSession = createServerFn({ method: 'POST' }).handler(
  async () => {
    const userId = await requireAuth()
    const customerId = await getOrCreateStripeCustomer(userId)
    const stripe = getStripe()

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getBaseUrl()}/dashboard/billing?portal=return`,
    })

    return { url: session.url }
  },
)

// --- Get Subscription Status ---

async function getStripeSubscriptionInternal(
  userId: string,
): Promise<StripeSubscriptionStatus | null> {
  const clerk = clerkClient()
  const user = await clerk.users.getUser(userId)
  const customerId = (user.privateMetadata as { stripeCustomerId?: string })
    .stripeCustomerId

  if (!customerId) {
    return null
  }

  const stripe = getStripe()
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 5,
  })

  // Prefer active, fall back to past_due — so the billing page can show
  // the subscription even when payment has failed and Stripe is retrying.
  const sub =
    subscriptions.data.find((s) => s.status === 'active') ??
    subscriptions.data.find((s) => s.status === 'past_due')
  if (!sub) {
    return null
  }

  const firstItem = sub.items.data[0]
  // Price ID is the source of truth — portal upgrades change the price
  // but don't update our custom metadata
  const planId =
    planIdFromPriceId(firstItem?.price.id ?? '') ||
    sub.metadata.planId ||
    'student'

  return {
    status: sub.status,
    planId: planId as StripeSubscriptionStatus['planId'],
    currentPeriodStart: new Date(
      (firstItem?.current_period_start ?? 0) * 1000,
    ).toISOString(),
    currentPeriodEnd: new Date(
      (firstItem?.current_period_end ?? 0) * 1000,
    ).toISOString(),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    cancelAt: sub.cancel_at
      ? new Date(sub.cancel_at * 1000).toISOString()
      : null,
  }
}

export const getStripeSubscription = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StripeSubscriptionStatus | null> => {
    const userId = await requireAuth()
    return getStripeSubscriptionInternal(userId)
  },
)

// --- Reconciliation ---

export type ReconcileResult =
  | { status: 'synced'; stripePlanId: string; gatewayPlanId: string }
  | { status: 'already_in_sync'; stripePlanId: string; gatewayPlanId: string }
  | { status: 'no_stripe_sub' }

/**
 * Safety net for missed or delayed Stripe webhooks: makes the gateway's tier
 * for the signed-in user match their Stripe subscription.
 */
export const reconcileSubscription = createServerFn({
  method: 'POST',
}).handler(async (): Promise<ReconcileResult> => {
  const userId = await requireAuth()

  const stripeSub = await getStripeSubscriptionInternal(userId)
  if (!stripeSub) {
    return { status: 'no_stripe_sub' }
  }

  // Matches the gateway's Stripe webhook: only active subscriptions get paid
  // access (past_due is downgraded until payment recovers).
  const expectedTier: PlanId =
    stripeSub.status === 'active' || stripeSub.status === 'trialing'
      ? stripeSub.planId
      : 'student'

  // Server-to-server call (internal secret); ownership is established by
  // requireAuth above, since we only ever touch the caller's own account.
  const account = await adminFetch<AdminAccountDetail>(
    `/users/${encodeURIComponent(userId)}`,
  ).catch(() => null)
  const currentTier = account?.tier ?? 'student'

  if (currentTier === expectedTier) {
    return {
      status: 'already_in_sync',
      stripePlanId: stripeSub.planId,
      gatewayPlanId: currentTier,
    }
  }

  await adminFetch(`/users/${encodeURIComponent(userId)}/tier`, {
    method: 'PUT',
    body: JSON.stringify({ tier: expectedTier }),
  })

  return {
    status: 'synced',
    stripePlanId: stripeSub.planId,
    gatewayPlanId: currentTier,
  }
})

// --- Helpers ---

function getBaseUrl(): string {
  if (env.SERVER_URL) {
    return env.SERVER_URL
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SERVER_URL must be set in production. Stripe checkout redirects will fail without it.',
    )
  }
  return 'http://localhost:3000'
}
