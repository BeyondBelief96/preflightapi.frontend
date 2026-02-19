import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createLogger } from './logger'
import type {
  AirportDto,
  CommunicationFrequencyDto,
  MetarDto,
  NavlogResponseDto,
  RouteBriefingResponse,
  RunwayDto,
  WindsAloftDto,
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
  navlog: 10 * 60 * 1000, // 10 min — winds change
  briefing: 5 * 60 * 1000, // 5 min — weather changes
  windsAloft: 15 * 60 * 1000, // 15 min — FB data updates every 6 hours
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
interface DemoFetchOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  cacheKey?: string // override for POST to avoid time-dependent keys
}

async function demoFetch<T>(
  path: string,
  ttl: number,
  options?: DemoFetchOptions,
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
  const cacheKey = options?.cacheKey ?? path
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

  const method = options?.method ?? 'GET'
  const isPost = method === 'POST'

  const fetchPromise = (async () => {
    const url = `${gatewayUrl}${API_BASE_PATH}${path}`
    const start = performance.now()

    const headers: Record<string, string> = {
      'Ocp-Apim-Subscription-Key': env.DEMO_API_KEY,
    }
    if (isPost) {
      headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(url, {
      method,
      headers,
      body: isPost ? JSON.stringify(options?.body) : undefined,
      signal: AbortSignal.timeout(isPost ? 30_000 : 10_000),
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

// --- Demo flight planning functions (curated KBNA → KCLT route) ---

export const fetchDemoNavlog = createServerFn().handler(async () => {
  return demoFetch<NavlogResponseDto>(
    '/navlog/calculate',
    CACHE_TTL.navlog,
    {
      method: 'POST',
      cacheKey: 'demo-navlog-KBNA-KCLT',
      body: {
        waypoints: [
          {
            id: 'KBNA',
            name: 'Nashville Intl',
            latitude: 36.1245,
            longitude: -86.6782,
            altitude: 599,
            waypointType: 'Airport',
          },
          {
            id: 'KCLT',
            name: 'Charlotte Douglas Intl',
            latitude: 35.214,
            longitude: -80.9431,
            altitude: 748,
            waypointType: 'Airport',
          },
        ],
        performanceData: {
          cruiseTrueAirspeed: 110,
          climbTrueAirspeed: 75,
          descentTrueAirspeed: 90,
          climbFpm: 500,
          descentFpm: 500,
          cruiseFuelBurn: 8.5,
          climbFuelBurn: 10,
          descentFuelBurn: 6,
          sttFuelGals: 1.5,
          fuelOnBoardGals: 40,
        },
        plannedCruisingAltitude: 5500,
        timeOfDeparture: new Date().toISOString(),
      },
    },
  )
})

export const fetchDemoRouteBriefing = createServerFn().handler(async () => {
  return demoFetch<RouteBriefingResponse>(
    '/briefing/route',
    CACHE_TTL.briefing,
    {
      method: 'POST',
      cacheKey: 'demo-briefing-KBNA-KCLT',
      body: {
        waypoints: [
          { airportIdentifier: 'KBNA' },
          { airportIdentifier: 'KCLT' },
        ],
        corridorWidthNm: 25,
      },
    },
  )
})

export const fetchDemoWindsAloft = createServerFn().handler(async () => {
  return demoFetch<WindsAloftDto>(
    '/navlog/winds-aloft/6',
    CACHE_TTL.windsAloft,
  )
})
