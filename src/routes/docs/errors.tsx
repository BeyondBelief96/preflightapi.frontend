import { Link, createFileRoute } from '@tanstack/react-router'
import { Callout } from '@/components/docs/callout'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_PATH } from '@/lib/api-metadata'
import { cn } from '@/lib/utils'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/errors')({
  head: () =>
    createPageHead({
      title: 'Error Handling',
      description:
        'Complete guide to PreflightAPI error codes, HTTP status codes, error response formats, and best practices for handling errors in your application.',
      path: '/docs/errors',
    }),
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
    source: 'Gateway',
    description:
      'Missing or invalid API key. Check the Ocp-Apim-Subscription-Key header.',
  },
  {
    code: '403',
    name: 'Forbidden',
    source: 'Gateway',
    description:
      'Endpoint not available on your plan (tier-gating). Upgrade to access this endpoint.',
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
    source: 'Gateway',
    description:
      'Rate limit or monthly quota exceeded. Check the code field to distinguish RATE_LIMIT_EXCEEDED from QUOTA_EXCEEDED.',
  },
  {
    code: '500',
    name: 'Internal Server Error',
    source: 'Backend',
    description:
      'An unexpected error occurred. Include the traceId when contacting support.',
  },
  {
    code: '502',
    name: 'Bad Gateway',
    source: 'Gateway',
    description:
      'Backend is unreachable (deploy, crash, or network issue). Safe to retry with backoff.',
  },
  {
    code: '503',
    name: 'Service Unavailable',
    source: 'Both',
    description:
      'Gateway: scheduled maintenance (MAINTENANCE). Backend: external data source down (service field identifies which).',
  },
]

const errorCodeGroups = [
  {
    category: 'Gateway',
    codes: [
      {
        code: 'UNAUTHORIZED',
        description: 'Missing or invalid API subscription key',
      },
      {
        code: 'TIER_RESTRICTED',
        description:
          'Endpoint not available on your subscription tier — upgrade to access',
      },
      {
        code: 'RATE_LIMIT_EXCEEDED',
        description:
          'Per-minute rate limit exceeded — includes retryAfterSeconds field',
      },
      {
        code: 'QUOTA_EXCEEDED',
        description:
          'Monthly call quota exhausted — includes quotaResetsAt field',
      },
      {
        code: 'BACKEND_UNAVAILABLE',
        description: 'Backend is unreachable (deploy, crash, or network issue)',
      },
      {
        code: 'MAINTENANCE',
        description:
          'Scheduled maintenance in progress — includes Retry-After header',
      },
    ],
  },
  {
    category: 'General',
    codes: [
      {
        code: 'INTERNAL_ERROR',
        description: 'An unexpected server error occurred',
      },
      {
        code: 'VALIDATION_ERROR',
        description: 'One or more request parameters failed validation',
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
        code: 'TERMINAL_PROCEDURE_NOT_FOUND',
        description: 'No terminal procedures available for this airport',
      },
      {
        code: 'RUNWAY_NOT_FOUND',
        description: 'No runway found matching the query',
      },
      {
        code: 'COMMUNICATION_FREQUENCY_NOT_FOUND',
        description: 'No communication frequency found for this airport',
      },
    ],
  },
  {
    category: 'Weather',
    codes: [
      {
        code: 'METAR_NOT_FOUND',
        description: 'No current METAR available for the given station',
      },
      {
        code: 'TAF_NOT_FOUND',
        description: 'No current TAF available for the given station',
      },
      {
        code: 'WEATHER_SERVICE_UNAVAILABLE',
        description: 'NOAA weather service is temporarily unavailable',
      },
      {
        code: 'WEATHER_DATA_MISSING',
        description: 'Weather data was expected but not available',
      },
    ],
  },
  {
    category: 'NOTAMs',
    codes: [
      {
        code: 'NOTAM_NOT_FOUND',
        description: 'No NOTAM found matching the query',
      },
      {
        code: 'NOTAM_SERVICE_UNAVAILABLE',
        description: 'FAA NOTAM service is temporarily unavailable',
      },
    ],
  },
  {
    category: 'Airspace & Obstacles',
    codes: [
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
    category: 'Charts',
    codes: [
      {
        code: 'CHART_SUPPLEMENT_NOT_FOUND',
        description: 'No chart supplement available for this airport',
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
        description: 'Provided performance data is invalid or out of range',
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
          'A downstream service is temporarily unavailable — the service field identifies which one',
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
          PreflightAPI uses standard HTTP status codes and returns structured
          JSON error responses. Every error — whether generated by the{' '}
          <strong className="text-foreground">APIM gateway</strong> (auth, rate
          limits, quotas, tier-gating) or the{' '}
          <strong className="text-foreground">backend API</strong> (validation,
          not found, server errors) — uses the same response format.
        </p>
      </div>

      {/* Error Response Format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Response Format</h2>
        <p className="text-muted-foreground">
          All errors return a unified <code>ApiErrorResponse</code> shape with a
          machine-readable <code>code</code> for programmatic handling and a{' '}
          <code>traceId</code> for support. Fields are omitted when null:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "METAR_NOT_FOUND",
  "message": "No current METAR available for station 'KXYZ'.",
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "path": "${API_BASE_PATH}/metars/KXYZ"
}`}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-semibold">Field</th>
                <th className="py-3 pr-4 text-left font-semibold">Type</th>
                <th className="py-3 text-left font-semibold">Description</th>
                <th className="py-3 text-left font-semibold">Always Present</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">code</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">string</td>
                <td className="py-3 text-muted-foreground">
                  Machine-readable error code (e.g.,{' '}
                  <code>METAR_NOT_FOUND</code>, <code>RATE_LIMIT_EXCEEDED</code>
                  )
                </td>
                <td className="py-3 text-muted-foreground">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">message</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">string</td>
                <td className="py-3 text-muted-foreground">
                  Human-readable description of what went wrong
                </td>
                <td className="py-3 text-muted-foreground">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">timestamp</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">string</td>
                <td className="py-3 text-muted-foreground">
                  ISO 8601 UTC timestamp of when the error occurred
                </td>
                <td className="py-3 text-muted-foreground">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">traceId</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">string</td>
                <td className="py-3 text-muted-foreground">
                  Correlation ID — include this when contacting support
                </td>
                <td className="py-3 text-muted-foreground">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">path</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">string</td>
                <td className="py-3 text-muted-foreground">
                  The request path that generated the error
                </td>
                <td className="py-3 text-muted-foreground">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">service</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">string?</td>
                <td className="py-3 text-muted-foreground">
                  Name of the unavailable external service (only on{' '}
                  <code>503</code> backend responses)
                </td>
                <td className="py-3 text-muted-foreground">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">retryAfterSeconds</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">number?</td>
                <td className="py-3 text-muted-foreground">
                  Seconds to wait before retrying (only on{' '}
                  <code>RATE_LIMIT_EXCEEDED</code>)
                </td>
                <td className="py-3 text-muted-foreground">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">quotaResetsAt</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">string?</td>
                <td className="py-3 text-muted-foreground">
                  ISO 8601 UTC timestamp when the monthly quota renews (only on{' '}
                  <code>QUOTA_EXCEEDED</code>)
                </td>
                <td className="py-3 text-muted-foreground">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">validationErrors</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{'object?'}</td>
                <td className="py-3 text-muted-foreground">
                  Field-level errors (only on <code>VALIDATION_ERROR</code>)
                </td>
                <td className="py-3 text-muted-foreground">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="text-sm">details</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">string?</td>
                <td className="py-3 text-muted-foreground">
                  Stack trace (development environments only)
                </td>
                <td className="py-3 text-muted-foreground">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Gateway Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Gateway Errors (401, 403, 429, 502, 503)
        </h2>
        <p className="text-muted-foreground">
          These errors are generated by the APIM gateway <em>before</em> the
          request reaches the backend. They use the same{' '}
          <code>ApiErrorResponse</code> format as backend errors.
        </p>

        <h3 className="text-lg font-medium">Authentication (401)</h3>
        <CodeBlock
          language="json"
          code={`{
  "code": "UNAUTHORIZED",
  "message": "Access denied due to invalid subscription key. Make sure to provide a valid key for an active subscription.",
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "path": "${API_BASE_PATH}/metars/KJFK"
}`}
        />

        <h3 className="mt-4 text-lg font-medium">Tier-gating (403)</h3>
        <p className="text-muted-foreground">
          Returned when your subscription plan does not include access to the
          requested endpoint. See the{' '}
          <Link to="/docs" className="text-accent hover:underline">
            endpoint access table
          </Link>{' '}
          for which endpoints are available on each plan.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "TIER_RESTRICTED",
  "message": "This endpoint is not available on the Student Pilot tier. Please upgrade to Private Pilot or higher.",
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "path": "${API_BASE_PATH}/notams/KJFK"
}`}
        />

        <h3 className="mt-4 text-lg font-medium">Rate limit exceeded (429)</h3>
        <p className="text-muted-foreground">
          Returned when you exceed your per-minute rate limit. Includes a{' '}
          <code>retryAfterSeconds</code> field and a standard{' '}
          <code>Retry-After</code> header.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please slow down and try again shortly.",
  "retryAfterSeconds": 45,
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "path": "${API_BASE_PATH}/metars/KJFK"
}`}
        />

        <h3 className="mt-4 text-lg font-medium">Quota exceeded (429)</h3>
        <p className="text-muted-foreground">
          Returned when you exhaust your monthly API call quota. The{' '}
          <code>quotaResetsAt</code> field is an ISO 8601 UTC timestamp
          indicating when your quota renews.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "QUOTA_EXCEEDED",
  "message": "You have reached your monthly API call limit.",
  "quotaResetsAt": "2026-03-15T06:00:00.0000000Z",
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "path": "${API_BASE_PATH}/metars/KJFK"
}`}
        />

        <Callout variant="note">
          Both rate limit and quota errors return <code>429</code>. Use the{' '}
          <code>code</code> field to distinguish{' '}
          <code>RATE_LIMIT_EXCEEDED</code> (retryable after a short delay) from{' '}
          <code>QUOTA_EXCEEDED</code> (wait for monthly reset or upgrade).
        </Callout>

        <h3 className="mt-4 text-lg font-medium">Backend unavailable (502)</h3>
        <p className="text-muted-foreground">
          Returned when the gateway cannot reach the backend (e.g. during a
          deploy, crash, or network issue). Safe to retry with backoff.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "BACKEND_UNAVAILABLE",
  "message": "The API backend is temporarily unavailable. Please try again shortly.",
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "path": "${API_BASE_PATH}/metars/KJFK"
}`}
        />

        <h3 className="mt-4 text-lg font-medium">
          Scheduled maintenance (503)
        </h3>
        <p className="text-muted-foreground">
          Returned during scheduled maintenance windows (e.g. CI/CD deploys).
          Includes a <code>Retry-After</code> header.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "MAINTENANCE",
  "message": "PreflightAPI is undergoing scheduled maintenance. Please try again shortly.",
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "f6a7b8c9-d0e1-2345-fabc-456789012345",
  "path": "${API_BASE_PATH}/metars/KJFK"
}`}
        />
      </section>

      {/* Backend API Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Backend Errors (400, 404, 409, 500, 503)
        </h2>
        <p className="text-muted-foreground">
          Errors generated by the API backend use domain-specific error codes
          for precise programmatic handling. A few examples:
        </p>
        <CodeBlock
          language="json"
          code={`// 404 — resource not found
{
  "code": "METAR_NOT_FOUND",
  "message": "No current METAR available for station 'KXYZ'.",
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "path": "${API_BASE_PATH}/metars/KXYZ"
}`}
        />
        <CodeBlock
          language="json"
          code={`// 503 — external service unavailable (includes service field)
{
  "code": "EXTERNAL_SERVICE_UNAVAILABLE",
  "message": "The MagneticVariation service is temporarily unavailable.",
  "service": "MagneticVariationService",
  "timestamp": "2026-01-15T19:02:00.0000000Z",
  "traceId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "path": "${API_BASE_PATH}/navlog"
}`}
        />
      </section>

      {/* HTTP Status Codes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">HTTP Status Codes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-semibold">Code</th>
                <th className="py-3 pr-4 text-left font-semibold">Name</th>
                <th className="py-3 pr-4 text-left font-semibold">Source</th>
                <th className="py-3 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {statusCodes.map((error) => (
                <tr key={error.code} className="border-b">
                  <td className="py-3 pr-4">
                    <code className="rounded bg-muted px-1.5 py-0.5">
                      {error.code}
                    </code>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 font-medium">
                    {error.name}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
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
          The <code>code</code> field contains one of these machine-readable
          values. Use these to handle specific errors programmatically:
        </p>

        {errorCodeGroups.map((group, index) => (
          <div
            key={group.category}
            className={cn(index > 0 && 'border-t border-border/30 pt-4')}
          >
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
          an array of error messages. This applies to both explicit parameter
          validation (e.g. coordinates, radius) and automatic model binding
          errors (e.g. malformed JSON, invalid enum values):
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
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "path": "${API_BASE_PATH}/notams/radius"
}`}
        />
      </section>

      {/* Handling Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Handling Errors</h2>
        <p className="text-muted-foreground">
          Since all errors use the same response shape, you only need a single
          parsing path. Switch on the <code>code</code> field for specific
          handling:
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
    // Every error has: { code, message, timestamp, traceId, path }

    switch (body.code) {
      case 'UNAUTHORIZED':
        throw new Error('Invalid API key')

      case 'TIER_RESTRICTED':
        throw new Error(body.message) // "...upgrade to Private Pilot..."

      case 'METAR_NOT_FOUND':
        return null // No METAR for this station — expected

      case 'RATE_LIMIT_EXCEEDED':
        // Retry after the indicated delay
        throw new Error(\`Rate limited. Retry in \${body.retryAfterSeconds}s\`)

      case 'QUOTA_EXCEEDED':
        // Monthly quota exhausted — not retryable
        throw new Error(\`Quota exceeded. Resets at \${body.quotaResetsAt}\`)

      case 'BACKEND_UNAVAILABLE':
      case 'MAINTENANCE':
        // Safe to retry with backoff
        throw new Error(body.message)

      case 'EXTERNAL_SERVICE_UNAVAILABLE':
        // body.service identifies which service is down
        throw new Error(\`\${body.message} (service: \${body.service})\`)

      default:
        // Log traceId for support
        console.error(\`API error [\${body.code}]: \${body.message}\`)
        console.error(\`Trace ID: \${body.traceId}\`)
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
                <th className="py-3 pr-4 text-left font-semibold">Status</th>
                <th className="py-3 pr-4 text-left font-semibold">Code</th>
                <th className="py-3 pr-4 text-left font-semibold">
                  Retryable?
                </th>
                <th className="py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">400</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">VALIDATION_ERROR</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Fix the request — check <code>validationErrors</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">401</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">UNAUTHORIZED</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Check your API key is correct and present
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">403</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">TIER_RESTRICTED</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Upgrade your plan to access this endpoint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">404</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">*_NOT_FOUND</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  The resource doesn't exist — check the identifier
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">409</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">CONFLICT</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Resolve the conflict
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">429</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">RATE_LIMIT_EXCEEDED</code>
                </td>
                <td className="py-3 pr-4 font-medium text-accent">Yes</td>
                <td className="py-3 text-muted-foreground">
                  Wait for <code>retryAfterSeconds</code>, then retry
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">429</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">QUOTA_EXCEEDED</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">No</td>
                <td className="py-3 text-muted-foreground">
                  Wait for <code>quotaResetsAt</code> or upgrade plan
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">500</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">INTERNAL_ERROR</code>
                </td>
                <td className="py-3 pr-4 font-medium text-accent">Maybe</td>
                <td className="py-3 text-muted-foreground">
                  Retry once — if it persists, contact support with{' '}
                  <code>traceId</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">502</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">BACKEND_UNAVAILABLE</code>
                </td>
                <td className="py-3 pr-4 font-medium text-accent">Yes</td>
                <td className="py-3 text-muted-foreground">
                  Backend unreachable — retry with backoff
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">503</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <code className="text-xs">MAINTENANCE</code> /{' '}
                  <code className="text-xs">*_UNAVAILABLE</code>
                </td>
                <td className="py-3 pr-4 font-medium text-accent">Yes</td>
                <td className="py-3 text-muted-foreground">
                  Maintenance or external service down — retry with backoff
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground">
          For a ready-to-use retry implementation, see the{' '}
          <Link to="/docs/rate-limits" className="text-accent hover:underline">
            exponential backoff example
          </Link>{' '}
          on the rate limits page.
        </p>
      </section>
    </div>
  )
}
