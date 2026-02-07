import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/airports/details')({
  component: AirportDetailsDocs,
})

function AirportDetailsDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Airport Details</h1>
          <TierBadge tier="free" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Detailed information about the airport data returned by the airports
          API. This page covers all fields available in the airport detail
          response object.
        </p>
      </div>

      {/* Endpoint reference */}
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
          Returns the full detail record for a specific airport.
        </p>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airports/KJFK`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
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
}`}
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
              [
                'siteNumber',
                'string',
                'FAA site number - unique identifier in the NASR database',
              ],
              [
                'icaoId',
                'string | null',
                'ICAO identifier (e.g., KJFK). May be null for smaller airports.',
              ],
              [
                'faaIdentifier',
                'string',
                'FAA location identifier (e.g., JFK)',
              ],
              ['name', 'string', 'Official airport name'],
              ['city', 'string', 'City the airport is associated with'],
              ['state', 'string', 'Two-letter state code (e.g., NY)'],
              [
                'latitude',
                'number',
                'Airport reference point latitude in decimal degrees',
              ],
              [
                'longitude',
                'number',
                'Airport reference point longitude in decimal degrees',
              ],
              ['elevation', 'number', 'Airport field elevation in feet MSL'],
              [
                'magneticVariation',
                'string | null',
                'Magnetic variation and direction (e.g., "13W" for 13 degrees west)',
              ],
              [
                'fuelTypes',
                'string | null',
                'Available fuel types (e.g., "A, A+" for Jet A and Jet A+)',
              ],
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

      {/* Fuel types reference */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Common Fuel Types</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Code</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['100LL', 'Aviation gasoline, low lead (piston aircraft)'],
              ['A', 'Jet A fuel (turbine aircraft)'],
              ['A+', 'Jet A+ fuel with anti-icing additive'],
              ['A1', 'Jet A-1 fuel (lower freezing point)'],
              ['MOGAS', 'Automotive gasoline approved for aviation use'],
            ].map(([code, desc]) => (
              <tr key={code} className="border-b">
                <td className="py-2">
                  <code>{code}</code>
                </td>
                <td className="py-2 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
