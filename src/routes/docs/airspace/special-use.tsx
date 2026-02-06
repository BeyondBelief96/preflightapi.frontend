import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/airspace/special-use')({
  component: SpecialUseAirspaceDocs,
})

function SpecialUseAirspaceDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Special Use Airspace</h1>
          <TierBadge tier="starter" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve Special Use Airspace (SUA) data including Prohibited Areas,
          Restricted Areas, Military Operations Areas (MOAs), Warning Areas,
          Alert Areas, and other designated airspace. Query by type code or
          global ID.
        </p>
      </div>

      {/* Endpoint: By type codes */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airspaces/special-use/by-type-codes?typeCodes={'{typeCodes}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get special use airspaces filtered by one or more type codes.
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
                <code>typeCodes</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Comma-separated type codes (e.g., R,P,MOA,W,A)
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  "${GATEWAY_URL}/api/v1/airspaces/special-use/by-type-codes?typeCodes=R,MOA"`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "globalId": "SUA-R4001",
    "name": "R-4001 LAKEHURST",
    "typeCode": "R",
    "lowerAltitude": 0,
    "upperAltitude": 3500,
    "controllingAgency": "ZNY ARTCC",
    "schedulingAgency": "JOINT BASE MDL",
    "hoursOfOperation": "CONTINUOUS",
    "boundary": [
      { "latitude": 40.05, "longitude": -74.35 },
      { "latitude": 40.05, "longitude": -74.25 },
      { "latitude": 39.95, "longitude": -74.25 },
      { "latitude": 39.95, "longitude": -74.35 }
    ]
  },
  {
    "globalId": "SUA-MOA-DEMO",
    "name": "DEMO MOA",
    "typeCode": "MOA",
    "lowerAltitude": 5000,
    "upperAltitude": 17999,
    "controllingAgency": "ZNY ARTCC",
    "schedulingAgency": null,
    "hoursOfOperation": "BY NOTAM",
    "boundary": [
      { "latitude": 41.20, "longitude": -75.00 },
      { "latitude": 41.20, "longitude": -74.50 },
      { "latitude": 40.80, "longitude": -74.50 },
      { "latitude": 40.80, "longitude": -75.00 }
    ]
  }
]`}
        </pre>
      </section>

      {/* Endpoint: By global IDs */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airspaces/special-use/by-global-ids?globalIds={'{globalIds}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get specific special use airspaces by their global identifiers.
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
                <code>globalIds</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                Comma-separated global identifiers
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  "${GATEWAY_URL}/api/v1/airspaces/special-use/by-global-ids?globalIds=SUA-R4001,SUA-R4002"`}
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
              ['globalId', 'string', 'Unique global identifier for the SUA'],
              ['name', 'string', 'Name of the special use airspace'],
              ['typeCode', 'string', 'Type code: R (restricted), P (prohibited), MOA, W (warning), A (alert)'],
              ['lowerAltitude', 'number', 'Lower altitude limit in feet MSL'],
              ['upperAltitude', 'number', 'Upper altitude limit in feet MSL'],
              ['controllingAgency', 'string | null', 'ATC facility controlling the airspace'],
              ['schedulingAgency', 'string | null', 'Agency responsible for scheduling use'],
              ['hoursOfOperation', 'string | null', 'Operating schedule (e.g., CONTINUOUS, BY NOTAM)'],
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

      {/* Type codes reference */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Type Codes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Code</th>
              <th className="py-2 text-left font-medium">Name</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['P', 'Prohibited', 'Flight is prohibited under all circumstances'],
              ['R', 'Restricted', 'Flight restricted during active times; hazardous activities'],
              ['MOA', 'Military Operations Area', 'Military training and operations; VFR flight permitted'],
              ['W', 'Warning', 'Similar to restricted but extends into international waters'],
              ['A', 'Alert', 'High volume of pilot training or unusual aerial activity'],
            ].map(([code, name, desc]) => (
              <tr key={code} className="border-b">
                <td className="py-2">
                  <code>{code}</code>
                </td>
                <td className="py-2">{name}</td>
                <td className="py-2 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
