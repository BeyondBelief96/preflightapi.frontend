import { createServerFn } from '@tanstack/react-start'
import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { getStripe } from './stripe-client'
import { apimFetch } from './apim-client'
import type { StripeSubscriptionStatus } from '@/types/plans'
import { PLANS } from '@/lib/constants'
import { env } from '@/env'

const PRICE_ID_MAP: Record<string, () => string | undefined> = {
  starter: () => env.STRIPE_STARTER_PRICE_ID,
  professional: () => env.STRIPE_PROFESSIONAL_PRICE_ID,
}

function getPriceIdForPlan(planId: string): string | undefined {
  return PRICE_ID_MAP[planId]?.()
}

function planIdFromPriceId(priceId: string): string | undefined {
  for (const [planId, getPriceId] of Object.entries(PRICE_ID_MAP)) {
    if (getPriceId() === priceId) return planId
  }
  return undefined
}

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.userId) {
    throw new Error('Unauthorized')
  }
  return session.userId
}

async function getOrCreateStripeCustomer(clerkUserId: string): Promise<string> {
  const clerk = clerkClient()
  const user = await clerk.users.getUser(clerkUserId)
  const existingId = (user.privateMetadata as { stripeCustomerId?: string })
    .stripeCustomerId

  if (existingId) {
    return existingId
  }

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    metadata: { clerkUserId },
    email:
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? undefined,
  })

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

    const plan = PLANS.find((p) => p.id === data.planId)
    const priceId = getPriceIdForPlan(data.planId)
    if (!plan || !priceId) {
      throw new Error(
        `Invalid plan or missing Stripe price ID for: ${data.planId}`,
      )
    }

    const customerId = await getOrCreateStripeCustomer(userId)
    const stripe = getStripe()

    // Check for existing active subscription — prevent duplicate subscriptions
    const existing = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (existing.data.length > 0) {
      throw new Error(
        'You already have an active subscription. Please manage it from the billing page.',
      )
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getBaseUrl()}/dashboard/billing?checkout=success&plan=${plan.id}`,
      cancel_url: `${getBaseUrl()}/dashboard/billing?checkout=canceled`,
      metadata: { clerkUserId: userId, planId: plan.id },
      subscription_data: {
        metadata: { clerkUserId: userId, planId: plan.id },
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
      return_url: `${getBaseUrl()}/dashboard/billing`,
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
    status: 'active',
    limit: 1,
  })

  const sub = subscriptions.data[0]
  if (!sub) {
    return null
  }

  const firstItem = sub.items.data[0]
  // Price ID is the source of truth — portal upgrades change the price
  // but don't update our custom metadata
  const planId =
    planIdFromPriceId(firstItem?.price.id ?? '') ||
    sub.metadata.planId ||
    'free'

  return {
    status: sub.status,
    planId: planId as StripeSubscriptionStatus['planId'],
    currentPeriodEnd: new Date(
      (firstItem?.current_period_end ?? 0) * 1000,
    ).toISOString(),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  }
}

export const getStripeSubscription = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StripeSubscriptionStatus | null> => {
    const userId = await requireAuth()
    return getStripeSubscriptionInternal(userId)
  },
)

// --- Reconciliation ---

type SubscriptionListResponse = {
  value: Array<{
    name: string
    properties: { scope: string; state: string }
  }>
}

export type ReconcileResult =
  | { status: 'synced'; stripePlanId: string; apimPlanId: string }
  | { status: 'already_in_sync'; stripePlanId: string; apimPlanId: string }
  | { status: 'no_stripe_sub' }

export const reconcileSubscription = createServerFn({
  method: 'POST',
}).handler(async (): Promise<ReconcileResult> => {
  const userId = await requireAuth()

  // 1. Get Stripe subscription state
  const stripeSub = await getStripeSubscriptionInternal(userId)
  if (!stripeSub) {
    return { status: 'no_stripe_sub' }
  }

  // 2. Get APIM subscription state
  const apimSubs = await apimFetch<SubscriptionListResponse>(
    `/users/${userId}/subscriptions`,
  )
  const activeSub = apimSubs.value.find((s) => s.properties.state === 'active')
  if (!activeSub) {
    return { status: 'no_stripe_sub' }
  }

  const apimProductId = activeSub.properties.scope.split('/').pop() ?? ''
  const expectedPlan = PLANS.find((p) => p.id === stripeSub.planId)

  if (!expectedPlan || apimProductId === expectedPlan.apimProductId) {
    return {
      status: 'already_in_sync',
      stripePlanId: stripeSub.planId,
      apimPlanId: stripeSub.planId,
    }
  }

  // 3. Mismatch detected — sync APIM to match Stripe
  const previousPlanId =
    PLANS.find((p) => apimProductId.includes(p.apimProductId))?.id ?? 'free'

  await apimFetch(`/subscriptions/${activeSub.name}`, {
    method: 'PATCH',
    body: JSON.stringify({
      properties: { scope: `/products/${expectedPlan.apimProductId}` },
    }),
  })

  return {
    status: 'synced',
    stripePlanId: stripeSub.planId,
    apimPlanId: previousPlanId,
  }
})

// --- Helpers ---

function getBaseUrl(): string {
  if (env.SERVER_URL) {
    return env.SERVER_URL
  }
  return 'http://localhost:3000'
}
