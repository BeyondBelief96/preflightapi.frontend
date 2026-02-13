import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { API_BASE_PATH } from '@/lib/api-metadata'

const endpoints = [
  {
    id: 'metar',
    label: 'METAR',
    method: 'GET',
    path: `${API_BASE_PATH}/metars/KJFK`,
    description: 'Get current weather observation for an airport',
    response: `{
  "id": 42861,
  "rawText": "KJFK 051856Z 22012G18KT 10SM -RA FEW120 BKN250 18/06 A3012",
  "stationId": "KJFK",
  "observationTime": "2025-01-05T18:56:00Z",
  "latitude": 40.6399,
  "longitude": -73.7787,
  "tempC": 18.0,
  "dewpointC": 6.0,
  "windDirDegrees": "220",
  "windSpeedKt": 12,
  "windGustKt": 18,
  "visibilityStatuteMi": "10",
  "altimInHg": 30.12,
  "wxString": "-RA",
  "flightCategory": "VFR",
  "skyCondition": [
    { "skyCover": "FEW", "cloudBaseFtAgl": 12000 },
    { "skyCover": "BKN", "cloudBaseFtAgl": 25000 }
  ]
}`,
  },
  {
    id: 'airport',
    label: 'Airport',
    method: 'GET',
    path: `${API_BASE_PATH}/airports/KLAX`,
    description: 'Get detailed airport information',
    response: `{
  "siteNo": "02164.*A",
  "icaoId": "KLAX",
  "arptId": "LAX",
  "arptName": "LOS ANGELES INTL",
  "siteType": "Airport",
  "ownershipType": "PubliclyOwned",
  "city": "LOS ANGELES",
  "stateCode": "CA",
  "latDecimal": 33.9425,
  "longDecimal": -118.4081,
  "elev": 128,
  "tpa": 1128,
  "magVarn": 12.0,
  "fuelTypes": "100LL,JET-A",
  "chartName": "LOS ANGELES"
}`,
  },
  {
    id: 'notam',
    label: 'NOTAMs',
    method: 'GET',
    path: `${API_BASE_PATH}/notams/KORD`,
    description: 'Get active NOTAMs for an airport',
    response: `{
  "notams": [
    {
      "type": "Feature",
      "id": "1757609538792382",
      "geometry": {
        "type": "Point",
        "coordinates": [-87.9048, 41.9742]
      },
      "properties": {
        "coreNOTAMData": {
          "notam": {
            "number": "A0012/25",
            "type": "N",
            "issued": "2025-01-04T14:30:00Z",
            "icaoLocation": "KORD",
            "text": "RWY 10L/28R CLSD FOR MAINT",
            "effectiveStart": "2025-01-05T06:00:00Z",
            "effectiveEnd": "2025-01-12T06:00:00Z",
            "traffic": "IV",
            "scope": "A",
            "classification": "DOMESTIC"
          }
        }
      }
    }
  ],
  "totalCount": 47,
  "retrievedAt": "2025-01-05T19:00:00Z",
  "queryLocation": "KORD"
}`,
  },
  {
    id: 'navlog',
    label: 'Nav Log',
    method: 'POST',
    path: `${API_BASE_PATH}/navlog/calculate`,
    description: 'Calculate a navigation log for a flight route',
    response: `{
  "totalRouteDistance": 214.5,
  "totalRouteTimeHours": 1.7,
  "totalFuelUsed": 18.6,
  "averageWindComponent": -8.3,
  "airspaceGlobalIds": ["K-B-NE-001", "K-C-NE-042"],
  "obstacleOasNumbers": ["10-004821", "10-005133"],
  "legs": [
    {
      "legStartPoint": {
        "id": "KJFK",
        "name": "JOHN F KENNEDY INTL",
        "latitude": 40.6399,
        "longitude": -73.7787,
        "altitude": 4500.0,
        "waypointType": "Airport"
      },
      "legEndPoint": {
        "id": "BDR",
        "name": "IGOR I SIKORSKY MEM",
        "latitude": 41.1635,
        "longitude": -73.1262,
        "altitude": 4500.0,
        "waypointType": "Airport"
      },
      "trueCourse": 45.0,
      "magneticCourse": 58.2,
      "magneticHeading": 55.8,
      "groundSpeed": 126.0,
      "legDistance": 58.2,
      "distanceRemaining": 156.3,
      "legFuelBurnGals": 5.1,
      "remainingFuelGals": 42.9,
      "windDir": 240,
      "windSpeed": 15,
      "headwindComponent": -8.3,
      "tempC": 5.0
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
