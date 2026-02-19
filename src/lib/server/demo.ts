import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createLogger } from './logger'
import type {
  AirportDto,
  CommunicationFrequencyDto,
  MetarDto,
  RunwayDto,
} from '@/generated/api'
import { env } from '@/env'
import { API_BASE_PATH } from '@/lib/api-metadata'

const logger = createLogger('demo')

// --- In-memory response cache ---
// Prevents redundant APIM calls when many users request the same airport.
// Static data (airports, runways, frequencies) cached 1 hour.
// Weather (METARs) cached 2 minutes — fresh enough for a demo.

interface CacheEntry<T> {
  data: T
  durationMs: number
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

const CACHE_TTL = {
  airport: 60 * 60 * 1000, // 1 hour
  metar: 2 * 60 * 1000, // 2 minutes
  runways: 60 * 60 * 1000, // 1 hour
  frequencies: 60 * 60 * 1000, // 1 hour
} as const

// Periodic cleanup so stale entries don't accumulate
let lastCleanup = Date.now()
function cleanupCache() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60 * 1000) return // every 5 min at most
  lastCleanup = now
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) cache.delete(key)
  }
}

// --- Rate limiting (30 req/min global to APIM, not from cache) ---
const WINDOW_MS = 60 * 1000
const MAX_GLOBAL = 30
let globalAttempts: Array<number> = []

function isRateLimited(): boolean {
  const now = Date.now()
  globalAttempts = globalAttempts.filter((t) => now - t < WINDOW_MS)
  if (globalAttempts.length >= MAX_GLOBAL) return true
  globalAttempts.push(now)
  return false
}

// --- Deduplication of in-flight requests ---
// If 50 users request KJFK simultaneously before the first response arrives,
// only one actual fetch is made and all 50 await the same promise.
const inflight = new Map<string, Promise<{ data: unknown; durationMs: number }>>()

// --- Demo fetch helper ---
async function demoFetch<T>(
  path: string,
  ttl: number,
): Promise<{ data: T; durationMs: number }> {
  if (!env.DEMO_API_KEY) {
    throw new Error('Demo API is not configured')
  }

  const gatewayUrl = env.VITE_APIM_GATEWAY_URL
  if (!gatewayUrl) {
    throw new Error('Gateway URL is not configured')
  }

  // Check cache first
  cleanupCache()
  const cacheKey = path
  const cached = cache.get(cacheKey) as CacheEntry<T> | undefined
  if (cached && Date.now() < cached.expiresAt) {
    return { data: cached.data, durationMs: cached.durationMs }
  }

  // Rate limit only applies to actual APIM calls (cache hits bypass it)
  if (isRateLimited()) {
    // If we have stale data, serve it rather than erroring
    if (cached) {
      return { data: cached.data, durationMs: cached.durationMs }
    }
    throw new Error('Demo rate limit exceeded. Please try again shortly.')
  }

  // Deduplicate concurrent requests for the same path
  const existing = inflight.get(cacheKey)
  if (existing) {
    const result = await existing
    return result as { data: T; durationMs: number }
  }

  const fetchPromise = (async () => {
    const url = `${gatewayUrl}${API_BASE_PATH}${path}`
    const start = performance.now()

    const res = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': env.DEMO_API_KEY,
      },
      signal: AbortSignal.timeout(10_000),
    })

    const durationMs = Math.round(performance.now() - start)

    if (!res.ok) {
      logger.warn({ status: res.status, path }, 'Demo fetch failed')
      throw new Error(`API returned ${res.status}`)
    }

    const data = (await res.json()) as T

    // Store in cache
    cache.set(cacheKey, { data, durationMs, expiresAt: Date.now() + ttl })

    return { data, durationMs }
  })()

  inflight.set(cacheKey, fetchPromise)
  try {
    return await fetchPromise
  } finally {
    inflight.delete(cacheKey)
  }
}

// --- Input validation ---
const icaoSchema = z.object({
  icao: z
    .string()
    .min(3)
    .max(4)
    .regex(/^[A-Z0-9]+$/),
})

const facilityIdSchema = z.object({
  facilityId: z
    .string()
    .min(2)
    .max(4)
    .regex(/^[A-Z0-9]+$/),
})

// --- Server functions ---
export const fetchDemoAirport = createServerFn()
  .inputValidator((input: z.input<typeof icaoSchema>) =>
    icaoSchema.parse(input),
  )
  .handler(async ({ data }) => {
    return demoFetch<AirportDto>(`/airports/${data.icao}`, CACHE_TTL.airport)
  })

export const fetchDemoMetar = createServerFn()
  .inputValidator((input: z.input<typeof icaoSchema>) =>
    icaoSchema.parse(input),
  )
  .handler(async ({ data }) => {
    return demoFetch<MetarDto>(`/metars/${data.icao}`, CACHE_TTL.metar)
  })

export const fetchDemoRunways = createServerFn()
  .inputValidator((input: z.input<typeof icaoSchema>) =>
    icaoSchema.parse(input),
  )
  .handler(async ({ data }) => {
    return demoFetch<Array<RunwayDto>>(
      `/airports/${data.icao}/runways`,
      CACHE_TTL.runways,
    )
  })

export const fetchDemoFrequencies = createServerFn()
  .inputValidator((input: z.input<typeof facilityIdSchema>) =>
    facilityIdSchema.parse(input),
  )
  .handler(async ({ data }) => {
    // Frequencies endpoint returns a paginated wrapper { data: [...], pagination: {...} }
    const result = await demoFetch<{
      data: Array<CommunicationFrequencyDto>
    }>(`/communication-frequencies/${data.facilityId}`, CACHE_TTL.frequencies)
    return { data: result.data.data, durationMs: result.durationMs }
  })
