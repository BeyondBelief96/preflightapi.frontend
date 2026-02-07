import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/performance/calculator')({
  component: PerformanceCalculatorDocs,
})

function PerformanceCalculatorDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Performance Calculator</h1>
          <TierBadge tier="professional" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Calculate crosswind components and density altitude for flight
          planning. Supports both automatic calculations using current METAR
          data and manual calculations with user-provided values.
        </p>
      </div>

      {/* Endpoint: Crosswind from METAR */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/performance/crosswind/{'{icaoCodeOrIdent}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Calculate the crosswind and headwind/tailwind components for each
          runway at an airport using the current METAR wind data.
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
  ${GATEWAY_URL}/api/v1/performance/crosswind/KJFK`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "stationId": "KJFK",
  "windDirection": 220,
  "windSpeed": 12,
  "windGust": null,
  "runways": [
    {
      "runwayEnd": "22L",
      "runwayHeading": 222,
      "crosswindComponent": 0.4,
      "headwindComponent": 12.0,
      "crosswindDirection": "LEFT",
      "gustCrosswindComponent": null,
      "gustHeadwindComponent": null
    },
    {
      "runwayEnd": "04R",
      "runwayHeading": 42,
      "crosswindComponent": 0.4,
      "headwindComponent": -12.0,
      "crosswindDirection": "RIGHT",
      "gustCrosswindComponent": null,
      "gustHeadwindComponent": null
    },
    {
      "runwayEnd": "13L",
      "runwayHeading": 132,
      "crosswindComponent": 9.2,
      "headwindComponent": -7.7,
      "crosswindDirection": "LEFT",
      "gustCrosswindComponent": null,
      "gustHeadwindComponent": null
    },
    {
      "runwayEnd": "31R",
      "runwayHeading": 312,
      "crosswindComponent": 9.2,
      "headwindComponent": 7.7,
      "crosswindDirection": "RIGHT",
      "gustCrosswindComponent": null,
      "gustHeadwindComponent": null
    }
  ]
}`}
        </pre>
      </section>

      {/* Endpoint: Manual crosswind */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            POST
          </Badge>
          <code className="text-sm font-semibold">
            /api/performance/crosswind/calculate
          </code>
        </div>
        <p className="text-muted-foreground">
          Calculate crosswind and headwind/tailwind components with
          manually-provided wind and runway heading values.
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
              ['windDirection', 'number', 'Wind direction in degrees (0-360)'],
              ['windSpeed', 'number', 'Wind speed in knots'],
              [
                'windGust',
                'number | null',
                'Wind gust speed in knots (optional)',
              ],
              ['runwayHeading', 'number', 'Runway heading in degrees (0-360)'],
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
    "windDirection": 270,
    "windSpeed": 15,
    "windGust": 22,
    "runwayHeading": 240
  }' \\
  ${GATEWAY_URL}/api/v1/performance/crosswind/calculate`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "crosswindComponent": 7.5,
  "headwindComponent": 13.0,
  "crosswindDirection": "RIGHT",
  "gustCrosswindComponent": 11.0,
  "gustHeadwindComponent": 19.1
}`}
        </pre>
      </section>

      {/* Endpoint: Density altitude from METAR */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/performance/density-altitude/{'{icaoCodeOrIdent}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Calculate the density altitude at an airport using current METAR data
          (temperature and altimeter setting) and airport field elevation.
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
                ICAO code (e.g., KDEN) or FAA identifier (e.g., DEN)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/performance/density-altitude/KDEN`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "stationId": "KDEN",
  "fieldElevation": 5431,
  "temperature": 30,
  "dewpoint": 12,
  "altimeter": 29.92,
  "pressureAltitude": 5431,
  "densityAltitude": 7845,
  "standardTemperature": 4.3,
  "temperatureDeviation": 25.7
}`}
        </pre>
      </section>

      {/* Endpoint: Manual density altitude */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            POST
          </Badge>
          <code className="text-sm font-semibold">
            /api/performance/density-altitude/calculate
          </code>
        </div>
        <p className="text-muted-foreground">
          Calculate density altitude with manually-provided values for
          elevation, temperature, and altimeter setting.
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
                'fieldElevation',
                'number',
                'Airport field elevation in feet MSL',
              ],
              ['temperature', 'number', 'Outside air temperature in Celsius'],
              [
                'altimeter',
                'number',
                'Altimeter setting in inches of mercury (inHg)',
              ],
              [
                'dewpoint',
                'number | null',
                'Dewpoint in Celsius (optional, improves accuracy)',
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
    "fieldElevation": 5431,
    "temperature": 35,
    "altimeter": 29.82,
    "dewpoint": 15
  }' \\
  ${GATEWAY_URL}/api/v1/performance/density-altitude/calculate`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "fieldElevation": 5431,
  "temperature": 35,
  "dewpoint": 15,
  "altimeter": 29.82,
  "pressureAltitude": 5525,
  "densityAltitude": 8632,
  "standardTemperature": 4.1,
  "temperatureDeviation": 30.9
}`}
        </pre>
      </section>

      {/* Crosswind response fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Crosswind Response Fields</h2>
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
              ['crosswindComponent', 'number', 'Crosswind component in knots'],
              [
                'headwindComponent',
                'number',
                'Headwind component in knots (negative = tailwind)',
              ],
              [
                'crosswindDirection',
                'string',
                'LEFT or RIGHT relative to runway heading',
              ],
              [
                'gustCrosswindComponent',
                'number | null',
                'Gust crosswind component in knots',
              ],
              [
                'gustHeadwindComponent',
                'number | null',
                'Gust headwind component in knots',
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

      {/* Density altitude response fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Density Altitude Response Fields
        </h2>
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
                'stationId',
                'string',
                'ICAO station identifier (METAR-based only)',
              ],
              [
                'fieldElevation',
                'number',
                'Airport field elevation in feet MSL',
              ],
              ['temperature', 'number', 'Temperature in Celsius'],
              ['dewpoint', 'number | null', 'Dewpoint in Celsius'],
              ['altimeter', 'number', 'Altimeter setting in inHg'],
              ['pressureAltitude', 'number', 'Pressure altitude in feet'],
              [
                'densityAltitude',
                'number',
                'Calculated density altitude in feet',
              ],
              [
                'standardTemperature',
                'number',
                'ISA standard temperature at the field elevation in Celsius',
              ],
              [
                'temperatureDeviation',
                'number',
                'Deviation from standard temperature in Celsius',
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
