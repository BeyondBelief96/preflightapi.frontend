import { clerkClient } from '@clerk/tanstack-react-start/server'

export async function clearStripeCustomerId(
  clerkUserId: string,
): Promise<void> {
  const clerk = clerkClient()
  await clerk.users.updateUserMetadata(clerkUserId, {
    privateMetadata: { stripeCustomerId: null },
  })
}

export async function getUserPrimaryEmail(
  clerkUserId: string,
): Promise<string | undefined> {
  const clerk = clerkClient()
  const user = await clerk.users.getUser(clerkUserId)
  return user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress
}
