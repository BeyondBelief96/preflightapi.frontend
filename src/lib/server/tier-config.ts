import { apimFetch } from './apim-client'
import { getStripe } from './stripe-client'
import type { EndpointTier } from '@/lib/constants'
import { env } from '@/env'
import {
  DEFAULT_ENDPOINT_ACCESS,
  DEFAULT_PLAN_LIMITS,
  DEFAULT_PLAN_PRICES,
  PLANS,
} from '@/lib/constants'

// --- Types ---

export interface TierLimits {
  callsPerMonth: number | null
  ratePerMinute: number | null
}

export interface TierPrice {
  price: number
  interval: 'month' | 'year'
}

export interface TierConfig {
  limits: Record<string, TierLimits>
  prices: Record<string, TierPrice>
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
    (env.STRIPE_STARTER_PRICE_ID || env.STRIPE_PROFESSIONAL_PRICE_ID)
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

async function fetchProductApis(
  productId: string,
): Promise<Array<string>> {
  const result = await apimFetch<{
    value: Array<{ properties: { path: string } }>
  }>(`/products/${productId}/apis`)

  return result.value.map((api) => api.properties.path)
}

// --- APIM tier data ---

async function fetchApimLimits(): Promise<Record<string, TierLimits>> {
  const products = PLANS.map((p) => p.apimProductId)
  const results = await Promise.all(products.map(fetchProductPolicy))

  const limits: Record<string, TierLimits> = {}
  for (let i = 0; i < PLANS.length; i++) {
    limits[PLANS[i].id] = results[i]
  }
  return limits
}

async function fetchApimEndpointAccess(): Promise<
  Record<string, EndpointTier>
> {
  const tierOrder: Array<EndpointTier> = ['free', 'starter', 'professional']
  const products = PLANS.map((p) => p.apimProductId)
  const apiResults = await Promise.all(products.map(fetchProductApis))

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
    free: { price: 0, interval: 'month' },
  }

  const priceIds: Array<{ planId: string; priceId: string | undefined }> = [
    { planId: 'starter', priceId: env.STRIPE_STARTER_PRICE_ID },
    { planId: 'professional', priceId: env.STRIPE_PROFESSIONAL_PRICE_ID },
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

// --- Main export ---

export async function getTierConfig(): Promise<TierConfig> {
  const cached = getCached<TierConfig>('tier-config')
  if (cached) return cached

  // Start with static defaults
  const config: TierConfig = {
    limits: { ...DEFAULT_PLAN_LIMITS },
    prices: { ...DEFAULT_PLAN_PRICES },
    endpointAccess: { ...DEFAULT_ENDPOINT_ACCESS },
  }

  // Fetch APIM data (limits + endpoint access) in parallel
  if (isApimConfigured()) {
    try {
      const [limits, endpointAccess] = await Promise.all([
        fetchApimLimits(),
        fetchApimEndpointAccess(),
      ])
      config.limits = limits
      config.endpointAccess = endpointAccess
    } catch (error) {
      console.error('[tier-config] APIM fetch failed, using defaults:', error)
      // If we have stale cache, use that instead of defaults
      const stale = cache.get('tier-config') as
        | CacheEntry<TierConfig>
        | undefined
      if (stale) {
        config.limits = stale.data.limits
        config.endpointAccess = stale.data.endpointAccess
      }
    }
  }

  // Fetch Stripe prices
  if (isStripeConfigured()) {
    try {
      config.prices = await fetchStripePrices()
    } catch (error) {
      console.error(
        '[tier-config] Stripe fetch failed, using defaults:',
        error,
      )
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
