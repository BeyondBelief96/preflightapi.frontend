import { describe, expect, it, vi } from 'vitest'

vi.mock('@/env', () => ({
  env: {
    ADMIN_EMAILS: undefined,
    CLERK_SECRET_KEY: 'sk_test_mock',
  },
}))

vi.mock('@clerk/backend', () => ({
  createClerkClient: () => ({
    users: {
      getUser: vi.fn().mockResolvedValue({
        primaryEmailAddressId: 'email_1',
        emailAddresses: [{ id: 'email_1', emailAddress: 'admin@example.com' }],
      }),
    },
  }),
}))

describe('getAdminEmails with empty env', () => {
  it('returns empty array when ADMIN_EMAILS is not set', async () => {
    const { getAdminEmails } = await import('../admin/auth')
    expect(getAdminEmails()).toEqual([])
  })

  it('isAdmin returns false when ADMIN_EMAILS is not set', async () => {
    const { isAdmin } = await import('../admin/auth')
    expect(await isAdmin('user_123')).toBe(false)
  })
})
