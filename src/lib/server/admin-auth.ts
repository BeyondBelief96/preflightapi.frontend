import { auth } from '@clerk/tanstack-react-start/server'
import { createClerkClient } from '@clerk/backend'
import { env } from '@/env'

export function getAdminEmails(): Array<string> {
  const raw = env.ADMIN_EMAILS
  if (!raw) return []
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export async function isAdmin(clerkUserId: string): Promise<boolean> {
  const adminEmails = getAdminEmails()
  if (adminEmails.length === 0) return false

  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
  const user = await clerk.users.getUser(clerkUserId)

  const primaryEmail = user.emailAddresses
    .find((e) => e.id === user.primaryEmailAddressId)
    ?.emailAddress?.toLowerCase()

  if (!primaryEmail) return false
  return adminEmails.includes(primaryEmail)
}

export async function requireAdmin(): Promise<string> {
  const session = await auth()
  if (!session?.userId) {
    throw new Error('Unauthorized')
  }

  const admin = await isAdmin(session.userId)
  if (!admin) {
    throw new Error('Forbidden')
  }

  return session.userId
}
