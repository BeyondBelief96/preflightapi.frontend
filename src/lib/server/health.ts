import { createServerFn } from '@tanstack/react-start'
import { createLogger } from './logger'
import type {
  BackendHealthCheck,
  BackendHealthResponse,
  DataCurrencyStatus,
  OverallStatus,
  ServiceHealthStatus,
  ServiceStatus,
  SystemHealthStatus,
} from '@/types/health'
import { env } from '@/env'

const log = createLogger('health')

const TIMEOUT_MS = 10_000

function getInternalHeaders(): HeadersInit {
  const secret = env.PREFLIGHT_API_GATEWAY_SECRET
  if (!secret) return {}
  return { 'X-Api-Gateway-Secret': secret }
}

function deriveOverallStatus(
  services: Array<ServiceHealthStatus>,
): OverallStatus {
  const statuses = services.map((s) => s.status)
  if (statuses.every((s) => s === 'operational')) return 'operational'
  if (statuses.some((s) => s === 'outage')) return 'outage'
  return 'degraded'
}

async function checkGateway(): Promise<ServiceHealthStatus> {
  const gatewayUrl = env.GATEWAY_URL

  if (!gatewayUrl) {
    return {
      name: 'API Gateway',
      status: 'operational',
      description: 'Health check not configured',
      responseTimeMs: null,
    }
  }

  const url = new URL('/healthz', gatewayUrl).toString()
  const start = performance.now()

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const elapsed = Math.round(performance.now() - start)

    if (res.ok) {
      return {
        name: 'API Gateway',
        status: 'operational',
        description: 'Gateway is responding normally',
        responseTimeMs: elapsed,
      }
    }

    if (res.status === 502) {
      try {
        const body = (await res.json()) as {
          status?: string
          message?: string
        }
        if (body.status === 'outage') {
          return {
            name: 'API Gateway',
            status: 'outage' as ServiceStatus,
            description: body.message ?? 'Backend is unreachable',
            responseTimeMs: elapsed,
          }
        }
      } catch {
        // Not JSON — fall through to generic degraded
      }
    }

    log.warn({ status: res.status }, 'Gateway returned non-OK status')
    return {
      name: 'API Gateway',
      status: 'degraded',
      description: `Gateway returned HTTP ${res.status}`,
      responseTimeMs: elapsed,
    }
  } catch (err) {
    const elapsed = Math.round(performance.now() - start)
    log.error({ err }, 'Gateway health check failed')
    return {
      name: 'API Gateway',
      status: 'outage',
      description: 'Gateway is unreachable',
      responseTimeMs: elapsed,
    }
  }
}

async function checkApi(): Promise<{
  service: ServiceHealthStatus
  checks: Array<BackendHealthCheck>
  lastCheckedAt: string | null
}> {
  const baseUrl = env.PREFLIGHT_API_BASE_URL

  if (!baseUrl) {
    return {
      service: {
        name: 'API Backend',
        status: 'operational',
        description: 'Health check not configured',
        responseTimeMs: null,
      },
      checks: [],
      lastCheckedAt: null,
    }
  }

  const url = `${baseUrl}/health`
  const start = performance.now()

  try {
    const res = await fetch(url, {
      headers: getInternalHeaders(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const elapsed = Math.round(performance.now() - start)

    if (res.ok) {
      const body = (await res.json()) as BackendHealthResponse
      const status: ServiceStatus =
        body.status === 'Healthy'
          ? 'operational'
          : body.status === 'Degraded'
            ? 'degraded'
            : 'degraded'
      return {
        service: {
          name: 'API Backend',
          status,
          description:
            status === 'operational'
              ? `Healthy (v${body.version})`
              : `Degraded — ${body.status} (v${body.version})`,
          responseTimeMs: elapsed,
        },
        checks: body.checks ?? [],
        lastCheckedAt: body.lastCheckedAt ?? null,
      }
    }

    // 503 from /health — could be Unhealthy or Starting (first check not yet complete)
    if (res.status === 503) {
      try {
        const body = (await res.json()) as BackendHealthResponse

        if (body.status === 'Starting') {
          return {
            service: {
              name: 'API Backend',
              status: 'degraded',
              description: 'Starting up — first health check pending',
              responseTimeMs: elapsed,
            },
            checks: [],
            lastCheckedAt: null,
          }
        }

        return {
          service: {
            name: 'API Backend',
            status: 'outage',
            description: `Unhealthy — ${body.status} (v${body.version})`,
            responseTimeMs: elapsed,
          },
          checks: body.checks ?? [],
          lastCheckedAt: body.lastCheckedAt ?? null,
        }
      } catch {
        // Not JSON — fall through to generic degraded
      }
    }

    log.warn({ status: res.status }, 'API returned non-OK status')
    return {
      service: {
        name: 'API Backend',
        status: 'degraded',
        description: `API returned HTTP ${res.status}`,
        responseTimeMs: elapsed,
      },
      checks: [],
      lastCheckedAt: null,
    }
  } catch (err) {
    const elapsed = Math.round(performance.now() - start)
    log.error({ err }, 'API health check failed')
    return {
      service: {
        name: 'API Backend',
        status: 'outage',
        description: 'API is unreachable',
        responseTimeMs: elapsed,
      },
      checks: [],
      lastCheckedAt: null,
    }
  }
}

export const fetchSystemHealth = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SystemHealthStatus> => {
    const [gateway, api] = await Promise.all([checkGateway(), checkApi()])

    const services = [gateway, api.service]

    return {
      overall: deriveOverallStatus(services),
      services,
      backendChecks: api.checks,
      checkedAt: new Date().toISOString(),
      lastCheckedAt: api.lastCheckedAt,
    }
  },
)

export const fetchDataCurrency = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DataCurrencyStatus | null> => {
    const baseUrl = env.PREFLIGHT_API_BASE_URL

    if (!baseUrl) {
      log.warn('PREFLIGHT_API_BASE_URL not configured — skipping data currency')
      return null
    }

    try {
      const res = await fetch(`${baseUrl}/health/data-currency`, {
        headers: getInternalHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!res.ok) {
        log.warn({ status: res.status }, 'Data currency check failed')
        return null
      }
      return (await res.json()) as DataCurrencyStatus
    } catch (err) {
      log.error({ err }, 'Data currency fetch failed')
      return null
    }
  },
)
