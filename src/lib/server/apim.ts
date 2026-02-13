import { createServerFn } from '@tanstack/react-start'
import { apimFetch } from './apim-client'
import { getApimProductIds, planIdFromProductId } from './apim-products'
import { getTierConfig } from './tier-config'
import { requireAuth, requireOwnership } from './auth'
import { createLogger } from './logger'
import type { ApimUsageReport } from '@/types/plans'
import type { SubscriptionListResponse } from '@/types/apim'

const log = createLogger('apim')

// --- User Management ---

export const getOrCreateApimUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireAuth()

    const result = await apimFetch<{
      properties: { firstName: string; lastName: string; email: string }
    }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        properties: {
          firstName: 'API',
          lastName: 'User',
          email: `${userId}@clerk.user`,
        },
      }),
    })

    return { userId, ...result.properties }
  },
)

// --- Subscription Management ---

export const getUserSubscription = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireAuth()
    const productIds = getApimProductIds()

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

    // Fetch existing subscriptions (all states, not just active)
    const result = await apimFetch<SubscriptionListResponse>(
      `/users/${userId}/subscriptions`,
    )
    let subscriptions = result.value

    // Auto-provision a free-tier subscription only if the user has NO
    // subscriptions in any state. This prevents creating a duplicate
    // free-tier sub when a paid subscription was recently cancelled/suspended.
    if (subscriptions.length === 0) {
      log.info({ userId }, 'No subscriptions found — auto-provisioning free tier')
      const freeTierSubId = `${userId}-${productIds.student}`
      await apimFetch(`/subscriptions/${freeTierSubId}`, {
        method: 'PUT',
        body: JSON.stringify({
          properties: {
            ownerId: `/users/${userId}`,
            scope: `/products/${productIds.student}`,
            displayName: userId,
            state: 'active',
          },
        }),
      })

      // Re-fetch subscriptions after provisioning
      const refreshed = await apimFetch<SubscriptionListResponse>(
        `/users/${userId}/subscriptions`,
      )
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
        state: sub.properties.state as
          | 'active'
          | 'suspended'
          | 'submitted'
          | 'rejected'
          | 'cancelled'
          | 'expired',
        createdDate: sub.properties.createdDate,
        expirationDate: sub.properties.expirationDate,
      }
    })
  },
)

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
  .inputValidator(
    (input: { subscriptionId: string; keyType: 'primary' | 'secondary' }) =>
      input,
  )
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    requireOwnership(userId, data.subscriptionId)

    const endpoint =
      data.keyType === 'primary'
        ? 'regeneratePrimaryKey'
        : 'regenerateSecondaryKey'

    log.info(
      { userId, subscriptionId: data.subscriptionId, keyType: data.keyType },
      'Regenerating API key',
    )

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

// --- Usage Analytics ---

export const getUsageAnalytics = createServerFn({ method: 'GET' })
  .inputValidator(
    (input: { subscriptionId: string; fromDate: string; toDate: string }) =>
      input,
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

// --- Tier Configuration (public, no auth required) ---

export const fetchTierConfig = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getTierConfig()
  },
)
