import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Import handler after all mocks ---

import handler from '../../../../server/api/stripe/webhook'

// --- Mock fns (declared before vi.mock so closures capture the reference) ---

const mockConstructEvent = vi.fn()
const mockCustomersRetrieve = vi.fn()
const mockSubscriptionsRetrieve = vi.fn()
const mockClearStripeCustomerId = vi.fn()
const mockGetUserPrimaryEmail = vi.fn()
const mockUpdateContactTierSegment = vi.fn()

// --- Module mocks ---

vi.mock('h3', () => {
  class HTTPError extends Error {
    statusCode: number
    constructor({
      statusCode,
      statusMessage,
    }: {
      statusCode: number
      statusMessage: string
    }) {
      super(statusMessage)
      this.statusCode = statusCode
    }
  }
  return { HTTPError, defineHandler: (fn: any) => fn }
})

vi.mock('@/lib/server/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/lib/server/stripe/client', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (...a: Array<any>) => mockConstructEvent(...a),
    },
    customers: {
      retrieve: (...a: Array<any>) => mockCustomersRetrieve(...a),
    },
    subscriptions: {
      retrieve: (...a: Array<any>) => mockSubscriptionsRetrieve(...a),
    },
  }),
}))

vi.mock('@/lib/server/stripe/tier-resolver', () => ({
  resolvePlanId: (priceId?: string, metadataPlanId?: string) =>
    ({ price_private: 'private', price_commercial: 'commercial' })[
      priceId ?? ''
    ] ??
    metadataPlanId ??
    'student',
}))

vi.mock('@/lib/server/clerk-admin', () => ({
  clearStripeCustomerId: (...a: Array<any>) => mockClearStripeCustomerId(...a),
  getUserPrimaryEmail: (...a: Array<any>) => mockGetUserPrimaryEmail(...a),
}))

vi.mock('@/lib/server/email/contacts', () => ({
  updateContactTierSegment: (...a: Array<any>) =>
    mockUpdateContactTierSegment(...a),
}))

// --- Helpers ---

let eventCounter = 0

function mockEvent(body = '{}', signature: string | null = 'sig_test') {
  const headers = new Headers()
  if (signature) headers.set('stripe-signature', signature)
  return { req: { text: () => Promise.resolve(body), headers } } as any
}

function stripeEvent(type: string, obj: Record<string, unknown> = {}) {
  return { id: `evt_${++eventCounter}`, type, data: { object: obj } }
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_1',
    status: 'active',
    schedule: null,
    customer: 'cus_1',
    metadata: { clerkUserId: 'user_1' },
    items: { data: [{ price: { id: 'price_private' } }] },
    ...overrides,
  }
}

async function send(event: ReturnType<typeof stripeEvent>) {
  mockConstructEvent.mockReturnValueOnce(event)
  return handler(mockEvent())
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
  mockGetUserPrimaryEmail.mockResolvedValue('pilot@example.com')
  mockUpdateContactTierSegment.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// --- Tests ---

describe('Stripe webhook handler', () => {
  // -- Request validation --

  it('throws 500 when webhook secret is missing', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')
    await expect(handler(mockEvent())).rejects.toMatchObject({
      statusCode: 500,
    })
  })

  it('throws 400 when signature header is missing', async () => {
    await expect(handler(mockEvent('{}', null))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when body is empty', async () => {
    await expect(handler(mockEvent('', 'sig'))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 401 when the signature is invalid', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('bad signature')
    })
    await expect(handler(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  // -- Resend segment sync (tier changes themselves are applied by the gateway) --

  it('moves the user to the purchased plan segment on checkout', async () => {
    await send(
      stripeEvent('checkout.session.completed', {
        metadata: { clerkUserId: 'user_1', planId: 'commercial' },
      }),
    )

    expect(mockUpdateContactTierSegment).toHaveBeenCalledWith(
      'pilot@example.com',
      'commercial',
    )
  })

  it('uses the subscription price for active subscription updates', async () => {
    await send(
      stripeEvent(
        'customer.subscription.updated',
        subscription({
          metadata: { clerkUserId: 'user_1', planId: 'commercial' },
        }),
      ),
    )

    expect(mockUpdateContactTierSegment).toHaveBeenCalledWith(
      'pilot@example.com',
      'private',
    )
  })

  it('moves past_due subscriptions to the student segment', async () => {
    await send(
      stripeEvent(
        'customer.subscription.updated',
        subscription({ status: 'past_due' }),
      ),
    )

    expect(mockUpdateContactTierSegment).toHaveBeenCalledWith(
      'pilot@example.com',
      'student',
    )
  })

  it('leaves the segment alone while a subscription schedule is pending', async () => {
    await send(
      stripeEvent(
        'customer.subscription.updated',
        subscription({ schedule: 'sub_sched_1' }),
      ),
    )

    expect(mockUpdateContactTierSegment).not.toHaveBeenCalled()
  })

  it('moves deleted subscriptions to the student segment', async () => {
    await send(stripeEvent('customer.subscription.deleted', subscription()))

    expect(mockUpdateContactTierSegment).toHaveBeenCalledWith(
      'pilot@example.com',
      'student',
    )
  })

  it('resolves the user from Stripe customer metadata when the subscription has none', async () => {
    mockCustomersRetrieve.mockResolvedValueOnce({
      deleted: false,
      metadata: { clerkUserId: 'user_2' },
    })

    await send(
      stripeEvent(
        'customer.subscription.deleted',
        subscription({ metadata: {} }),
      ),
    )

    expect(mockCustomersRetrieve).toHaveBeenCalledWith('cus_1')
    expect(mockGetUserPrimaryEmail).toHaveBeenCalledWith('user_2')
  })

  it('clears the Clerk customer ID when a customer is deleted', async () => {
    await send(
      stripeEvent('customer.deleted', {
        id: 'cus_1',
        metadata: { clerkUserId: 'user_1' },
      }),
    )

    expect(mockClearStripeCustomerId).toHaveBeenCalledWith('user_1')
    expect(mockUpdateContactTierSegment).toHaveBeenCalledWith(
      'pilot@example.com',
      'student',
    )
  })

  it('moves the user to the student segment when a payment fails', async () => {
    mockSubscriptionsRetrieve.mockResolvedValueOnce(subscription())

    await send(
      stripeEvent('invoice.payment_failed', {
        customer: 'cus_1',
        parent: { subscription_details: { subscription: 'sub_1' } },
      }),
    )

    expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith('sub_1')
    expect(mockUpdateContactTierSegment).toHaveBeenCalledWith(
      'pilot@example.com',
      'student',
    )
  })

  // -- Failure handling --

  it('treats segment sync failures as non-fatal', async () => {
    mockUpdateContactTierSegment.mockRejectedValueOnce(new Error('resend down'))

    await expect(
      send(stripeEvent('customer.subscription.deleted', subscription())),
    ).resolves.toEqual({ received: true })
  })

  it('returns 500 when a Stripe lookup fails so Stripe retries', async () => {
    mockCustomersRetrieve.mockRejectedValueOnce(new Error('stripe down'))

    await expect(
      send(
        stripeEvent(
          'customer.subscription.deleted',
          subscription({ metadata: {} }),
        ),
      ),
    ).rejects.toMatchObject({ statusCode: 500 })
  })

  it('skips events it has already processed', async () => {
    const event = stripeEvent('customer.subscription.deleted', subscription())

    await send(event)
    await send(event)

    expect(mockUpdateContactTierSegment).toHaveBeenCalledTimes(1)
  })
})
