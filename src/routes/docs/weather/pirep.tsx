import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/weather/pirep')({
  component: PirepDocs,
})

function PirepDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">PIREP</h1>
          <TierBadge tier="starter" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve Pilot Reports (PIREPs) containing real-time weather
          observations reported by pilots in flight. PIREPs include turbulence,
          icing, visibility, and other conditions encountered during flight.
        </p>
      </div>

      {/* Endpoint: Get all PIREPs */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/pireps</code>
        </div>
        <p className="text-muted-foreground">
          Get all current PIREPs. Returns both routine (UA) and urgent (UUA)
          pilot reports.
        </p>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/pireps`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "rawText": "KJFK UA /OV JFK090020/TM 1845/FL085/TP B738/SK BKN080/WX FV03SM HZ/TA 12/WV 21035KT/TB MOD/IC LGT RIME",
    "reportType": "UA",
    "location": {
      "latitude": 40.6399,
      "longitude": -73.5786
    },
    "observationTime": "2025-01-05T18:45:00Z",
    "altitude": 8500,
    "aircraftType": "B738",
    "turbulence": {
      "intensity": "MOD",
      "type": null,
      "frequency": null,
      "baseAltitude": null,
      "topAltitude": null
    },
    "icing": {
      "intensity": "LGT",
      "type": "RIME",
      "baseAltitude": null,
      "topAltitude": null
    },
    "visibility": 3,
    "temperature": 12,
    "wind": {
      "direction": 210,
      "speed": 35
    },
    "skyConditions": [
      {
        "skyCover": "BKN",
        "cloudBase": 8000
      }
    ]
  }
]`}
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
              ['rawText', 'string', 'Raw PIREP text'],
              ['reportType', 'string', 'Report type: UA (routine) or UUA (urgent)'],
              ['location', 'object', 'Latitude and longitude of the report'],
              ['observationTime', 'string', 'ISO 8601 observation timestamp'],
              ['altitude', 'number | null', 'Altitude in feet MSL'],
              ['aircraftType', 'string | null', 'ICAO aircraft type designator'],
              ['turbulence', 'Turbulence | null', 'Turbulence conditions encountered'],
              ['icing', 'Icing | null', 'Icing conditions encountered'],
              ['visibility', 'number | null', 'Flight visibility in statute miles'],
              ['temperature', 'number | null', 'Outside air temperature in Celsius'],
              ['wind', 'Wind | null', 'Wind direction and speed at altitude'],
              ['skyConditions', 'SkyCondition[]', 'Array of sky condition layers'],
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

      {/* Turbulence object fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Turbulence Object</h2>
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
              ['intensity', 'string | null', 'NEG, LGT, MOD, SEV, or EXTRM'],
              ['type', 'string | null', 'CAT (clear air) or CHOP'],
              ['frequency', 'string | null', 'OCNL, INTMT, or CONS'],
              ['baseAltitude', 'number | null', 'Base altitude in feet MSL'],
              ['topAltitude', 'number | null', 'Top altitude in feet MSL'],
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

      {/* Icing object fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Icing Object</h2>
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
              ['intensity', 'string | null', 'NEG, TRC (trace), LGT, MOD, SEV, or HVY'],
              ['type', 'string | null', 'RIME, CLR (clear), or MXD (mixed)'],
              ['baseAltitude', 'number | null', 'Base altitude in feet MSL'],
              ['topAltitude', 'number | null', 'Top altitude in feet MSL'],
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
