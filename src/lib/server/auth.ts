import { auth } from '@clerk/tanstack-react-start/server'

export async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.userId) {
    throw new Error('Unauthorized')
  }
  return session.userId
}

export function requireOwnership(userId: string, subscriptionId: string): void {
  if (!subscriptionId.startsWith(userId)) {
    throw new Error('Forbidden')
  }
}
