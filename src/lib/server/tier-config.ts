import { apimFetch } from './apim-client'
import { getStripe } from './stripe-client'
import {
  PLAN_IDS,
  getApimProductIds,
  planIdFromProductId,
} from './apim-products'
import { createLogger } from './logger'
import type { EndpointTier } from '@/lib/constants'
import { env } from '@/env'
import {
  DEFAULT_ENDPOINT_ACCESS,
  DEFAULT_PLAN_LIMITS,
  DEFAULT_PLAN_PRICES,
} from '@/lib/constants'

const log = createLogger('tier-config')

// --- Types ---

export interface TierLimits {
  callsPerMonth: number | null
  ratePerMinute: number | null
}

export interface TierPrice {
  price: number
  interval: 'month' | 'year'
}

export interface TierProduct {
  apimProductId: string
  displayName: string
}

export interface TierConfig {
  limits: Record<string, TierLimits>
  prices: Record<string, TierPrice>
  products: Record<string, TierProduct>
  endpointAccess: Record<string, EndpointTier>
}

// --- Cache ---

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null
  return entry.data
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, fetchedAt: Date.now() })
}

// --- Environment checks ---

function isApimConfigured(): boolean {
  return !!(
    env.AZURE_TENANT_ID &&
    env.AZURE_CLIENT_ID &&
    env.AZURE_CLIENT_SECRET &&
    env.AZURE_SUBSCRIPTION_ID &&
    env.APIM_RESOURCE_GROUP &&
    env.APIM_SERVICE_NAME
  )
}

function isStripeConfigured(): boolean {
  return !!(
    env.STRIPE_SECRET_KEY &&
    (env.STRIPE_PRIVATE_PRICE_ID || env.STRIPE_COMMERCIAL_PRICE_ID)
  )
}

// --- XML parsing helpers ---

function parseQuotaFromXml(xml: string): number | null {
  const match = xml.match(/<quota(?:-by-key)?\s[^>]*calls="(\d+)"/)
  return match ? parseInt(match[1], 10) : null
}

function parseRateLimitFromXml(xml: string): number | null {
  const match = xml.match(/<rate-limit(?:-by-key)?\s[^>]*calls="(\d+)"/)
  return match ? parseInt(match[1], 10) : null
}

// --- APIM fetchers ---

async function fetchProductPolicy(
  productId: string,
): Promise<{ callsPerMonth: number | null; ratePerMinute: number | null }> {
  const result = await apimFetch<{
    properties: { value: string }
  }>(`/products/${productId}/policies/policy`)

  const xml = result.properties.value
  return {
    callsPerMonth: parseQuotaFromXml(xml),
    ratePerMinute: parseRateLimitFromXml(xml),
  }
}

async function fetchProductApis(productId: string): Promise<Array<string>> {
  const result = await apimFetch<{
    value: Array<{ properties: { path: string } }>
  }>(`/products/${productId}/apis`)

  return result.value.map((api) => api.properties.path)
}

async function fetchProductMetadata(
  productId: string,
): Promise<{ displayName: string }> {
  const result = await apimFetch<{
    properties: { displayName: string }
  }>(`/products/${productId}`)

  return { displayName: result.properties.displayName }
}

// --- APIM tier data ---

async function fetchApimLimits(): Promise<Record<string, TierLimits>> {
  // PLAN_IDS are the APIM product IDs — use them directly for fetching
  const results = await Promise.all(
    PLAN_IDS.map((id) => fetchProductPolicy(id)),
  )

  const limits: Record<string, TierLimits> = {}
  for (let i = 0; i < PLAN_IDS.length; i++) {
    limits[planIdFromProductId(PLAN_IDS[i])] = results[i]
  }
  return limits
}

async function fetchApimProducts(): Promise<Record<string, TierProduct>> {
  // PLAN_IDS are the APIM product IDs — use them directly for fetching
  const results = await Promise.all(
    PLAN_IDS.map((id) => fetchProductMetadata(id)),
  )

  const products: Record<string, TierProduct> = {}
  for (let i = 0; i < PLAN_IDS.length; i++) {
    products[planIdFromProductId(PLAN_IDS[i])] = {
      apimProductId: PLAN_IDS[i],
      displayName: results[i].displayName,
    }
  }
  return products
}

async function fetchApimEndpointAccess(): Promise<
  Record<string, EndpointTier>
> {
  const tierOrder: Array<EndpointTier> = ['student', 'private', 'commercial']
  const productIds = getApimProductIds()
  const apiResults = await Promise.all(
    tierOrder.map((tier) => fetchProductApis(productIds[tier])),
  )

  const endpointAccess: Record<string, EndpointTier> = {}

  // Iterate in tier order so the lowest tier that includes an API wins
  for (let i = 0; i < tierOrder.length; i++) {
    const tier = tierOrder[i]
    const apis = apiResults[i]
    for (const path of apis) {
      if (!(path in endpointAccess)) {
        endpointAccess[path] = tier
      }
    }
  }

  return endpointAccess
}

// --- Stripe price fetcher ---

async function fetchStripePrices(): Promise<Record<string, TierPrice>> {
  const stripe = getStripe()
  const prices: Record<string, TierPrice> = {
    student: { price: 0, interval: 'month' },
  }

  const priceIds: Array<{ planId: string; priceId: string | undefined }> = [
    { planId: 'private', priceId: env.STRIPE_PRIVATE_PRICE_ID },
    { planId: 'commercial', priceId: env.STRIPE_COMMERCIAL_PRICE_ID },
    { planId: 'atp', priceId: env.STRIPE_ATP_PRICE_ID },
  ]

  const fetches = priceIds
    .filter((p) => p.priceId)
    .map(async ({ planId, priceId }) => {
      const price = await stripe.prices.retrieve(priceId!)
      return {
        planId,
        price: (price.unit_amount ?? 0) / 100,
        interval: (price.recurring?.interval ?? 'month') as 'month' | 'year',
      }
    })

  const results = await Promise.all(fetches)
  for (const r of results) {
    prices[r.planId] = { price: r.price, interval: r.interval }
  }

  return prices
}

// --- Default products (fallback when APIM is unavailable) ---

function getDefaultProducts(): Record<string, TierProduct> {
  const productIds = getApimProductIds()
  return {
    student: {
      apimProductId: productIds.student,
      displayName: 'Student Pilot',
    },
    private: {
      apimProductId: productIds.private,
      displayName: 'Private Pilot',
    },
    commercial: {
      apimProductId: productIds.commercial,
      displayName: 'Commercial Pilot',
    },
    atp: {
      apimProductId: productIds.atp,
      displayName: 'ATP',
    },
  }
}

// --- Main export ---

export async function getTierConfig(): Promise<TierConfig> {
  const cached = getCached<TierConfig>('tier-config')
  if (cached) return cached

  // Start with static defaults
  const config: TierConfig = {
    limits: { ...DEFAULT_PLAN_LIMITS },
    prices: { ...DEFAULT_PLAN_PRICES },
    products: getDefaultProducts(),
    endpointAccess: { ...DEFAULT_ENDPOINT_ACCESS },
  }

  // Fetch APIM data (limits + products + endpoint access) in parallel
  if (isApimConfigured()) {
    try {
      const [limits, products, endpointAccess] = await Promise.all([
        fetchApimLimits(),
        fetchApimProducts(),
        fetchApimEndpointAccess(),
      ])
      config.limits = limits
      config.products = products
      config.endpointAccess = endpointAccess
    } catch (error) {
      log.error({ err: error }, 'APIM fetch failed, using defaults')
      // If we have stale cache, use that instead of defaults
      const stale = cache.get('tier-config') as
        | CacheEntry<TierConfig>
        | undefined
      if (stale) {
        config.limits = stale.data.limits
        config.products = stale.data.products
        config.endpointAccess = stale.data.endpointAccess
      }
    }
  }

  // Fetch Stripe prices
  if (isStripeConfigured()) {
    try {
      config.prices = await fetchStripePrices()
    } catch (error) {
      log.error({ err: error }, 'Stripe fetch failed, using defaults')
      const stale = cache.get('tier-config') as
        | CacheEntry<TierConfig>
        | undefined
      if (stale) {
        config.prices = stale.data.prices
      }
    }
  }

  setCache('tier-config', config)
  return config
}
