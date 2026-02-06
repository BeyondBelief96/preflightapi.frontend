import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { apimFetch } from './apim-client'
import type { ApimUsageReport } from '@/types/plans'
import { PLANS } from '@/lib/constants'

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.userId) {
    throw new Error('Unauthorized')
  }
  return session.userId
}

function requireOwnership(userId: string, subscriptionId: string): void {
  if (!subscriptionId.startsWith(userId)) {
    throw new Error('Forbidden')
  }
}

function planIdFromProductId(productId: string): string {
  const plan = PLANS.find((p) => productId.includes(p.apimProductId))
  return plan?.id ?? 'free'
}

// Shared type for subscription list responses
type SubscriptionListResponse = {
  value: Array<{
    id: string
    name: string
    properties: {
      ownerId: string
      scope: string
      displayName: string
      state: string
      createdDate: string
      expirationDate: string | null
    }
  }>
}

// --- User Management ---

export const getOrCreateApimUser = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireAuth()

  const result = await apimFetch<{ properties: { firstName: string; lastName: string; email: string } }>(
    `/users/${userId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        properties: {
          firstName: 'API',
          lastName: 'User',
          email: `${userId}@clerk.user`,
        },
      }),
    },
  )

  return { userId, ...result.properties }
})

// --- Subscription Management ---

export const createSubscription = createServerFn({ method: 'POST' })
  .inputValidator((input: { productId: string; displayName?: string }) => input)
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    const subId = `${userId}-${data.productId}`

    const result = await apimFetch<{
      id: string
      name: string
      properties: {
        ownerId: string
        scope: string
        displayName: string
        state: string
        createdDate: string
        expirationDate: string | null
      }
    }>(`/subscriptions/${subId}`, {
      method: 'PUT',
      body: JSON.stringify({
        properties: {
          ownerId: `/users/${userId}`,
          scope: `/products/${data.productId}`,
          displayName: data.displayName ?? `${data.productId} subscription`,
          state: 'active',
        },
      }),
    })

    return {
      id: result.name,
      productId: data.productId,
      state: result.properties.state,
      createdDate: result.properties.createdDate,
    }
  })

export const getUserSubscription = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireAuth()

  // Ensure the APIM user exists before querying subscriptions
  await apimFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      properties: {
        firstName: 'API',
        lastName: 'User',
        email: `${userId}@clerk.user`,
      },
    }),
  })

  // Fetch existing subscriptions
  const result = await apimFetch<SubscriptionListResponse>(`/users/${userId}/subscriptions`)
  let subscriptions = result.value

  // Auto-provision a free-tier subscription if the user has none
  if (subscriptions.length === 0) {
    const freeTierSubId = `${userId}-free-tier`
    await apimFetch(`/subscriptions/${freeTierSubId}`, {
      method: 'PUT',
      body: JSON.stringify({
        properties: {
          ownerId: `/users/${userId}`,
          scope: `/products/free-tier`,
          displayName: 'Student Pilot (Free)',
          state: 'active',
        },
      }),
    })

    // Re-fetch subscriptions after provisioning
    const refreshed = await apimFetch<SubscriptionListResponse>(`/users/${userId}/subscriptions`)
    subscriptions = refreshed.value
  }

  return subscriptions.map((sub) => {
    const productId = sub.properties.scope.split('/').pop() ?? ''
    return {
      id: sub.name,
      name: sub.properties.displayName,
      productId,
      planId: planIdFromProductId(productId),
      userId,
      state: sub.properties.state as 'active' | 'suspended' | 'submitted' | 'rejected' | 'cancelled' | 'expired',
      createdDate: sub.properties.createdDate,
      expirationDate: sub.properties.expirationDate,
    }
  })
})

export const getSubscriptionKeys = createServerFn({ method: 'POST' })
  .inputValidator((input: { subscriptionId: string }) => input)
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const result = await apimFetch<{
      primaryKey: string
      secondaryKey: string
    }>(`/subscriptions/${data.subscriptionId}/listSecrets`, {
      method: 'POST',
    })

    return {
      primaryKey: result.primaryKey,
      secondaryKey: result.secondaryKey,
    }
  })

export const regenerateKey = createServerFn({ method: 'POST' })
  .inputValidator((input: { subscriptionId: string; keyType: 'primary' | 'secondary' }) => input)
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const endpoint =
      data.keyType === 'primary' ? 'regeneratePrimaryKey' : 'regenerateSecondaryKey'

    await apimFetch(`/subscriptions/${data.subscriptionId}/${endpoint}`, {
      method: 'POST',
    })

    // Fetch the new keys
    const keys = await apimFetch<{
      primaryKey: string
      secondaryKey: string
    }>(`/subscriptions/${data.subscriptionId}/listSecrets`, {
      method: 'POST',
    })

    return keys
  })

export const changeTier = createServerFn({ method: 'POST' })
  .inputValidator((input: { subscriptionId: string; newProductId: string }) => input)
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    await apimFetch(`/subscriptions/${data.subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        properties: {
          scope: `/products/${data.newProductId}`,
        },
      }),
    })

    return { success: true }
  })

export const suspendSubscription = createServerFn({ method: 'POST' })
  .inputValidator((input: { subscriptionId: string }) => input)
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    await apimFetch(`/subscriptions/${data.subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        properties: {
          state: 'suspended',
        },
      }),
    })

    return { success: true }
  })

export const deleteSubscription = createServerFn({ method: 'POST' })
  .inputValidator((input: { subscriptionId: string }) => input)
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    await apimFetch(`/subscriptions/${data.subscriptionId}`, {
      method: 'DELETE',
    })

    return { success: true }
  })

// --- Usage Analytics ---

export const getUsageAnalytics = createServerFn({ method: 'GET' })
  .inputValidator(
    (input: { subscriptionId: string; fromDate: string; toDate: string }) => input,
  )
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const filter = `timestamp ge datetime'${data.fromDate}' and timestamp le datetime'${data.toDate}'`

    const result = await apimFetch<{
      value: Array<{
        subscriptionId: string
        callCountSuccess: number
        callCountBlocked: number
        callCountFailed: number
        callCountOther: number
        callCountTotal: number
        bandwidth: number
        apiTimeAvg: number
        apiTimeMin: number
        apiTimeMax: number
      }>
    }>(`/reports/bySubscription?$filter=${encodeURIComponent(filter)}`)

    const report = result.value.find((r) =>
      r.subscriptionId.includes(data.subscriptionId),
    )

    if (!report) {
      return {
        callCountTotal: 0,
        callCountSuccess: 0,
        callCountBlocked: 0,
        callCountFailed: 0,
        callCountOther: 0,
        bandwidth: 0,
        apiTimeAvg: 0,
        apiTimeMin: 0,
        apiTimeMax: 0,
      } satisfies ApimUsageReport
    }

    return {
      callCountTotal: report.callCountTotal,
      callCountSuccess: report.callCountSuccess,
      callCountBlocked: report.callCountBlocked,
      callCountFailed: report.callCountFailed,
      callCountOther: report.callCountOther,
      bandwidth: report.bandwidth,
      apiTimeAvg: report.apiTimeAvg,
      apiTimeMin: report.apiTimeMin,
      apiTimeMax: report.apiTimeMax,
    } satisfies ApimUsageReport
  })
