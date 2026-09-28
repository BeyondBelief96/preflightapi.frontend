import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Import handler after mocks ---

import handler from '../../../../server/api/clerk/webhook'

// --- Mock fns ---

const mockVerify = vi.fn()
const mockEmailSend = vi.fn()
const mockRender = vi.fn()
const mockAdminFetch = vi.fn()
const mockCustomerSearch = vi.fn()
const mockCustomerDel = vi.fn()

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

vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: (...a: Array<any>) => mockVerify(...a),
  })),
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: (...a: Array<any>) => mockEmailSend(...a) },
  })),
}))

vi.mock('@react-email/render', () => ({
  render: (...a: Array<any>) => mockRender(...a),
}))

vi.mock('@/emails/welcome', () => ({
  WelcomeEmail: (props: any) => props,
}))

vi.mock('@/lib/server/stripe/client', () => ({
  getStripe: () => ({
    customers: {
      search: (...a: Array<any>) => mockCustomerSearch(...a),
      del: (...a: Array<any>) => mockCustomerDel(...a),
    },
  }),
}))

vi.mock('@/lib/server/gateway/client', () => {
  class GatewayError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message)
    }
  }
  return {
    GatewayError,
    adminFetch: (...a: Array<any>) => mockAdminFetch(...a),
  }
})

// --- Helpers ---

function mockEvent(
  body = '{}',
  headers: Record<string, string> = {
    'svix-id': 'msg_test',
    'svix-timestamp': '1234567890',
    'svix-signature': 'v1_sig',
  },
) {
  const h = new Headers()
  for (const [k, v] of Object.entries(headers)) h.set(k, v)
  return { req: { text: () => Promise.resolve(body), headers: h } } as any
}

function clerkEvent(
  type: string,
  data: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    data: { id: 'user_test', email_addresses: [], ...data },
    type,
  }
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CLERK_WEBHOOK_SECRET', 'whsec_clerk_test')
  vi.stubEnv('RESEND_API_KEY', 'rsk_test')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// --- Tests ---

describe('Clerk webhook handler', () => {
  // -- Request validation --

  it('throws 500 when webhook secret is missing', async () => {
    vi.stubEnv('CLERK_WEBHOOK_SECRET', '')
    await expect(handler(mockEvent())).rejects.toMatchObject({
      statusCode: 500,
    })
  })

  it('throws 400 when svix headers are missing', async () => {
    await expect(handler(mockEvent('{}', {}))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 401 on invalid signature', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('bad sig')
    })
    await expect(handler(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  // -- user.created: welcome email --

  it('sends welcome email on user.created', async () => {
    const evt = clerkEvent('user.created', {
      id: 'user_new',
      email_addresses: [{ email_address: 'test@example.com', id: 'ea_1' }],
      first_name: 'Amelia',
    })
    mockVerify.mockReturnValue(evt)
    mockRender.mockResolvedValue('<html>Welcome</html>')
    mockEmailSend.mockResolvedValue({ error: null })

    const result = await handler(mockEvent())

    expect(result).toEqual({ received: true })
    expect(mockRender).toHaveBeenCalledWith({ name: 'Amelia' })
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Welcome to PreflightAPI',
        html: '<html>Welcome</html>',
      }),
    )
  })

  it('uses "there" as fallback when first_name is null', async () => {
    const evt = clerkEvent('user.created', {
      id: 'user_noname',
      email_addresses: [{ email_address: 'no-name@example.com', id: 'ea_2' }],
      first_name: null,
    })
    mockVerify.mockReturnValue(evt)
    mockRender.mockResolvedValue('<html/>')
    mockEmailSend.mockResolvedValue({ error: null })

    await handler(mockEvent())

    expect(mockRender).toHaveBeenCalledWith({ name: 'there' })
  })

  it('skips email when user has no email address', async () => {
    const evt = clerkEvent('user.created', {
      id: 'user_noemail',
      email_addresses: [],
    })
    mockVerify.mockReturnValue(evt)

    const result = await handler(mockEvent())

    expect(result).toEqual({ received: true })
    expect(mockEmailSend).not.toHaveBeenCalled()
  })

  it('skips email when RESEND_API_KEY is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const evt = clerkEvent('user.created', {
      id: 'user_noresend',
      email_addresses: [{ email_address: 'a@b.com', id: 'ea_3' }],
    })
    mockVerify.mockReturnValue(evt)

    const result = await handler(mockEvent())

    expect(result).toEqual({ received: true })
    expect(mockEmailSend).not.toHaveBeenCalled()
  })

  it('does not throw when email send fails (non-fatal)', async () => {
    const evt = clerkEvent('user.created', {
      id: 'user_emailfail',
      email_addresses: [{ email_address: 'fail@example.com', id: 'ea_4' }],
    })
    mockVerify.mockReturnValue(evt)
    mockRender.mockResolvedValue('<html/>')
    mockEmailSend.mockRejectedValue(new Error('Resend down'))

    const result = await handler(mockEvent())
    expect(result).toEqual({ received: true }) // non-fatal
  })

  it('does not throw when Resend returns an error object', async () => {
    const evt = clerkEvent('user.created', {
      id: 'user_resenderr',
      email_addresses: [{ email_address: 'err@example.com', id: 'ea_5' }],
    })
    mockVerify.mockReturnValue(evt)
    mockRender.mockResolvedValue('<html/>')
    mockEmailSend.mockResolvedValue({ error: { message: 'rate limited' } })

    const result = await handler(mockEvent())
    expect(result).toEqual({ received: true }) // logs error but doesn't throw
  })

  // -- user.deleted: cascade cleanup --

  it('deletes the Stripe customer and revokes API keys on user.deleted', async () => {
    const evt = clerkEvent('user.deleted', { id: 'user_del123' })
    mockVerify.mockReturnValue(evt)
    mockCustomerSearch.mockResolvedValue({
      data: [{ id: 'cus_del', deleted: false }],
    })
    mockCustomerDel.mockResolvedValue({ id: 'cus_del', deleted: true })
    mockAdminFetch
      // account detail
      .mockResolvedValueOnce({ keys: [{ id: 'key-1' }, { id: 'key-2' }] })
      // revoke each key
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)

    const result = await handler(mockEvent())

    expect(result).toEqual({ received: true })
    expect(mockCustomerSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'metadata["clerkUserId"]:"user_del123"',
      }),
    )
    expect(mockCustomerDel).toHaveBeenCalledWith('cus_del')
    expect(mockAdminFetch).toHaveBeenNthCalledWith(1, '/users/user_del123')
    expect(mockAdminFetch).toHaveBeenNthCalledWith(
      2,
      '/users/user_del123/keys/key-1',
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(mockAdminFetch).toHaveBeenNthCalledWith(
      3,
      '/users/user_del123/keys/key-2',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('skips cleanup for invalid userId format', async () => {
    const evt = clerkEvent('user.deleted', { id: 'bad; DROP TABLE' })
    mockVerify.mockReturnValue(evt)

    await handler(mockEvent())

    expect(mockCustomerSearch).not.toHaveBeenCalled()
    expect(mockAdminFetch).not.toHaveBeenCalled()
  })

  it('treats a missing gateway account as nothing to revoke', async () => {
    const { GatewayError } = await import('@/lib/server/gateway/client')
    const evt = clerkEvent('user.deleted', { id: 'user_nokeys' })
    mockVerify.mockReturnValue(evt)
    mockCustomerSearch.mockResolvedValue({ data: [] })
    mockAdminFetch.mockRejectedValueOnce(new GatewayError('Not found', 404))

    const result = await handler(mockEvent())

    expect(result).toEqual({ received: true })
    expect(mockCustomerDel).not.toHaveBeenCalled()
    expect(mockAdminFetch).toHaveBeenCalledTimes(1)
  })

  it('still revokes API keys when Stripe cleanup throws', async () => {
    const evt = clerkEvent('user.deleted', { id: 'user_stripeerr' })
    mockVerify.mockReturnValue(evt)
    mockCustomerSearch.mockRejectedValue(new Error('Stripe API down'))
    mockAdminFetch.mockResolvedValueOnce({ keys: [] })

    const result = await handler(mockEvent())

    expect(result).toEqual({ received: true })
    expect(mockAdminFetch).toHaveBeenCalledWith('/users/user_stripeerr')
  })

  it('does not fail the webhook when the gateway is unreachable', async () => {
    const evt = clerkEvent('user.deleted', { id: 'user_gatewaydown' })
    mockVerify.mockReturnValue(evt)
    mockCustomerSearch.mockResolvedValue({ data: [] })
    mockAdminFetch.mockRejectedValueOnce(new Error('fetch failed'))

    const result = await handler(mockEvent())

    expect(result).toEqual({ received: true })
  })

  // -- Unknown event type --

  it('returns 200 for unhandled event types', async () => {
    mockVerify.mockReturnValue(clerkEvent('user.updated', { id: 'user_x' }))

    const result = await handler(mockEvent())
    expect(result).toEqual({ received: true })
  })
})
