import { ClientSecretCredential } from '@azure/identity'
import { env } from '@/env'

const LOG_ANALYTICS_SCOPE = 'https://api.loganalytics.io/.default'

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

export interface LogAnalyticsResponse {
  tables: Array<{
    name: string
    columns: Array<{ name: string; type: string }>
    rows: Array<Array<string | number | null>>
  }>
}

const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 500

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500
}

export async function logAnalyticsQuery(
  query: string,
): Promise<LogAnalyticsResponse> {
  const workspaceId = env.APIM_LOG_ANALYTICS_WORKSPACE_ID
  if (!workspaceId) {
    throw new Error(
      'LOG_ANALYTICS_WORKSPACE_ID not configured. Set it to your Log Analytics workspace GUID.',
    )
  }

  const credential = getCredential()
  const url = `https://api.loganalytics.io/v1/workspaces/${workspaceId}/query`

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const token = await credential.getToken(LOG_ANALYTICS_SCOPE)
    if (!token) {
      throw new Error(
        'Failed to acquire Azure AD token for Log Analytics API.',
      )
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const body = await response.text()
        lastError = new Error(
          `Log Analytics API error (${response.status}): ${body}`,
        )

        if (isRetryable(response.status) && attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY * 2 ** attempt
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        throw lastError
      }

      return response.json() as Promise<LogAnalyticsResponse>
    } catch (err) {
      lastError =
        err instanceof Error ? err : new Error('Log Analytics request failed')

      if (
        attempt < MAX_RETRIES &&
        !lastError.message.startsWith('Log Analytics API error')
      ) {
        const delay = RETRY_BASE_DELAY * 2 ** attempt
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw lastError
    }
  }

  throw lastError ?? new Error('Log Analytics request failed after retries')
}
