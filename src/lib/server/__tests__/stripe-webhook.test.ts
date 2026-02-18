import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Import handler after all mocks ---

import handler from '../../../../server/api/stripe/webhook'

// --- Mock fns (declared before vi.mock so closures capture the reference) ---

const mockApimFetch = vi.fn()
const mockConstructEvent = vi.fn()
const mockCustomersRetrieve = vi.fn()
const mockSubscriptionsRetrieve = vi.fn()
const mockUpdateUserMetadata = vi.fn()
const mockIsDowngrade = vi.fn()
const mockResolveApimProductId = vi.fn()
const mockPlanIdFromProductId = vi.fn()

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

vi.mock('@/lib/server/stripe-client', () => ({
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

vi.mock('@/lib/server/apim-client', () => ({
  apimFetch: (...a: Array<any>) => mockApimFetch(...a),
}))

vi.mock('@/lib/server/apim-products', () => ({
  getApimProductIds: () => ({
    student: 'student-pilot',
    private: 'private-pilot',
    commercial: 'commercial-pilot',
    atp: 'atp',
  }),
  isDowngrade: (...a: Array<any>) => mockIsDowngrade(...a),
  planIdFromProductId: (...a: Array<any>) => mockPlanIdFromProductId(...a),
}))

vi.mock('@/lib/server/stripe-tier-resolver', () => ({
  resolveApimProductId: (...a: Array<any>) => mockResolveApimProductId(...a),
}))

vi.mock('@clerk/tanstack-react-start/server', () => ({
  clerkClient: () => ({
    users: {
      updateUserMetadata: (...a: Array<any>) => mockUpdateUserMetadata(...a),
    },
  }),
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

function activeSub(name: string, scope: string) {
  return { name, properties: { state: 'active', scope } }
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
  vi.stubEnv('STRIPE_PRIVATE_PRICE_ID', 'price_private')
  vi.stubEnv('STRIPE_COMMERCIAL_PRICE_ID', 'price_commercial')
  vi.stubEnv('STRIPE_ATP_PRICE_ID', 'price_atp')

  mockPlanIdFromProductId.mockImplementation((id: string) => {
    const m: Record<string, string> = {
      'student-pilot': 'student',
      'private-pilot': 'private',
      'commercial-pilot': 'commercial',
      atp: 'atp',
    }
    return m[id] ?? 'student'
  })
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

  it('throws 401 on invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('sig mismatch')
    })
    await expect(handler(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  // -- Idempotency --

  it('skips duplicate events', async () => {
    const evt = stripeEvent('checkout.session.completed', {
      metadata: { clerkUserId: 'user_dup', planId: 'private' },
    })
    mockConstructEvent.mockReturnValue(evt)
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/student-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())
    const result = await handler(mockEvent()) // same event ID

    expect(result).toEqual({ received: true })
    expect(mockApimFetch).toHaveBeenCalledTimes(2) // only from first call
  })

  // -- checkout.session.completed --

  it('syncs tier on checkout with valid metadata', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('checkout.session.completed', {
        metadata: { clerkUserId: 'user_co', planId: 'private' },
      }),
    )
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/student-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    expect(mockApimFetch).toHaveBeenNthCalledWith(
      1,
      '/users/user_co/subscriptions',
    )
    expect(mockApimFetch).toHaveBeenNthCalledWith(
      2,
      '/subscriptions/s1',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('private-pilot'),
      }),
    )

    // Checkout does NOT reset epoch
    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.displayName).toBeUndefined()
  })

  it('returns 200 when checkout metadata is missing', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('checkout.session.completed', { metadata: {} }),
    )
    const result = await handler(mockEvent())
    expect(result).toEqual({ received: true })
    expect(mockApimFetch).not.toHaveBeenCalled()
  })

  // -- customer.subscription.updated --

  it('syncs active subscription to resolved tier', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.subscription.updated', {
        status: 'active',
        schedule: null,
        items: { data: [{ price: { id: 'price_commercial' } }] },
        metadata: { clerkUserId: 'user_upd' },
        customer: 'cus_upd',
      }),
    )
    mockResolveApimProductId.mockReturnValue('commercial-pilot')
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/student-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    expect(mockApimFetch).toHaveBeenNthCalledWith(
      2,
      '/subscriptions/s1',
      expect.objectContaining({
        body: expect.stringContaining('commercial-pilot'),
      }),
    )
  })

  it('skips immediate downgrade when subscription has a schedule', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.subscription.updated', {
        status: 'active',
        schedule: 'sub_sched_1',
        items: { data: [{ price: { id: 'price_private' } }] },
        metadata: { clerkUserId: 'user_sched' },
        customer: 'cus_sched',
      }),
    )
    mockResolveApimProductId.mockReturnValue('private-pilot')
    // getCurrentApimProductId sees user on commercial tier
    mockApimFetch.mockResolvedValueOnce({
      value: [activeSub('s1', '/products/commercial-pilot')],
    })
    mockIsDowngrade.mockReturnValue(true)

    await handler(mockEvent())

    // Only 1 call (getCurrentApimProductId list). No PATCH.
    expect(mockApimFetch).toHaveBeenCalledTimes(1)
  })

  it('allows upgrade even with a schedule', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.subscription.updated', {
        status: 'active',
        schedule: 'sub_sched_2',
        items: { data: [{ price: { id: 'price_commercial' } }] },
        metadata: { clerkUserId: 'user_upgr' },
        customer: 'cus_upgr',
      }),
    )
    mockResolveApimProductId.mockReturnValue('commercial-pilot')
    mockApimFetch
      // getCurrentApimProductId → user on private
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/private-pilot')],
      })
      // syncTierToApim → list
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/private-pilot')],
      })
      // syncTierToApim → PATCH
      .mockResolvedValueOnce(undefined)
    mockIsDowngrade.mockReturnValue(false)

    await handler(mockEvent())

    expect(mockApimFetch).toHaveBeenCalledTimes(3)
    expect(mockApimFetch).toHaveBeenNthCalledWith(
      3,
      '/subscriptions/s1',
      expect.objectContaining({
        body: expect.stringContaining('commercial-pilot'),
      }),
    )
  })

  it('downgrades to student with epoch reset on non-active status', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.subscription.updated', {
        status: 'canceled',
        items: { data: [{ price: { id: 'price_private' } }] },
        metadata: { clerkUserId: 'user_cancel' },
        customer: 'cus_cancel',
      }),
    )
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/private-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.scope).toBe('/products/student-pilot')
    expect(body.properties.displayName).toBe('user_cancel|0')
  })

  // -- customer.subscription.paused --

  it('downgrades to student on subscription paused', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.subscription.paused', {
        metadata: { clerkUserId: 'user_pause' },
        customer: 'cus_pause',
      }),
    )
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/private-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.scope).toBe('/products/student-pilot')
  })

  // -- customer.subscription.resumed --

  it('restores paid tier on subscription resumed', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.subscription.resumed', {
        items: { data: [{ price: { id: 'price_commercial' } }] },
        metadata: { clerkUserId: 'user_resume' },
        customer: 'cus_resume',
      }),
    )
    mockResolveApimProductId.mockReturnValue('commercial-pilot')
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/student-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.scope).toBe('/products/commercial-pilot')
  })

  // -- customer.subscription.deleted --

  it('downgrades to student on subscription deleted', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.subscription.deleted', {
        metadata: { clerkUserId: 'user_del' },
        customer: 'cus_del',
      }),
    )
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/commercial-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.scope).toBe('/products/student-pilot')
  })

  // -- customer.deleted --

  it('downgrades and clears Clerk metadata on customer deleted', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.deleted', {
        id: 'cus_gone',
        metadata: { clerkUserId: 'user_gone' },
      }),
    )
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/commercial-pilot')],
      })
      .mockResolvedValueOnce(undefined)
    mockUpdateUserMetadata.mockResolvedValue({})

    await handler(mockEvent())

    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.scope).toBe('/products/student-pilot')
    expect(mockUpdateUserMetadata).toHaveBeenCalledWith('user_gone', {
      privateMetadata: { stripeCustomerId: null },
    })
  })

  // -- invoice.payment_failed --

  it('downgrades on payment failure', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('invoice.payment_failed', {
        customer: 'cus_fail',
        parent: { subscription_details: { subscription: 'sub_fail' } },
      }),
    )
    mockSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_fail',
      metadata: { clerkUserId: 'user_fail' },
      customer: 'cus_fail',
    })
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/private-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith('sub_fail')
    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.scope).toBe('/products/student-pilot')
  })

  // -- invoice.paid --

  it('syncs quota epoch on subscription_create', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('invoice.paid', {
        billing_reason: 'subscription_create',
        parent: { subscription_details: { subscription: 'sub_new' } },
      }),
    )
    mockSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_new',
      metadata: { clerkUserId: 'user_new' },
      customer: 'cus_new',
      items: { data: [{ current_period_start: 1700000000 }] },
    })
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/private-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.displayName).toBe('user_new|1700000000')
  })

  it('syncs quota epoch on subscription_cycle (renewal)', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('invoice.paid', {
        billing_reason: 'subscription_cycle',
        parent: { subscription_details: { subscription: 'sub_renew' } },
      }),
    )
    mockSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_renew',
      metadata: { clerkUserId: 'user_renew' },
      customer: 'cus_renew',
      items: { data: [{ current_period_start: 1703000000 }] },
    })
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/private-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    const body = JSON.parse(mockApimFetch.mock.calls[1][1].body)
    expect(body.properties.displayName).toBe('user_renew|1703000000')
  })

  it('skips epoch sync on subscription_update (mid-cycle)', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('invoice.paid', {
        billing_reason: 'subscription_update',
        parent: { subscription_details: { subscription: 'sub_mid' } },
      }),
    )

    await handler(mockEvent())

    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled()
    expect(mockApimFetch).not.toHaveBeenCalled()
  })

  // -- Error handling --

  it('throws 500 on APIM sync failure (allows Stripe retry)', async () => {
    const evt = stripeEvent('checkout.session.completed', {
      metadata: { clerkUserId: 'user_err', planId: 'private' },
    })
    mockConstructEvent.mockReturnValue(evt)
    mockApimFetch.mockRejectedValueOnce(new Error('APIM down'))

    await expect(handler(mockEvent())).rejects.toMatchObject({
      statusCode: 500,
      message: 'APIM sync failed',
    })

    // Event NOT marked processed — retry with same ID succeeds
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/student-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    const result = await handler(mockEvent())
    expect(result).toEqual({ received: true })
  })

  // -- resolveClerkUserId fallback --

  it('falls back to Stripe customer metadata when subscription metadata is empty', async () => {
    mockConstructEvent.mockReturnValue(
      stripeEvent('customer.subscription.updated', {
        status: 'active',
        schedule: null,
        items: { data: [{ price: { id: 'price_private' } }] },
        metadata: {}, // no clerkUserId
        customer: 'cus_lookup',
      }),
    )
    mockCustomersRetrieve.mockResolvedValue({
      deleted: false,
      metadata: { clerkUserId: 'user_from_cus' },
    })
    mockResolveApimProductId.mockReturnValue('private-pilot')
    mockApimFetch
      .mockResolvedValueOnce({
        value: [activeSub('s1', '/products/student-pilot')],
      })
      .mockResolvedValueOnce(undefined)

    await handler(mockEvent())

    expect(mockCustomersRetrieve).toHaveBeenCalledWith('cus_lookup')
    expect(mockApimFetch).toHaveBeenNthCalledWith(
      1,
      '/users/user_from_cus/subscriptions',
    )
  })
})
