import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/weather/taf')({
  component: TafDocs,
})

function TafDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">TAF</h1>
          <TierBadge tier="free" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve Terminal Aerodrome Forecasts (TAFs) for airports. TAFs
          provide weather forecasts for the immediate vicinity of an airport,
          typically covering a 24 to 30 hour period. Data is updated from NOAA.
        </p>
      </div>

      {/* Endpoint: Get TAF by ICAO */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/tafs/{'{icaoCodeOrIdent}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get the current TAF for a specific airport by ICAO code or FAA
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
  ${GATEWAY_URL}/api/v1/tafs/KJFK`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "stationId": "KJFK",
  "rawText": "TAF KJFK 051730Z 0518/0624 22015KT P6SM FEW250 FM052200 21010KT P6SM SCT200 FM060600 18008KT P6SM BKN080",
  "issueTime": "2025-01-05T17:30:00Z",
  "validTimeFrom": "2025-01-05T18:00:00Z",
  "validTimeTo": "2025-01-06T24:00:00Z",
  "forecasts": [
    {
      "forecastTimeFrom": "2025-01-05T18:00:00Z",
      "forecastTimeTo": "2025-01-05T22:00:00Z",
      "changeIndicator": null,
      "windDirection": 220,
      "windSpeed": 15,
      "windGust": null,
      "visibility": 6,
      "skyConditions": [
        {
          "skyCover": "FEW",
          "cloudBase": 25000
        }
      ]
    },
    {
      "forecastTimeFrom": "2025-01-05T22:00:00Z",
      "forecastTimeTo": "2025-01-06T06:00:00Z",
      "changeIndicator": "FM",
      "windDirection": 210,
      "windSpeed": 10,
      "windGust": null,
      "visibility": 6,
      "skyConditions": [
        {
          "skyCover": "SCT",
          "cloudBase": 20000
        }
      ]
    },
    {
      "forecastTimeFrom": "2025-01-06T06:00:00Z",
      "forecastTimeTo": "2025-01-06T24:00:00Z",
      "changeIndicator": "FM",
      "windDirection": 180,
      "windSpeed": 8,
      "windGust": null,
      "visibility": 6,
      "skyConditions": [
        {
          "skyCover": "BKN",
          "cloudBase": 8000
        }
      ]
    }
  ]
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
              ['stationId', 'string', 'ICAO station identifier'],
              ['rawText', 'string', 'Raw TAF text'],
              [
                'issueTime',
                'string',
                'ISO 8601 timestamp when the TAF was issued',
              ],
              [
                'validTimeFrom',
                'string',
                'ISO 8601 start of the TAF validity period',
              ],
              [
                'validTimeTo',
                'string',
                'ISO 8601 end of the TAF validity period',
              ],
              ['forecasts', 'Forecast[]', 'Array of forecast periods'],
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

      {/* Forecast object fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Forecast Object Fields</h2>
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
                'forecastTimeFrom',
                'string',
                'ISO 8601 start of this forecast period',
              ],
              [
                'forecastTimeTo',
                'string',
                'ISO 8601 end of this forecast period',
              ],
              [
                'changeIndicator',
                'string | null',
                'Change type: FM (from), TEMPO, BECMG, or PROB',
              ],
              ['windDirection', 'number | null', 'Wind direction in degrees'],
              ['windSpeed', 'number | null', 'Wind speed in knots'],
              ['windGust', 'number | null', 'Wind gust speed in knots'],
              ['visibility', 'number | null', 'Visibility in statute miles'],
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
