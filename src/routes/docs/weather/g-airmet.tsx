import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/weather/g-airmet')({
  component: GAirmetDocs,
})

function GAirmetDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">G-AIRMET</h1>
          <TierBadge tier="starter" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve Graphical AIRMETs (G-AIRMETs) which provide a graphical
          representation of hazardous weather areas. G-AIRMETs are issued every
          3 hours and are organized by product type: SIERRA (IFR/mountain
          obscuration), TANGO (turbulence/low-level wind shear), and ZULU
          (icing/freezing level).
        </p>
      </div>

      {/* Endpoint: Get all G-AIRMETs */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/g-airmets</code>
        </div>
        <p className="text-muted-foreground">
          Get all current G-AIRMETs across all product types.
        </p>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/g-airmets`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "product": "TANGO",
    "hazardType": "TURB-LO",
    "severity": "MOD",
    "validTimeFrom": "2025-01-05T18:00:00Z",
    "validTimeTo": "2025-01-05T21:00:00Z",
    "minAltitude": 10000,
    "maxAltitude": 25000,
    "issueTime": "2025-01-05T15:00:00Z",
    "area": [
      { "latitude": 42.10, "longitude": -80.50 },
      { "latitude": 40.80, "longitude": -78.20 },
      { "latitude": 39.50, "longitude": -79.80 },
      { "latitude": 41.20, "longitude": -81.60 }
    ]
  }
]`}
        </pre>
      </section>

      {/* Endpoint: Get by product */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/g-airmets/{'{product}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get G-AIRMETs filtered by product type.
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
                <code>product</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                One of: SIERRA, TANGO, ZULU
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/g-airmets/ZULU`}
        </pre>
      </section>

      {/* Endpoint: Get by hazard type */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/g-airmets/hazard/{'{hazardType}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get G-AIRMETs filtered by specific hazard type.
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
                Hazard type such as TURB-LO, TURB-HI, ICE, FZLVL, IFR, MT_OBSC,
                SFC_WND, LLWS
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/g-airmets/hazard/ICE`}
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
              ['product', 'string', 'Product type: SIERRA, TANGO, or ZULU'],
              [
                'hazardType',
                'string',
                'Specific hazard type (e.g., TURB-LO, ICE, IFR)',
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
                'issueTime',
                'string',
                'ISO 8601 timestamp when the G-AIRMET was issued',
              ],
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
