import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/airports/diagrams')({
  component: DiagramsDocs,
})

function DiagramsDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Airport Diagrams</h1>
          <TierBadge tier="professional" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve airport diagram PDFs. Returns pre-signed URLs that provide
          temporary access to download the airport diagram documents published
          by the FAA.
        </p>
      </div>

      {/* Endpoint: Get airport diagrams */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">/api/airport-diagrams/{'{icaoCodeOrIdent}'}</code>
        </div>
        <p className="text-muted-foreground">
          Get pre-signed URLs for airport diagram PDFs. The returned URLs are
          temporary and will expire after a set period.
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
  ${GATEWAY_URL}/api/v1/airport-diagrams/KJFK`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`[
  {
    "icaoId": "KJFK",
    "faaIdentifier": "JFK",
    "chartName": "AIRPORT DIAGRAM",
    "pdfUrl": "https://storage.preflightapi.com/diagrams/KJFK_APD.pdf?X-Amz-Expires=3600&...",
    "effectiveDate": "2025-01-02",
    "expirationDate": "2025-01-30"
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
              ['icaoId', 'string | null', 'ICAO identifier for the airport'],
              ['faaIdentifier', 'string', 'FAA location identifier'],
              ['chartName', 'string', 'Name of the diagram chart'],
              ['pdfUrl', 'string', 'Pre-signed URL to download the PDF (temporary)'],
              ['effectiveDate', 'string', 'Date the chart became effective (YYYY-MM-DD)'],
              ['expirationDate', 'string', 'Date the chart expires (YYYY-MM-DD)'],
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

      {/* Notes */}
      <section className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
        <h2 className="text-lg font-semibold">Important Notes</h2>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Pre-signed URLs are temporary and will expire. Do not cache or store
            them long-term.
          </li>
          <li>
            Not all airports have published airport diagrams. Smaller or private
            airports may return an empty array.
          </li>
          <li>
            Diagrams are sourced from the FAA and are updated on the standard
            56-day AIRAC cycle.
          </li>
        </ul>
      </section>
    </div>
  )
}
