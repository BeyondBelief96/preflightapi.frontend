import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/navigation/obstacles')({
  component: ObstaclesDocs,
})

function ObstaclesDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Obstacles</h1>
          <TierBadge tier="starter" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve obstacle data from the FAA Digital Obstacle File. Query
          obstacles by geographic proximity, state, bounding box, or specific
          OAS number. Obstacles include towers, buildings, cranes, and other
          structures that may affect aviation safety.
        </p>
      </div>

      {/* Endpoint: Search obstacles */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/obstacles/search</code>
        </div>
        <p className="text-muted-foreground">
          Search for obstacles within a radius of a geographic point, optionally
          filtered by minimum height AGL.
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
              ['lat', 'number', 'Center latitude in decimal degrees'],
              ['lon', 'number', 'Center longitude in decimal degrees'],
              ['radiusNm', 'number', 'Search radius in nautical miles'],
              [
                'minHeightAgl',
                'number',
                'Minimum height AGL in feet (optional)',
              ],
              ['limit', 'number', 'Maximum number of results (optional)'],
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
  "${GATEWAY_URL}/api/v1/obstacles/search?lat=40.6399&lon=-73.7787&radiusNm=10&minHeightAgl=200&limit=25"`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "oasNumber": "01-000123",
    "type": "TOWER",
    "latitude": 40.6520,
    "longitude": -73.7600,
    "heightAgl": 350,
    "heightMsl": 363,
    "lighting": "R",
    "marking": "P",
    "horizontalAccuracy": 20,
    "verticalAccuracy": 3,
    "state": "NY",
    "city": "NEW YORK"
  }
]`}
        </pre>
      </section>

      {/* Endpoint: By state */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/obstacles/state/{'{stateCode}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get all obstacles in a given state.
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
  ${GATEWAY_URL}/api/v1/obstacles/state/NY`}
        </pre>
      </section>

      {/* Endpoint: By OAS number */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/obstacles/{'{oasNumber}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get a specific obstacle by its OAS (Obstruction Identification
          Surface) number.
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
                <code>oasNumber</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                OAS number (e.g., 01-000123)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/obstacles/01-000123`}
        </pre>
      </section>

      {/* Endpoint: Batch by OAS numbers */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            POST
          </Badge>
          <code className="text-sm font-semibold">
            /api/obstacles/by-oas-numbers
          </code>
        </div>
        <p className="text-muted-foreground">
          Get multiple obstacles by their OAS numbers in a single request.
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
            <tr className="border-b">
              <td className="py-2">
                <code>oasNumbers</code>
              </td>
              <td className="py-2 text-muted-foreground">string[]</td>
              <td className="py-2 text-muted-foreground">
                Array of OAS numbers
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -X POST -H "Ocp-Apim-Subscription-Key: your-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "oasNumbers": ["01-000123", "01-000456", "01-000789"]
  }' \\
  ${GATEWAY_URL}/api/v1/obstacles/by-oas-numbers`}
        </pre>
      </section>

      {/* Endpoint: By bounding box */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/obstacles/bbox</code>
        </div>
        <p className="text-muted-foreground">
          Get all obstacles within a geographic bounding box.
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
              ['minLat', 'number', 'Minimum latitude (south boundary)'],
              ['maxLat', 'number', 'Maximum latitude (north boundary)'],
              ['minLon', 'number', 'Minimum longitude (west boundary)'],
              ['maxLon', 'number', 'Maximum longitude (east boundary)'],
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
  "${GATEWAY_URL}/api/v1/obstacles/bbox?minLat=40.5&maxLat=40.8&minLon=-74.0&maxLon=-73.5"`}
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
              ['oasNumber', 'string', 'Unique OAS number identifier'],
              [
                'type',
                'string',
                'Obstacle type (e.g., TOWER, BLDG, STACK, CRANE, POLE)',
              ],
              ['latitude', 'number', 'Latitude in decimal degrees'],
              ['longitude', 'number', 'Longitude in decimal degrees'],
              ['heightAgl', 'number', 'Height above ground level in feet'],
              ['heightMsl', 'number', 'Height above mean sea level in feet'],
              [
                'lighting',
                'string | null',
                'Lighting code: R (red), D (dual), W (white), S (strobe), N (none)',
              ],
              [
                'marking',
                'string | null',
                'Marking code: P (painted), F (flag), N (none)',
              ],
              [
                'horizontalAccuracy',
                'number | null',
                'Horizontal position accuracy in feet',
              ],
              [
                'verticalAccuracy',
                'number | null',
                'Vertical position accuracy in feet',
              ],
              ['state', 'string', 'Two-letter state code'],
              ['city', 'string | null', 'Nearest city'],
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
