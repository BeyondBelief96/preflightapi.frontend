import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'

const endpoints = [
  {
    id: 'metar',
    label: 'METAR',
    method: 'GET',
    path: '/api/v1/metars/KJFK',
    description: 'Get current weather observation for an airport',
    response: `{
  "id": 42861,
  "rawText": "KJFK 051856Z 22012KT 10SM FEW250 18/06 A3012",
  "stationId": "KJFK",
  "observationTime": "2025-01-05T18:56:00Z",
  "tempC": 18.0,
  "dewpointC": 6.0,
  "windDirDegrees": 220,
  "windSpeedKt": 12,
  "visibilityStatuteMi": 10.0,
  "altimInHg": 30.12,
  "flightCategory": "VFR",
  "skyCondition": [
    { "skyCover": "FEW", "cloudBaseFtAgl": 25000 }
  ]
}`,
  },
  {
    id: 'airport',
    label: 'Airport',
    method: 'GET',
    path: '/api/v1/airports/KLAX',
    description: 'Get detailed airport information',
    response: `{
  "arptId": "LAX",
  "arptName": "LOS ANGELES INTL",
  "icaoId": "KLAX",
  "stateCode": "CA",
  "latDecimal": 33.9425,
  "longDecimal": -118.4081,
  "elev": 128,
  "fuelTypes": "100LL,JET-A",
  "ctrlTowerCode": "Y",
  "arptTypeCode": "A"
}`,
  },
  {
    id: 'notam',
    label: 'NOTAMs',
    method: 'GET',
    path: '/api/v1/notams/KORD',
    description: 'Get active NOTAMs for an airport',
    response: `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "coreNOTAMData": {
          "notamNumber": "A0012/25",
          "facilityDesignator": "KORD",
          "text": "RWY 10L/28R CLSD FOR MAINT",
          "effectiveStart": "2025-01-05T06:00:00Z",
          "effectiveEnd": "2025-01-12T06:00:00Z",
          "classification": "AERODROME"
        }
      }
    }
  ]
}`,
  },
  {
    id: 'navlog',
    label: 'Nav Log',
    method: 'POST',
    path: '/api/v1/navlog/calculate',
    description: 'Calculate a navigation log for a flight route',
    response: `{
  "totalDistanceNm": 214.5,
  "totalTimeEnRoute": "1:42",
  "fuelRequired": 18.6,
  "legs": [
    {
      "from": "KJFK",
      "to": "BDR",
      "trueCourse": 45,
      "magneticCourse": 58,
      "distanceNm": 58.2,
      "groundSpeedKt": 126,
      "legTimeMin": 27.7
    }
  ]
}`,
  },
]

export function EndpointShowcase() {
  const [activeEndpoint, setActiveEndpoint] = useState(endpoints[0])
  const [highlightedResponses, setHighlightedResponses] = useState<
    Record<string, string>
  >({})

  useEffect(() => {
    endpoints.forEach((endpoint) => {
      codeToHtml(endpoint.response, {
        lang: 'json',
        theme: 'github-dark',
      }).then((html) => {
        setHighlightedResponses((prev) => ({ ...prev, [endpoint.id]: html }))
      })
    })
  }, [])

  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Intuitive API
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Clean RESTful endpoints with predictable JSON responses. Get started
            in minutes.
          </p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Endpoint selector */}
          <div className="space-y-2 lg:col-span-2">
            {endpoints.map((endpoint) => (
              <button
                key={endpoint.id}
                type="button"
                onClick={() => setActiveEndpoint(endpoint)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  activeEndpoint.id === endpoint.id
                    ? 'border-accent bg-accent/10'
                    : 'hover:border-accent/30 hover:bg-accent/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-mono font-semibold ${
                      endpoint.method === 'GET'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <span className="text-sm font-medium">{endpoint.label}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {endpoint.description}
                </p>
              </button>
            ))}
          </div>

          {/* Response preview */}
          <div className="min-w-0 lg:col-span-3">
            <div className="overflow-hidden rounded-xl border bg-aviation-dark shadow-lg">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-mono font-semibold ${
                    activeEndpoint.method === 'GET'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {activeEndpoint.method}
                </span>
                <code className="text-sm text-white/70">
                  {activeEndpoint.path}
                </code>
              </div>
              <div className="overflow-x-auto p-4 text-sm leading-relaxed [&_pre]:!bg-transparent [&_code]:!bg-transparent">
                {highlightedResponses[activeEndpoint.id] ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: highlightedResponses[activeEndpoint.id],
                    }}
                  />
                ) : (
                  <pre>
                    <code className="text-white/85">
                      {activeEndpoint.response}
                    </code>
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
