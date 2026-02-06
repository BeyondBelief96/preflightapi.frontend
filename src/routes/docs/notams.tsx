import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/notams')({
  component: NotamsDocs,
})

function NotamsDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">NOTAMs</h1>
          <TierBadge tier="starter" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve Notices to Air Missions (NOTAMs) for airports, geographic
          areas, or along a flight route. NOTAMs contain critical information
          about temporary changes to airspace, facilities, services, or
          procedures.
        </p>
      </div>

      {/* Endpoint: Get NOTAMs by ICAO */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/notams/{'{icaoCodeOrIdent}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get all active NOTAMs for a specific airport by ICAO code or FAA
          identifier.
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
  ${GATEWAY_URL}/api/v1/notams/KJFK`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "notamId": "A0001/25",
    "facilityId": "JFK",
    "icaoId": "KJFK",
    "notamText": "RWY 04R/22L CLSD FOR MAINTENANCE 2501051800-2501052200",
    "classification": "FDC",
    "effectiveStart": "2025-01-05T18:00:00Z",
    "effectiveEnd": "2025-01-05T22:00:00Z",
    "issueTime": "2025-01-04T12:00:00Z",
    "latitude": 40.6399,
    "longitude": -73.7787,
    "affectedFacility": "RWY 04R/22L"
  },
  {
    "notamId": "A0002/25",
    "facilityId": "JFK",
    "icaoId": "KJFK",
    "notamText": "TWY A BTN TWY B AND TWY C CLSD 2501061400-2501071400",
    "classification": "NOTAM",
    "effectiveStart": "2025-01-06T14:00:00Z",
    "effectiveEnd": "2025-01-07T14:00:00Z",
    "issueTime": "2025-01-04T16:00:00Z",
    "latitude": 40.6399,
    "longitude": -73.7787,
    "affectedFacility": "TWY A"
  }
]`}
        </pre>
      </section>

      {/* Endpoint: Get NOTAMs by radius */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/notams/radius</code>
        </div>
        <p className="text-muted-foreground">
          Get all NOTAMs within a radius of a geographic point.
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
            {[
              ['latitude', 'number', 'Center latitude in decimal degrees'],
              ['longitude', 'number', 'Center longitude in decimal degrees'],
              ['radiusNm', 'number', 'Search radius in nautical miles'],
            ].map(([param, type, desc]) => (
              <tr key={param} className="border-b">
                <td className="py-2">
                  <code>{param}</code>
                </td>
                <td className="py-2 text-muted-foreground">{type}</td>
                <td className="py-2 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  "${GATEWAY_URL}/api/v1/notams/radius?latitude=40.6399&longitude=-73.7787&radiusNm=25"`}
        </pre>
      </section>

      {/* Endpoint: NOTAMs for route */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            POST
          </Badge>
          <code className="text-sm font-semibold">/api/notams/route</code>
        </div>
        <p className="text-muted-foreground">
          Get NOTAMs along a flight route. Retrieves NOTAMs for departure,
          destination, and en-route points.
        </p>

        <h3 className="text-lg font-semibold">Request Body</h3>
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
              ['departure', 'string', 'Departure airport ICAO code or identifier'],
              ['destination', 'string', 'Destination airport ICAO code or identifier'],
              ['waypoints', 'string[]', 'Optional intermediate waypoints'],
              ['corridorWidthNm', 'number', 'Route corridor width in nautical miles (optional)'],
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

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -X POST -H "Ocp-Apim-Subscription-Key: your-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "departure": "KJFK",
    "destination": "KBOS",
    "waypoints": ["KBDR"],
    "corridorWidthNm": 10
  }' \\
  ${GATEWAY_URL}/api/v1/notams/route`}
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
              ['notamId', 'string', 'Unique NOTAM identifier'],
              ['facilityId', 'string', 'FAA facility identifier'],
              ['icaoId', 'string | null', 'ICAO identifier for the location'],
              ['notamText', 'string', 'Full NOTAM text'],
              ['classification', 'string', 'NOTAM classification (e.g., NOTAM, FDC, TFR)'],
              ['effectiveStart', 'string', 'ISO 8601 start of effective period'],
              ['effectiveEnd', 'string | null', 'ISO 8601 end of effective period (null if permanent)'],
              ['issueTime', 'string', 'ISO 8601 timestamp when the NOTAM was issued'],
              ['latitude', 'number | null', 'Latitude in decimal degrees'],
              ['longitude', 'number | null', 'Longitude in decimal degrees'],
              ['affectedFacility', 'string | null', 'Description of affected facility or area'],
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
