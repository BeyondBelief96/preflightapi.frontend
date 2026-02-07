import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/airports/search')({
  component: AirportSearchDocs,
})

function AirportSearchDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Airport Search</h1>
          <TierBadge tier="free" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Search and retrieve airport data by ICAO code, FAA identifier, name,
          city, state, or prefix. Includes endpoints for individual lookups,
          batch requests, and full-text search.
        </p>
      </div>

      {/* Endpoint: Get all airports */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airports</code>
        </div>
        <p className="text-muted-foreground">
          Get all airports in the database.
        </p>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airports`}
        </pre>
      </section>

      {/* Endpoint: Search airports */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/airports/search?query={'{term}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Search airports by ICAO code, FAA identifier, name, or city. Requires
          a minimum of 2 characters. Returns a maximum of 50 results.
        </p>

        <h3 className="text-lg font-semibold">Query Parameters</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Parameter</th>
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">
                <code>query</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Search term (min 2 characters). Searches ICAO code, FAA
                identifier, airport name, and city.
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  "${GATEWAY_URL}/api/v1/airports/search?query=kennedy"`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "siteNumber": "16820.*A",
    "icaoId": "KJFK",
    "faaIdentifier": "JFK",
    "name": "JOHN F KENNEDY INTL",
    "city": "NEW YORK",
    "state": "NY",
    "latitude": 40.6399,
    "longitude": -73.7787,
    "elevation": 13,
    "magneticVariation": "13W",
    "fuelTypes": "A, A+"
  }
]`}
        </pre>
      </section>

      {/* Endpoint: Get specific airport */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/airports/{'{icaoCodeOrIdent}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get a specific airport by ICAO code or FAA identifier.
        </p>

        <h3 className="text-lg font-semibold">Path Parameters</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Parameter</th>
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">
                <code>icaoCodeOrIdent</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                ICAO code (e.g., KJFK) or FAA identifier (e.g., JFK)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airports/KJFK`}
        </pre>
      </section>

      {/* Endpoint: Get airports by state */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/airports/state/{'{stateCode}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get all airports in a given state.
        </p>

        <h3 className="text-lg font-semibold">Path Parameters</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Parameter</th>
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">
                <code>stateCode</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Two-letter state code (e.g., NY, CA)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airports/state/NY`}
        </pre>
      </section>

      {/* Endpoint: Batch get airports */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/airports/batch/{'{icaoCodesOrIdents}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get multiple airports in a single request using comma-separated ICAO
          codes or FAA identifiers.
        </p>

        <h3 className="text-lg font-semibold">Path Parameters</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Parameter</th>
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">
                <code>icaoCodesOrIdents</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Comma-separated ICAO codes or FAA identifiers (e.g.,
                KJFK,KLGA,KEWR)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airports/batch/KJFK,KLGA,KEWR`}
        </pre>
      </section>

      {/* Endpoint: Get airports by prefix */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/airports/prefix/{'{prefix}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get all airports whose ICAO code or FAA identifier starts with the
          given prefix.
        </p>

        <h3 className="text-lg font-semibold">Path Parameters</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Parameter</th>
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">
                <code>prefix</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                ICAO or identifier prefix (e.g., KJF)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airports/prefix/KJF`}
        </pre>
      </section>
    </div>
  )
}
