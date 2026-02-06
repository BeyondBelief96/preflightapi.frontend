import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/airports/runways')({
  component: RunwaysDocs,
})

function RunwaysDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Runways</h1>
          <TierBadge tier="free" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve runway information for airports including dimensions, surface
          type, lighting, and individual runway end details such as approach
          types and displaced thresholds.
        </p>
      </div>

      {/* Endpoint: Get runways */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airports/{'{icaoCodeOrIdent}'}/runways</code>
        </div>
        <p className="text-muted-foreground">
          Get all runways and runway end details for a specific airport.
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
  ${GATEWAY_URL}/api/v1/airports/KJFK/runways`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "length": 14511,
    "width": 200,
    "surfaceType": "ASPH-CONC",
    "surfaceCondition": "GOOD",
    "runwayEnds": [
      {
        "designation": "04L",
        "trueHeading": 42.3,
        "elevationFeet": 12.8,
        "displacedThresholdFeet": 1017,
        "approachType": "ILS/DME",
        "lighting": "HIRL",
        "latitude": 40.6253,
        "longitude": -73.7920
      },
      {
        "designation": "22R",
        "trueHeading": 222.3,
        "elevationFeet": 13.0,
        "displacedThresholdFeet": null,
        "approachType": "ILS",
        "lighting": "HIRL",
        "latitude": 40.6545,
        "longitude": -73.7654
      }
    ]
  }
]`}
        </pre>
      </section>

      {/* Runway response fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Runway Fields</h2>
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
              ['length', 'number', 'Runway length in feet'],
              ['width', 'number', 'Runway width in feet'],
              ['surfaceType', 'string | null', 'Surface material (e.g., ASPH, CONC, TURF)'],
              ['surfaceCondition', 'string | null', 'Surface condition (e.g., GOOD, FAIR, POOR)'],
              ['runwayEnds', 'RunwayEnd[]', 'Array of runway end objects (typically 2)'],
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

      {/* Runway end fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Runway End Fields</h2>
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
              ['designation', 'string', 'Runway end designator (e.g., 04L, 22R)'],
              ['trueHeading', 'number | null', 'True heading in degrees'],
              ['elevationFeet', 'number | null', 'Runway end elevation in feet MSL'],
              ['displacedThresholdFeet', 'number | null', 'Displaced threshold distance in feet'],
              ['approachType', 'string | null', 'Instrument approach type (e.g., ILS, RNAV, VOR)'],
              ['lighting', 'string | null', 'Runway edge lighting type (e.g., HIRL, MIRL, LIRL)'],
              ['latitude', 'number | null', 'Runway end latitude in decimal degrees'],
              ['longitude', 'number | null', 'Runway end longitude in decimal degrees'],
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
