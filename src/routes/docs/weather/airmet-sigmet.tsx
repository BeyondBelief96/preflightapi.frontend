import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/weather/airmet-sigmet')({
  component: AirmetSigmetDocs,
})

function AirmetSigmetDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">AIRMET / SIGMET</h1>
          <TierBadge tier="starter" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve AIRMETs (Airmen's Meteorological Information) and SIGMETs
          (Significant Meteorological Information) that describe significant
          weather hazards affecting aviation. Includes convective SIGMETs for
          thunderstorm activity.
        </p>
      </div>

      {/* Endpoint: Get all AIRMETs/SIGMETs */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airsigmets</code>
        </div>
        <p className="text-muted-foreground">
          Get all current AIRMETs and SIGMETs.
        </p>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airsigmets`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "rawText": "SIGC 0S 051855 CONVECTIVE SIGMET 5C VALID UNTIL 2055 OH IN KY FROM 30NW CVG-40SE IND-30NW LEX AREA TS MOV FROM 25025KT TOPS ABV FL450",
    "airSigmetType": "SIGMET",
    "hazardType": "CONVECTIVE",
    "severity": null,
    "validTimeFrom": "2025-01-05T18:55:00Z",
    "validTimeTo": "2025-01-05T20:55:00Z",
    "minAltitude": null,
    "maxAltitude": 45000,
    "movementDirection": 250,
    "movementSpeed": 25,
    "area": [
      { "latitude": 39.45, "longitude": -84.85 },
      { "latitude": 39.20, "longitude": -85.70 },
      { "latitude": 38.30, "longitude": -84.60 }
    ]
  }
]`}
        </pre>
      </section>

      {/* Endpoint: Get by hazard type */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/airsigmets/hazard/{'{hazardType}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get AIRMETs/SIGMETs filtered by hazard type.
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
                <code>hazardType</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                One of: CONVECTIVE, ICE, TURB, IFR, MTN_OBSCN
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airsigmets/hazard/CONVECTIVE`}
        </pre>
      </section>

      {/* Shortcut endpoints */}
      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">Shortcut Endpoints</h2>
        <p className="text-muted-foreground">
          Convenience endpoints that return AIRMETs/SIGMETs for a specific
          hazard type without needing to specify the type as a path parameter.
        </p>

        <div className="space-y-3">
          {[
            [
              '/api/airsigmets/convective',
              'Convective SIGMETs (thunderstorms)',
            ],
            ['/api/airsigmets/ice', 'Icing AIRMETs and SIGMETs'],
            ['/api/airsigmets/turb', 'Turbulence AIRMETs and SIGMETs'],
            ['/api/airsigmets/ifr', 'IFR condition AIRMETs'],
            ['/api/airsigmets/mtn-obscn', 'Mountain obscuration AIRMETs'],
          ].map(([path, desc]) => (
            <div key={path} className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                GET
              </Badge>
              <code className="text-sm font-semibold">{path}</code>
              <span className="text-sm text-muted-foreground">- {desc}</span>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/airsigmets/turb`}
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
              ['rawText', 'string', 'Raw AIRMET/SIGMET text'],
              ['airSigmetType', 'string', 'AIRMET or SIGMET'],
              [
                'hazardType',
                'string',
                'CONVECTIVE, ICE, TURB, IFR, or MTN_OBSCN',
              ],
              ['severity', 'string | null', 'Severity level when applicable'],
              ['validTimeFrom', 'string', 'ISO 8601 start of validity period'],
              ['validTimeTo', 'string', 'ISO 8601 end of validity period'],
              [
                'minAltitude',
                'number | null',
                'Minimum affected altitude in feet MSL',
              ],
              [
                'maxAltitude',
                'number | null',
                'Maximum affected altitude in feet MSL',
              ],
              [
                'movementDirection',
                'number | null',
                'Movement direction in degrees',
              ],
              ['movementSpeed', 'number | null', 'Movement speed in knots'],
              [
                'area',
                'Coordinate[]',
                'Array of lat/lon points defining the affected area',
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
