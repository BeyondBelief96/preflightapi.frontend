import { ClientSecretCredential } from '@azure/identity'
import { env } from '@/env'

const APIM_MANAGEMENT_SCOPE = 'https://management.azure.com/.default'

let credentialInstance: ClientSecretCredential | null = null

function getCredential(): ClientSecretCredential {
  if (!credentialInstance) {
    const tenantId = env.AZURE_TENANT_ID
    const clientId = env.AZURE_CLIENT_ID
    const clientSecret = env.AZURE_CLIENT_SECRET

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        'Azure credentials not configured. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET.',
      )
    }

    credentialInstance = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    )
  }
  return credentialInstance
}

function getManagementBaseUrl(): string {
  const subscriptionId = env.AZURE_SUBSCRIPTION_ID
  const resourceGroup = env.APIM_RESOURCE_GROUP
  const serviceName = env.APIM_SERVICE_NAME

  if (!subscriptionId || !resourceGroup || !serviceName) {
    throw new Error(
      'APIM configuration not complete. Set AZURE_SUBSCRIPTION_ID, APIM_RESOURCE_GROUP, and APIM_SERVICE_NAME.',
    )
  }

  return `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ApiManagement/service/${serviceName}`
}

const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 500
const FETCH_TIMEOUT_MS = 30_000

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500
}

export async function apimFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const credential = getCredential()
  const apiVersion = env.APIM_API_VERSION ?? '2024-05-01'
  const baseUrl = getManagementBaseUrl()
  const separator = path.includes('?') ? '&' : '?'
  const url = `${baseUrl}${path}${separator}api-version=${apiVersion}`

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const token = await credential.getToken(APIM_MANAGEMENT_SCOPE)
    if (!token) {
      throw new Error(
        'Failed to acquire Azure AD token for APIM Management API.',
      )
    }

    const controller = new AbortController()
    const fetchTimer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const body = await response.text()
        lastError = new Error(
          `APIM Management API error (${response.status}): ${body}`,
        )

        if (isRetryable(response.status) && attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY * 2 ** attempt
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        throw lastError
      }

      // 204 No Content
      if (response.status === 204) {
        return undefined as T
      }

      return response.json() as Promise<T>
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('APIM request failed')

      // Retry on network errors and timeouts (fetch throws on these)
      if (
        attempt < MAX_RETRIES &&
        !lastError.message.startsWith('APIM Management API error')
      ) {
        const delay = RETRY_BASE_DELAY * 2 ** attempt
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw lastError
    } finally {
      clearTimeout(fetchTimer)
    }
  }

  throw lastError ?? new Error('APIM request failed after retries')
}
