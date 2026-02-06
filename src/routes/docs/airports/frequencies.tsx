import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/airports/frequencies')({
  component: FrequenciesDocs,
})

function FrequenciesDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Communication Frequencies</h1>
          <TierBadge tier="free" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve communication frequencies for airports and facilities
          including ATIS, tower, ground, approach, departure, CTAF, and other
          ATC frequencies.
        </p>
      </div>

      {/* Endpoint: Get frequencies */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/communication-frequencies/{'{servicedFacility}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get all communication frequencies for a specific facility by its ICAO
          code or FAA identifier.
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
                <code>servicedFacility</code>
              </td>
              <td className="py-2 text-muted-foreground">string</td>
              <td className="py-2 text-muted-foreground">
                ICAO code (e.g., KJFK) or FAA identifier (e.g., JFK) of the
                facility being serviced
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-lg font-semibold">Example Request</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`curl -H "Ocp-Apim-Subscription-Key: your-key" \\
  ${GATEWAY_URL}/api/v1/communication-frequencies/KJFK`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "frequencyType": "ATIS",
    "frequency": "128.725",
    "frequencyName": "ATIS",
    "servicedFacility": "JFK",
    "chartingCode": "ATIS",
    "narrative": "ATIS"
  },
  {
    "frequencyType": "TWR",
    "frequency": "119.100",
    "frequencyName": "LC",
    "servicedFacility": "JFK",
    "chartingCode": "TWR",
    "narrative": "TOWER"
  },
  {
    "frequencyType": "GND",
    "frequency": "121.900",
    "frequencyName": "GC",
    "servicedFacility": "JFK",
    "chartingCode": "GND CON",
    "narrative": "GROUND CONTROL"
  },
  {
    "frequencyType": "CD",
    "frequency": "135.050",
    "frequencyName": "CD",
    "servicedFacility": "JFK",
    "chartingCode": "CLNC DEL",
    "narrative": "CLEARANCE DELIVERY"
  },
  {
    "frequencyType": "APP",
    "frequency": "132.400",
    "frequencyName": "NY APP",
    "servicedFacility": "JFK",
    "chartingCode": "APP CON",
    "narrative": "NEW YORK APPROACH"
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
              ['frequencyType', 'string', 'Type code (e.g., ATIS, TWR, GND, APP, DEP, CD, CTAF)'],
              ['frequency', 'string', 'Frequency in MHz (e.g., "128.725")'],
              ['frequencyName', 'string', 'Name or callsign for the frequency'],
              ['servicedFacility', 'string', 'FAA identifier of the facility being serviced'],
              ['chartingCode', 'string | null', 'Chart abbreviation (e.g., TWR, GND CON, CLNC DEL)'],
              ['narrative', 'string | null', 'Description or narrative for the frequency'],
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

      {/* Common frequency types */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Common Frequency Types</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['ATIS', 'Automatic Terminal Information Service'],
              ['TWR', 'Airport control tower'],
              ['GND', 'Ground control'],
              ['CD', 'Clearance delivery'],
              ['APP', 'Approach control'],
              ['DEP', 'Departure control'],
              ['CTAF', 'Common Traffic Advisory Frequency'],
              ['UNICOM', 'Universal communications (non-towered airports)'],
              ['MULTICOM', 'Multicom frequency (no ground station)'],
            ].map(([type, desc]) => (
              <tr key={type} className="border-b">
                <td className="py-2">
                  <code>{type}</code>
                </td>
                <td className="py-2 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
