import { Link, createFileRoute } from '@tanstack/react-router'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_PATH } from '@/lib/api-metadata'

export const Route = createFileRoute('/docs/errors')({
  component: ErrorsDocs,
})

const statusCodes = [
  {
    code: '400',
    name: 'Bad Request',
    source: 'Backend',
    description:
      'Invalid query parameters, missing required fields, or invalid values.',
  },
  {
    code: '401',
    name: 'Unauthorized',
    source: 'APIM Gateway',
    description:
      'Missing or invalid API key. Check the Ocp-Apim-Subscription-Key header.',
  },
  {
    code: '403',
    name: 'Forbidden',
    source: 'APIM Gateway',
    description:
      'Endpoint not available on your plan (tier-gating) or monthly quota exceeded.',
  },
  {
    code: '404',
    name: 'Not Found',
    source: 'Backend',
    description:
      'The requested resource does not exist (e.g., unknown ICAO code, no METAR available).',
  },
  {
    code: '409',
    name: 'Conflict',
    source: 'Backend',
    description:
      'The request conflicts with the current state (e.g., duplicate resource).',
  },
  {
    code: '429',
    name: 'Too Many Requests',
    source: 'APIM Gateway',
    description:
      'Rate limit exceeded. Includes a Retry-After header. See the rate limits page for details.',
  },
  {
    code: '500',
    name: 'Internal Server Error',
    source: 'Backend',
    description:
      'An unexpected error occurred. Include the traceId when contacting support.',
  },
  {
    code: '503',
    name: 'Service Unavailable',
    source: 'Backend',
    description:
      'An external data source (NOAA, FAA) is temporarily unavailable. Retry after a short delay.',
  },
]

const errorCodeGroups = [
  {
    category: 'General',
    codes: [
      {
        code: 'INTERNAL_ERROR',
        description: 'An unexpected server error occurred',
      },
      {
        code: 'VALIDATION_ERROR',
        description:
          'One or more request parameters failed validation',
      },
      { code: 'NOT_FOUND', description: 'Generic resource not found' },
      {
        code: 'CONFLICT',
        description: 'Operation conflicts with current state',
      },
    ],
  },
  {
    category: 'Airports',
    codes: [
      {
        code: 'AIRPORT_NOT_FOUND',
        description: 'No airport exists with the given identifier',
      },
      {
        code: 'AIRPORT_DIAGRAM_NOT_FOUND',
        description: 'No airport diagram available for this airport',
      },
      {
        code: 'RUNWAY_NOT_FOUND',
        description: 'No runway found matching the query',
      },
      {
        code: 'COMMUNICATION_FREQUENCY_NOT_FOUND',
        description:
          'No communication frequency found for this airport',
      },
    ],
  },
  {
    category: 'Weather',
    codes: [
      {
        code: 'METAR_NOT_FOUND',
        description:
          'No current METAR available for the given station',
      },
      {
        code: 'TAF_NOT_FOUND',
        description:
          'No current TAF available for the given station',
      },
      {
        code: 'WEATHER_SERVICE_UNAVAILABLE',
        description:
          'NOAA weather service is temporarily unavailable',
      },
      {
        code: 'WEATHER_DATA_MISSING',
        description:
          'Weather data was expected but not available',
      },
    ],
  },
  {
    category: 'NOTAMs & Airspace',
    codes: [
      {
        code: 'NOTAM_SERVICE_UNAVAILABLE',
        description: 'FAA NOTAM service is temporarily unavailable',
      },
      {
        code: 'AIRSPACE_NOT_FOUND',
        description: 'No airspace found matching the query',
      },
      {
        code: 'OBSTACLE_NOT_FOUND',
        description: 'No obstacle found matching the query',
      },
    ],
  },
  {
    category: 'Documents',
    codes: [
      {
        code: 'CHART_SUPPLEMENT_NOT_FOUND',
        description:
          'No chart supplement available for this airport',
      },
    ],
  },
  {
    category: 'Performance & Navigation',
    codes: [
      {
        code: 'PERFORMANCE_CALCULATION_ERROR',
        description: 'Error calculating performance values',
      },
      {
        code: 'INVALID_PERFORMANCE_DATA',
        description:
          'Provided performance data is invalid or out of range',
      },
      {
        code: 'NAVLOG_CALCULATION_ERROR',
        description: 'Error computing the nav log',
      },
    ],
  },
  {
    category: 'External Services',
    codes: [
      {
        code: 'EXTERNAL_SERVICE_UNAVAILABLE',
        description:
          'A downstream service is temporarily unavailable',
      },
    ],
  },
]

function ErrorsDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Error Handling</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          PreflightAPI uses standard HTTP status codes and returns JSON error
          responses. Errors originate from two sources — the{' '}
          <strong className="text-foreground">APIM gateway</strong> (auth, rate
          limits, quotas, tier-gating) and the{' '}
          <strong className="text-foreground">backend API</strong> (validation,
          not found, server errors) — each with a distinct response format.
        </p>
      </div>

      {/* APIM Gateway Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Gateway Errors (401, 429, 403 Quota)
        </h2>
        <p className="text-muted-foreground">
          These errors are generated by the Azure API Management gateway{' '}
          <em>before</em> the request reaches the backend. They use a simple{' '}
          <code>statusCode</code> + <code>message</code> format:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "statusCode": 429,
  "message": "Rate limit is exceeded. Try again in 52 seconds."
}`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Status</th>
                <th className="py-3 text-left font-semibold">Cause</th>
                <th className="py-3 text-left font-semibold">Example Message</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">401</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Missing or invalid subscription key
                </td>
                <td className="py-3 text-sm text-muted-foreground">
                  "Access denied due to invalid subscription key. Make sure to
                  provide a valid key for an active subscription."
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">429</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Rate limit exceeded
                </td>
                <td className="py-3 text-sm text-muted-foreground">
                  "Rate limit is exceeded. Try again in 52 seconds."
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">403</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Monthly quota exceeded
                </td>
                <td className="py-3 text-sm text-muted-foreground">
                  "Out of call volume quota. Quota will be replenished in
                  06:23:15."
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Tier-Gating Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Tier-Gating Errors (403)
        </h2>
        <p className="text-muted-foreground">
          When your subscription plan does not include access to the requested
          endpoint, the APIM gateway returns a <code>403 Forbidden</code>{' '}
          response with a different format — an <code>error</code> string
          field instead of <code>statusCode</code>:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "error": "This endpoint is not available on the Free tier. Please upgrade to Starter or Professional."
}`}
        />
        <p className="text-muted-foreground">
          See the{' '}
          <Link to="/docs" className="text-accent hover:underline">
            endpoint access table
          </Link>{' '}
          for which endpoints are available on each plan.
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            You can distinguish the two types of <code>403</code> by checking
            the response body: quota exceeded has{' '}
            <code>{'{ statusCode, message }'}</code>, while tier-gating has{' '}
            <code>{'{ error }'}</code>.
          </p>
        </div>
      </section>

      {/* Backend API Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Backend API Errors (400, 404, 409, 500, 503)
        </h2>
        <p className="text-muted-foreground">
          Errors generated by the API backend use a rich, structured format
          with a machine-readable <code>code</code> for programmatic handling
          and a <code>traceId</code> for support:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "METAR_NOT_FOUND",
  "message": "No current METAR available for station 'KXYZ'",
  "timestamp": "2026-01-15T18:56:00Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "path": "${API_BASE_PATH}/metars/KXYZ"
}`}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Field</th>
                <th className="py-3 text-left font-semibold">Type</th>
                <th className="py-3 text-left font-semibold">Description</th>
                <th className="py-3 text-left font-semibold">Always Present</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">code</code>
                </td>
                <td className="py-3 text-muted-foreground">string</td>
                <td className="py-3 text-muted-foreground">
                  Machine-readable error code (e.g.,{' '}
                  <code>METAR_NOT_FOUND</code>)
                </td>
                <td className="py-3 text-muted-foreground">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">message</code>
                </td>
                <td className="py-3 text-muted-foreground">string</td>
                <td className="py-3 text-muted-foreground">
                  Human-readable description of what went wrong
                </td>
                <td className="py-3 text-muted-foreground">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">timestamp</code>
                </td>
                <td className="py-3 text-muted-foreground">string</td>
                <td className="py-3 text-muted-foreground">
                  ISO 8601 UTC timestamp of when the error occurred
                </td>
                <td className="py-3 text-muted-foreground">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">traceId</code>
                </td>
                <td className="py-3 text-muted-foreground">string?</td>
                <td className="py-3 text-muted-foreground">
                  Correlation ID — include this when contacting support
                </td>
                <td className="py-3 text-muted-foreground">Usually</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">path</code>
                </td>
                <td className="py-3 text-muted-foreground">string?</td>
                <td className="py-3 text-muted-foreground">
                  The request path that generated the error
                </td>
                <td className="py-3 text-muted-foreground">Usually</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">details</code>
                </td>
                <td className="py-3 text-muted-foreground">string?</td>
                <td className="py-3 text-muted-foreground">
                  Additional context (development environments only)
                </td>
                <td className="py-3 text-muted-foreground">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">validationErrors</code>
                </td>
                <td className="py-3 text-muted-foreground">{'object?'}</td>
                <td className="py-3 text-muted-foreground">
                  Field-level errors (only for <code>400</code> validation
                  failures)
                </td>
                <td className="py-3 text-muted-foreground">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* HTTP Status Codes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">HTTP Status Codes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Code</th>
                <th className="py-3 text-left font-semibold">Name</th>
                <th className="py-3 text-left font-semibold">Source</th>
                <th className="py-3 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {statusCodes.map((error) => (
                <tr key={error.code} className="border-b">
                  <td className="py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5">
                      {error.code}
                    </code>
                  </td>
                  <td className="py-3 font-medium">{error.name}</td>
                  <td className="py-3 text-muted-foreground">
                    {error.source}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {error.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Error Codes Reference */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Codes Reference</h2>
        <p className="text-muted-foreground">
          The <code>code</code> field in backend error responses contains one of
          these machine-readable values. Use these to handle specific errors
          programmatically:
        </p>

        {errorCodeGroups.map((group) => (
          <div key={group.category}>
            <h3 className="mb-2 mt-4 text-sm font-semibold text-foreground">
              {group.category}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {group.codes.map((item) => (
                    <tr key={item.code} className="border-b">
                      <td className="w-72 py-2.5">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {item.code}
                        </code>
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Validation Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Validation Errors</h2>
        <p className="text-muted-foreground">
          When a request fails validation (<code>400 Bad Request</code>), the
          response includes a <code>validationErrors</code> object with
          field-level details. Each key is the parameter name, and the value is
          an array of error messages:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "VALIDATION_ERROR",
  "message": "One or more validation errors occurred.",
  "validationErrors": {
    "latitude": [
      "Latitude must be between -90 and 90 degrees"
    ],
    "radiusNm": [
      "Radius must be between 0 and 100 nautical miles"
    ]
  },
  "timestamp": "2026-01-15T18:56:00Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "path": "${API_BASE_PATH}/notams/radius"
}`}
        />
      </section>

      {/* Handling Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Handling Errors</h2>
        <p className="text-muted-foreground">
          Because gateway and backend errors have different shapes, your error
          handling should check the response format. Here's how to handle both:
        </p>

        <CodeBlock
          language="typescript"
          code={`async function fetchMetar(icaoCode: string): Promise<Metar | null> {
  const response = await fetch(
    \`https://api.preflightapi.com${API_BASE_PATH}/metars/\${icaoCode}\`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.PREFLIGHT_API_KEY!,
      },
    },
  )

  if (!response.ok) {
    const body = await response.json()

    // Gateway errors have { statusCode, message }
    // Tier-gating errors have { error }
    // Backend errors have { code, message, traceId, ... }

    switch (response.status) {
      case 401:
        // Gateway: invalid key
        throw new Error(body.message)

      case 403:
        // Could be tier-gating ({ error }) or quota exceeded ({ statusCode, message })
        throw new Error(body.error || body.message)

      case 404:
        // Backend: resource not found
        if (body.code === 'METAR_NOT_FOUND') {
          return null // No METAR available for this station
        }
        throw new Error(body.message)

      case 429:
        // Gateway: rate limited — check Retry-After header
        throw new Error(body.message)

      case 503:
        // Backend: external service down — safe to retry
        throw new Error(body.message)

      default:
        // Backend error — log traceId for support
        console.error(\`API error [\${body.code}]: \${body.message}\`)
        if (body.traceId) console.error(\`Trace ID: \${body.traceId}\`)
        throw new Error(body.message)
    }
  }

  return response.json() as Promise<Metar>
}`}
        />
      </section>

      {/* Retry Strategy */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Retry Strategy</h2>
        <p className="text-muted-foreground">
          Not all errors are retryable. Here's a guide for which status codes to
          retry and which to handle immediately:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Status</th>
                <th className="py-3 text-left font-semibold">Source</th>
                <th className="py-3 text-left font-semibold">Retryable?</th>
                <th className="py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">400</code>
                </td>
                <td className="py-3 text-muted-foreground">Backend</td>
                <td className="py-3 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Fix the request — check parameters and validationErrors
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">401</code>
                </td>
                <td className="py-3 text-muted-foreground">APIM</td>
                <td className="py-3 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Check your API key is correct and present
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    403 (tier)
                  </code>
                </td>
                <td className="py-3 text-muted-foreground">APIM</td>
                <td className="py-3 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Upgrade your plan to access this endpoint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    403 (quota)
                  </code>
                </td>
                <td className="py-3 text-muted-foreground">APIM</td>
                <td className="py-3 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Wait for monthly quota reset or upgrade plan
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">404</code>
                </td>
                <td className="py-3 text-muted-foreground">Backend</td>
                <td className="py-3 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  The resource doesn't exist — check the identifier
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">409</code>
                </td>
                <td className="py-3 text-muted-foreground">Backend</td>
                <td className="py-3 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Resolve the conflict
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">429</code>
                </td>
                <td className="py-3 text-muted-foreground">APIM</td>
                <td className="py-3 font-medium text-accent">Yes</td>
                <td className="py-3 text-muted-foreground">
                  Wait for the Retry-After duration, then retry
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">500</code>
                </td>
                <td className="py-3 text-muted-foreground">Backend</td>
                <td className="py-3 font-medium text-accent">Maybe</td>
                <td className="py-3 text-muted-foreground">
                  Retry once — if it persists, contact support with the traceId
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">503</code>
                </td>
                <td className="py-3 text-muted-foreground">Backend</td>
                <td className="py-3 font-medium text-accent">Yes</td>
                <td className="py-3 text-muted-foreground">
                  External data source is down — retry with backoff
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground">
          For a ready-to-use retry implementation, see the{' '}
          <Link
            to="/docs/rate-limits"
            className="text-accent hover:underline"
          >
            exponential backoff example
          </Link>{' '}
          on the rate limits page.
        </p>
      </section>
    </div>
  )
}
