import { createServerFn } from '@tanstack/react-start'
import { getStripe } from './stripe/client'
import { createLogger } from './logger'
import type { EndpointTier } from '@/lib/constants'
import {
  DEFAULT_ENDPOINT_ACCESS,
  DEFAULT_PLAN_LIMITS,
  DEFAULT_PLAN_PRICES,
  PLANS,
} from '@/lib/constants'
import { env } from '@/env'

const log = createLogger('tier-config')

export interface TierLimits {
  callsPerMonth: number | null
  ratePerMinute: number | null
}

export interface TierPrice {
  price: number
  interval: 'month' | 'year'
}

export interface TierProduct {
  displayName: string
}

export interface TierConfig {
  limits: Record<string, TierLimits>
  prices: Record<string, TierPrice>
  products: Record<string, TierProduct>
  endpointAccess: Record<string, EndpointTier>
}

const CACHE_TTL_MS = 5 * 60 * 1000

let cached: { config: TierConfig; fetchedAt: number } | null = null

async function fetchStripePrices(): Promise<Record<string, TierPrice>> {
  const stripe = getStripe()
  const prices: Record<string, TierPrice> = {
    student: { price: 0, interval: 'month' },
  }

  const priceIds = [
    { planId: 'private', priceId: env.STRIPE_PRIVATE_PRICE_ID },
    { planId: 'commercial', priceId: env.STRIPE_COMMERCIAL_PRICE_ID },
  ].filter((p): p is { planId: string; priceId: string } => !!p.priceId)

  const results = await Promise.all(
    priceIds.map(async ({ planId, priceId }) => {
      const price = await stripe.prices.retrieve(priceId)
      return {
        planId,
        price: (price.unit_amount ?? 0) / 100,
        interval: (price.recurring?.interval ?? 'month') as 'month' | 'year',
      }
    }),
  )
  for (const r of results) {
    prices[r.planId] = { price: r.price, interval: r.interval }
  }
  return prices
}

/**
 * Plan limits and endpoint access are static — they mirror the tier
 * definitions the API gateway enforces (@preflight/contracts). Prices come
 * from Stripe, falling back to the defaults (or the last good fetch).
 */
export async function getTierConfig(): Promise<TierConfig> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.config
  }

  const config: TierConfig = {
    limits: { ...DEFAULT_PLAN_LIMITS },
    prices: { ...DEFAULT_PLAN_PRICES },
    products: Object.fromEntries(
      PLANS.map((p) => [p.id, { displayName: p.name }]),
    ),
    endpointAccess: { ...DEFAULT_ENDPOINT_ACCESS },
  }

  if (env.STRIPE_SECRET_KEY) {
    try {
      config.prices = await fetchStripePrices()
    } catch (error) {
      log.error({ err: error }, 'Stripe price fetch failed, using defaults')
      if (cached) config.prices = cached.config.prices
    }
  }

  cached = { config, fetchedAt: Date.now() }
  return config
}

/** Public — used by the pricing page and docs. */
export const fetchTierConfig = createServerFn({ method: 'GET' }).handler(() =>
  getTierConfig(),
)
