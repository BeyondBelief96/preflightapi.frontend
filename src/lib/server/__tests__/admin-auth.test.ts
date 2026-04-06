import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminEmails, isAdmin, requireAdmin } from '../admin/auth'

vi.mock('@/env', () => ({
  env: {
    ADMIN_EMAILS: 'admin@example.com, BOSS@Example.IO',
    CLERK_SECRET_KEY: 'sk_test_mock',
  },
}))

const mockGetUser = vi.fn()
vi.mock('@clerk/backend', () => ({
  createClerkClient: () => ({
    users: { getUser: mockGetUser },
  }),
}))

const mockAuth = vi.fn()
vi.mock('@clerk/tanstack-react-start/server', () => ({
  auth: () => mockAuth(),
}))

describe('getAdminEmails', () => {
  it('parses comma-separated emails and lowercases them', () => {
    const emails = getAdminEmails()
    expect(emails).toEqual(['admin@example.com', 'boss@example.io'])
  })
})

describe('isAdmin', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it('returns true for admin email', async () => {
    mockGetUser.mockResolvedValue({
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'admin@example.com' }],
    })

    expect(await isAdmin('user_123')).toBe(true)
  })

  it('returns true case-insensitively', async () => {
    mockGetUser.mockResolvedValue({
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'BOSS@Example.IO' }],
    })

    expect(await isAdmin('user_456')).toBe(true)
  })

  it('returns false for non-admin email', async () => {
    mockGetUser.mockResolvedValue({
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'user@example.com' }],
    })

    expect(await isAdmin('user_789')).toBe(false)
  })

  it('returns false when user has no primary email', async () => {
    mockGetUser.mockResolvedValue({
      primaryEmailAddressId: null,
      emailAddresses: [],
    })

    expect(await isAdmin('user_000')).toBe(false)
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    mockAuth.mockReset()
    mockGetUser.mockReset()
  })

  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    await expect(requireAdmin()).rejects.toThrow('Unauthorized')
  })

  it('throws Forbidden when user is not admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_notadmin' })
    mockGetUser.mockResolvedValue({
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'user@random.com' }],
    })

    await expect(requireAdmin()).rejects.toThrow('Forbidden')
  })

  it('returns userId when user is admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' })
    mockGetUser.mockResolvedValue({
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'admin@example.com' }],
    })

    const result = await requireAdmin()
    expect(result).toBe('user_admin')
  })
})
