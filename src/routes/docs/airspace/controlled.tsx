import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/airspace/controlled')({
  component: ControlledAirspaceDocs,
})

function ControlledAirspaceDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Controlled Airspace</h1>
          <TierBadge tier="starter" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve controlled airspace boundary data (Classes A, B, C, D, and E).
          Query by airspace class, city, state, or ICAO/FAA identifier.
        </p>
      </div>

      {/* Endpoint: By classes */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airspaces/by-classes?classes={'{classes}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get controlled airspaces filtered by one or more airspace classes.
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
                <code>classes</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Comma-separated airspace classes (e.g., B,C,D)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  "${GATEWAY_URL}/api/v1/airspaces/by-classes?classes=B,C"`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "name": "NEW YORK CLASS B",
    "airspaceClass": "B",
    "city": "NEW YORK",
    "state": "NY",
    "icaoId": "KJFK",
    "lowerAltitude": 0,
    "upperAltitude": 7000,
    "boundary": [
      { "latitude": 40.85, "longitude": -74.15 },
      { "latitude": 40.85, "longitude": -73.55 },
      { "latitude": 40.45, "longitude": -73.55 },
      { "latitude": 40.45, "longitude": -74.15 }
    ]
  }
]`}
        </pre>
      </section>

      {/* Endpoint: By cities */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airspaces/by-cities?cities={'{cities}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get controlled airspaces filtered by one or more city names.
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
                <code>cities</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Comma-separated city names (e.g., NEW YORK,LOS ANGELES)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  "${GATEWAY_URL}/api/v1/airspaces/by-cities?cities=NEW YORK"`}
        </pre>
      </section>

      {/* Endpoint: By states */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airspaces/by-states?states={'{states}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get controlled airspaces filtered by one or more state codes.
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
                <code>states</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Comma-separated two-letter state codes (e.g., NY,NJ,CT)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  "${GATEWAY_URL}/api/v1/airspaces/by-states?states=NY,NJ"`}
        </pre>
      </section>

      {/* Endpoint: By ICAO or idents */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airspaces/by-icao-or-idents?icaoOrIdents={'{icaoOrIdents}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get controlled airspaces associated with specific airports by ICAO
          code or FAA identifier.
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
                <code>icaoOrIdents</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Comma-separated ICAO codes or FAA identifiers (e.g.,
                KJFK,KLGA)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  "${GATEWAY_URL}/api/v1/airspaces/by-icao-or-idents?icaoOrIdents=KJFK,KLGA"`}
        </pre>
      </section>

      {/* Response fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Response Fields</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Field</th>
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['name', 'string', 'Airspace name'],
              ['airspaceClass', 'string', 'Airspace class: A, B, C, D, or E'],
              ['city', 'string | null', 'Associated city'],
              ['state', 'string | null', 'Two-letter state code'],
              ['icaoId', 'string | null', 'Associated ICAO identifier'],
              ['lowerAltitude', 'number', 'Lower altitude limit in feet MSL'],
              ['upperAltitude', 'number', 'Upper altitude limit in feet MSL'],
              ['boundary', 'Coordinate[]', 'Array of lat/lon points defining the airspace boundary'],
            ].map(([field, type, desc]) => (
              <tr key={field} className="border-b">
                <td className="py-2">
                  <code>{field}</code>
                </td>
                <td className="py-2 text-muted-foreground">{type}</td>
                <td className="py-2 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
