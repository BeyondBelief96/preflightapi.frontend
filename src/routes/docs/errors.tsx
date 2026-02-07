import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/errors')({
  component: ErrorsDocs,
})

const errorCodes = [
  {
    code: '400',
    name: 'Bad Request',
    description:
      'The request was malformed. Check query parameters and request body.',
  },
  {
    code: '401',
    name: 'Unauthorized',
    description: 'Missing or invalid API key.',
  },
  {
    code: '403',
    name: 'Forbidden',
    description:
      'Valid API key, but your plan does not include access to this endpoint.',
  },
  {
    code: '404',
    name: 'Not Found',
    description: 'The requested resource does not exist.',
  },
  {
    code: '429',
    name: 'Too Many Requests',
    description: 'Rate limit exceeded. Implement backoff and retry.',
  },
  {
    code: '500',
    name: 'Internal Server Error',
    description:
      'An unexpected error occurred. Contact support if it persists.',
  },
]

function ErrorsDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Error Handling</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          PreflightAPI uses standard HTTP status codes and returns structured
          error responses.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Response Format</h2>
        <p className="text-muted-foreground">All errors return a JSON body:</p>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "code": "VALIDATION_ERROR",
  "message": "Invalid ICAO code format",
  "details": "ICAO code must be 4 characters",
  "validationErrors": {
    "icaoCode": ["Must be exactly 4 characters"]
  },
  "timestamp": "2025-01-05T18:56:00Z",
  "traceId": "abc123"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">HTTP Status Codes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Code</th>
                <th className="py-3 text-left font-semibold">Name</th>
                <th className="py-3 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {errorCodes.map((error) => (
                <tr key={error.code} className="border-b">
                  <td className="py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5">
                      {error.code}
                    </code>
                  </td>
                  <td className="py-3 font-medium">{error.name}</td>
                  <td className="py-3 text-muted-foreground">
                    {error.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Handling Errors</h2>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`const response = await fetch(url, { headers });

if (!response.ok) {
  const error = await response.json();
  console.error(\`API Error [\${error.code}]: \${error.message}\`);

  if (response.status === 429) {
    // Implement exponential backoff
    await delay(1000);
    return retry();
  }

  throw new Error(error.message);
}

const data = await response.json();`}
        </pre>
      </section>
    </div>
  )
}
