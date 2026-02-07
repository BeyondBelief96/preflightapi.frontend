import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { TierBadge } from '@/components/docs/tier-badge'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/docs/charts/supplements')({
  component: ChartSupplementsDocs,
})

function ChartSupplementsDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Chart Supplements</h1>
          <TierBadge tier="professional" />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Retrieve Chart Supplement (formerly Airport/Facility Directory) PDFs
          for airports. Returns a pre-signed URL that provides temporary access
          to download the chart supplement document containing detailed airport
          information, procedures, and facilities.
        </p>
      </div>

      {/* Endpoint: Get chart supplement */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            GET
          </Badge>
          <code className="text-sm font-semibold">
            /api/chart-supplements/{'{icaoCodeOrIdent}'}
          </code>
        </div>
        <p className="text-muted-foreground">
          Get a pre-signed URL for the chart supplement PDF for a specific
          airport. The returned URL is temporary and will expire after a set
          period.
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
  ${GATEWAY_URL}/api/v1/chart-supplements/KJFK`}
        </pre>

        <h3 className="text-lg font-semibold">Example Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "icaoId": "KJFK",
  "faaIdentifier": "JFK",
  "chartName": "NE-1 CHART SUPPLEMENT",
  "pdfUrl": "https://storage.preflightapi.com/supplements/KJFK_CS.pdf?X-Amz-Expires=3600&...",
  "effectiveDate": "2025-01-02",
  "expirationDate": "2025-02-27",
  "region": "NE-1"
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
              ['icaoId', 'string | null', 'ICAO identifier for the airport'],
              ['faaIdentifier', 'string', 'FAA location identifier'],
              [
                'chartName',
                'string',
                'Name of the chart supplement publication',
              ],
              [
                'pdfUrl',
                'string',
                'Pre-signed URL to download the PDF (temporary)',
              ],
              [
                'effectiveDate',
                'string',
                'Date the supplement became effective (YYYY-MM-DD)',
              ],
              [
                'expirationDate',
                'string',
                'Date the supplement expires (YYYY-MM-DD)',
              ],
              [
                'region',
                'string',
                'Chart supplement region (e.g., NE-1, SE-1, SW-1)',
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

      {/* Notes */}
      <section className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
        <h2 className="text-lg font-semibold">Important Notes</h2>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Pre-signed URLs are temporary and will expire. Do not cache or store
            them long-term.
          </li>
          <li>
            Chart supplements are published on a 56-day AIRAC cycle by the FAA.
          </li>
          <li>
            The chart supplement contains detailed information including airport
            remarks, services, runway details, airspace, and local procedures
            not found elsewhere.
          </li>
        </ul>
      </section>

      {/* Regions reference */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Chart Supplement Regions</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Region</th>
              <th className="py-2 text-left font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'NE-1',
                'Northeast (CT, DC, DE, MA, MD, ME, NH, NJ, NY, PA, RI, VA, VT, WV)',
              ],
              ['SE-1', 'Southeast (AL, FL, GA, KY, MS, NC, PR, SC, TN, VI)'],
              [
                'NC-1',
                'North Central (IA, IL, IN, MI, MN, MO, ND, NE, OH, SD, WI)',
              ],
              ['SC-1', 'South Central (AR, CO, KS, LA, NM, OK, TX)'],
              ['NW-1', 'Northwest (ID, MT, OR, WA, WY)'],
              ['SW-1', 'Southwest (AZ, CA, HI, NV, UT)'],
              ['AK-1', 'Alaska'],
              ['PAC', 'Pacific'],
            ].map(([region, coverage]) => (
              <tr key={region} className="border-b">
                <td className="py-2">
                  <code>{region}</code>
                </td>
                <td className="py-2 text-muted-foreground">{coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
