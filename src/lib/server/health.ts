import { createServerFn } from '@tanstack/react-start'
import { createLogger } from './logger'
import type {
  BackendHealthCheck,
  BackendHealthResponse,
  OverallStatus,
  ServiceHealthStatus,
  ServiceStatus,
  SystemHealthStatus,
} from '@/types/health'
import { env } from '@/env'

const log = createLogger('health')

const TIMEOUT_MS = 10_000

function deriveOverallStatus(
  services: Array<ServiceHealthStatus>,
): OverallStatus {
  const statuses = services.map((s) => s.status)
  if (statuses.every((s) => s === 'operational')) return 'operational'
  if (statuses.some((s) => s === 'outage')) return 'outage'
  if (statuses.some((s) => s === 'maintenance')) return 'maintenance'
  return 'degraded'
}

async function checkGateway(): Promise<ServiceHealthStatus> {
  const gatewayUrl = env.VITE_APIM_GATEWAY_URL
  const statusPath = env.APIM_HEALTH_CHECK_PATH

  if (!gatewayUrl || !statusPath) {
    return {
      name: 'API Gateway',
      status: 'operational',
      description: 'Health check not configured',
      responseTimeMs: null,
    }
  }

  const url = `${gatewayUrl}${statusPath}`
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
    }
  }

  const url = `${baseUrl}/health`
  const start = performance.now()

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const elapsed = Math.round(performance.now() - start)

    if (res.ok) {
      const body = (await res.json()) as BackendHealthResponse
      const status: ServiceStatus =
        body.status === 'Healthy' ? 'operational' : 'degraded'
      return {
        service: {
          name: 'API Backend',
          status,
          description:
            status === 'operational'
              ? `Healthy (v${body.version})`
              : `Degraded — ${body.status}`,
          responseTimeMs: elapsed,
        },
        checks: body.checks ?? [],
      }
    }

    // Check for maintenance mode (503 with JSON body)
    if (res.status === 503) {
      try {
        const body = (await res.json()) as BackendHealthResponse
        if (body.status?.toLowerCase() === 'maintenance') {
          return {
            service: {
              name: 'API Backend',
              status: 'maintenance',
              description: 'Scheduled maintenance in progress',
              responseTimeMs: elapsed,
            },
            checks: body.checks ?? [],
          }
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
    }
  },
)
