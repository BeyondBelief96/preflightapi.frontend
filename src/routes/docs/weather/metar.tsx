import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/weather/metar')({
  component: MetarDocs,
})

function MetarDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">METAR</h1>
          <TierBadge tier="free" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve current aviation weather observations (METARs) for airports.
          Data is updated every 10 minutes from NOAA.
        </p>
      </div>

      {/* Endpoint: Get METAR by ICAO */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/metars/{'{icaoCodeOrIdent}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get the current METAR for a specific airport by ICAO code or FAA
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
  ${GATEWAY_URL}/api/v1/metars/KJFK`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "stationId": "KJFK",
  "rawText": "KJFK 051856Z 22012KT 10SM FEW250 18/06 A3012",
  "observationTime": "2025-01-05T18:56:00Z",
  "temperature": 18,
  "dewpoint": 6,
  "windDirection": 220,
  "windSpeed": 12,
  "windGust": null,
  "visibility": 10,
  "altimeter": 30.12,
  "flightCategory": "VFR",
  "skyConditions": [
    {
      "skyCover": "FEW",
      "cloudBase": 25000
    }
  ]
}`}
        </pre>
      </section>

      {/* Endpoint: Get METARs by state */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/metars/state/{'{stateCode}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get all current METARs for airports in a given state.
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
  ${GATEWAY_URL}/api/v1/metars/state/NY`}
        </pre>
      </section>

      {/* Endpoint: Get METARs by multiple states */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/metars/states/{'{stateCodes}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get METARs for multiple states (comma-separated).
        </p>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/metars/states/NY,NJ,CT`}
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
              ['stationId', 'string', 'ICAO station identifier'],
              ['rawText', 'string', 'Raw METAR text'],
              ['observationTime', 'string', 'ISO 8601 observation timestamp'],
              ['temperature', 'number | null', 'Temperature in Celsius'],
              ['dewpoint', 'number | null', 'Dewpoint in Celsius'],
              ['windDirection', 'number | null', 'Wind direction in degrees'],
              ['windSpeed', 'number | null', 'Wind speed in knots'],
              ['windGust', 'number | null', 'Wind gust speed in knots'],
              ['visibility', 'number | null', 'Visibility in statute miles'],
              ['altimeter', 'number | null', 'Altimeter setting in inHg'],
              [
                'flightCategory',
                'string | null',
                'Flight category: VFR, MVFR, IFR, or LIFR',
              ],
              [
                'skyConditions',
                'SkyCondition[]',
                'Array of sky condition layers',
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
