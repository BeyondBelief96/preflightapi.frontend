import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/navigation/nav-log')({
  component: NavLogDocs,
})

function NavLogDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Navigation Log</h1>
          <TierBadge tier="professional" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Calculate full navigation logs with waypoints, bearing and distance
          between points, and retrieve winds aloft forecast data. These
          endpoints support VFR and IFR flight planning computations.
        </p>
      </div>

      {/* Endpoint: Calculate nav log */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            POST
          </Badge>
          <code className="text-sm font-semibold">/api/navlog/calculate</code>
        </div>
        <p className="text-muted-foreground">
          Calculate a full navigation log with waypoints, headings, distances,
          times, and fuel burn. Accounts for wind correction when winds aloft
          data is available.
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
              [
                'waypoints',
                'string[]',
                'Array of ICAO codes, identifiers, or lat/lon strings',
              ],
              ['altitude', 'number', 'Cruise altitude in feet MSL'],
              ['trueAirspeed', 'number', 'True airspeed in knots'],
              [
                'fuelBurnRate',
                'number | null',
                'Fuel burn rate in gallons per hour (optional)',
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

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -X POST -H "Ocp-Apim-Subscription-Key: your-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "waypoints": ["KJFK", "KBOS"],
    "altitude": 6000,
    "trueAirspeed": 120,
    "fuelBurnRate": 10
  }' \\
  ${GATEWAY_URL}/api/v1/navlog/calculate`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "totalDistanceNm": 187.3,
  "totalTimeMinutes": 99.8,
  "totalFuelGallons": 16.6,
  "legs": [
    {
      "from": "KJFK",
      "to": "KBOS",
      "trueCourse": 50.2,
      "magneticCourse": 63.2,
      "trueHeading": 47.8,
      "magneticHeading": 60.8,
      "distanceNm": 187.3,
      "groundSpeed": 112.5,
      "timeMinutes": 99.8,
      "fuelGallons": 16.6,
      "windDirection": 270,
      "windSpeed": 18
    }
  ]
}`}
        </pre>
      </section>

      {/* Endpoint: Bearing and distance */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            POST
          </Badge>
          <code className="text-sm font-semibold">
            /api/navlog/bearing-and-distance
          </code>
        </div>
        <p className="text-muted-foreground">
          Calculate the bearing and distance between two geographic points.
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
              [
                'from',
                'string',
                'Origin point - ICAO code, identifier, or "lat,lon"',
              ],
              [
                'to',
                'string',
                'Destination point - ICAO code, identifier, or "lat,lon"',
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

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -X POST -H "Ocp-Apim-Subscription-Key: your-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "KJFK",
    "to": "KLGA"
  }' \\
  ${GATEWAY_URL}/api/v1/navlog/bearing-and-distance`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "trueBearing": 32.5,
  "magneticBearing": 45.5,
  "distanceNm": 9.8,
  "distanceSm": 11.3,
  "distanceKm": 18.1
}`}
        </pre>
      </section>

      {/* Endpoint: Winds aloft */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/navlog/winds-aloft/{'{forecast}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get winds aloft forecast data. Available for 6, 12, and 24 hour
          forecast periods.
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
                <code>forecast</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Forecast period: 6, 12, or 24 (hours)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/navlog/winds-aloft/6`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "stationId": "JFK",
    "latitude": 40.6399,
    "longitude": -73.7787,
    "validTime": "2025-01-05T18:00:00Z",
    "altitudes": [
      {
        "altitude": 3000,
        "windDirection": 220,
        "windSpeed": 15,
        "temperature": 10
      },
      {
        "altitude": 6000,
        "windDirection": 240,
        "windSpeed": 25,
        "temperature": 2
      },
      {
        "altitude": 9000,
        "windDirection": 260,
        "windSpeed": 35,
        "temperature": -8
      }
    ]
  }
]`}
        </pre>
      </section>

      {/* Nav log leg response fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Nav Log Leg Fields</h2>
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
              ['from', 'string', 'Origin waypoint identifier'],
              ['to', 'string', 'Destination waypoint identifier'],
              ['trueCourse', 'number', 'True course in degrees'],
              ['magneticCourse', 'number', 'Magnetic course in degrees'],
              [
                'trueHeading',
                'number',
                'True heading with wind correction in degrees',
              ],
              [
                'magneticHeading',
                'number',
                'Magnetic heading with wind correction in degrees',
              ],
              ['distanceNm', 'number', 'Leg distance in nautical miles'],
              ['groundSpeed', 'number', 'Estimated ground speed in knots'],
              ['timeMinutes', 'number', 'Estimated leg time in minutes'],
              [
                'fuelGallons',
                'number | null',
                'Estimated fuel burn in gallons',
              ],
              [
                'windDirection',
                'number | null',
                'Wind direction at cruise altitude in degrees',
              ],
              [
                'windSpeed',
                'number | null',
                'Wind speed at cruise altitude in knots',
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
    </div>
  )
}
