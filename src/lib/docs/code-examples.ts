import type { ParsedEndpoint } from './types'
import { API_BASE_PATH } from '@/lib/api-metadata'
import { GATEWAY_URL } from '@/lib/gateway-url'

/** Maps common parameter names to realistic aviation example values */
const EXAMPLE_VALUES: Record<string, string> = {
  icaoCodeOrIdent: 'KJFK',
  icaoCodesOrIdents: 'KJFK,KLAX,KORD',
  stateCode: 'NY',
  stateCodes: 'NY,CA,TX',
  prefix: 'KJF',
  query: 'JFK',
  search: 'kennedy',
  cursor: '',
  limit: '25',
  hazardType: 'turb',
  product: 'sierra',
  forecast: '06',
  oasNumber: '12-345678',
  servicedFacility: 'KJFK',
  latitude: '40.6413',
  longitude: '-73.7781',
  lat: '40.6413',
  lon: '-73.7781',
  radius: '10',
  radiusNm: '10',
  minLat: '40.0',
  maxLat: '41.0',
  minLon: '-74.5',
  maxLon: '-73.0',
}

export function getExampleValue(param: { name: string; type: string }): string {
  if (param.name in EXAMPLE_VALUES) return EXAMPLE_VALUES[param.name]
  if (param.type === 'integer') return '25'
  if (param.type === 'number') return '10.0'
  if (param.type === 'boolean') return 'true'
  return 'value'
}

function buildUrl(endpoint: ParsedEndpoint): string {
  let url = `${GATEWAY_URL}${endpoint.path}`

  // Replace path params
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path')
  for (const param of pathParams) {
    url = url.replace(`{${param.name}}`, getExampleValue(param))
  }

  // Add query params
  const queryParams = endpoint.parameters.filter(
    (p) => p.in === 'query' && p.name !== 'cursor',
  )
  if (queryParams.length > 0) {
    const qs = queryParams
      .map((p) => `${p.name}=${getExampleValue(p)}`)
      .join('&')
    url += `?${qs}`
  }

  return url
}

/**
 * Realistic prefilled request bodies for POST endpoints.
 * Keyed by API path so the playground is immediately usable.
 */
function getExampleBodies(): Record<string, unknown> {
  return {
    [`${API_BASE_PATH}/navlog/calculate`]: {
      waypoints: [
        {
          id: 'KCLT',
          name: 'Charlotte Douglas Intl',
          latitude: 35.214,
          longitude: -80.9431,
          altitude: 748,
          waypointType: 'Airport',
          isRefuelingStop: false,
        },
        {
          id: 'KTYS',
          name: 'McGhee Tyson',
          latitude: 35.811,
          longitude: -83.994,
          altitude: 981,
          waypointType: 'Airport',
          isRefuelingStop: true,
          refuelToFull: true,
        },
        {
          id: 'KBNA',
          name: 'Nashville Intl',
          latitude: 36.1245,
          longitude: -86.6782,
          altitude: 599,
          waypointType: 'Airport',
          isRefuelingStop: false,
        },
      ],
      performanceData: {
        climbTrueAirspeed: 80,
        cruiseTrueAirspeed: 120,
        descentTrueAirspeed: 100,
        climbFpm: 500,
        descentFpm: 500,
        climbFuelBurn: 10.0,
        cruiseFuelBurn: 8.5,
        descentFuelBurn: 5.0,
        sttFuelGals: 1.2,
        fuelOnBoardGals: 40.0,
      },
      plannedCruisingAltitude: 7500,
      timeOfDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000)
        .toISOString()
        .replace(/\.\d+Z$/, 'Z'),
    },
    [`${API_BASE_PATH}/navlog/bearing-and-distance`]: {
      startLatitude: 35.214,
      startLongitude: -80.9431,
      endLatitude: 36.1245,
      endLongitude: -86.6782,
    },
    [`${API_BASE_PATH}/e6b/crosswind/calculate`]: {
      windDirectionDegrees: 230,
      windSpeedKt: 15,
      windGustKt: 22,
      runwayHeadingDegrees: 180,
    },
    [`${API_BASE_PATH}/e6b/density-altitude/calculate`]: {
      fieldElevationFt: 748,
      altimeterInHg: 29.92,
      temperatureCelsius: 30,
    },
    [`${API_BASE_PATH}/notams/route`]: {
      airportIdentifiers: ['KCLT', 'KTYS', 'KBNA'],
      corridorRadiusNm: 25,
    },
    [`${API_BASE_PATH}/obstacles/by-oas-numbers`]: ['12-345678', '12-345679'],
  }
}

export function getExampleBody(endpoint: ParsedEndpoint): string | undefined {
  const examples = getExampleBodies()
  if (!endpoint.requestBody?.schema && !examples[endpoint.path])
    return undefined

  // Use curated example if available
  if (examples[endpoint.path]) {
    return JSON.stringify(examples[endpoint.path], null, 2)
  }

  const fields = endpoint.requestBody?.schema?.fields
  if (!fields?.length) return '{}'

  const obj: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.type === 'string') obj[f.name] = EXAMPLE_VALUES[f.name] ?? 'value'
    else if (f.type === 'integer' || f.type === 'number') obj[f.name] = 0
    else if (f.type === 'boolean') obj[f.name] = true
    else if (f.type.endsWith('[]')) obj[f.name] = []
    else obj[f.name] = {}
  }
  return JSON.stringify(obj, null, 2)
}

export function generateCurl(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const lines = ['curl']

  if (endpoint.method !== 'GET') {
    lines.push(`  -X ${endpoint.method}`)
  }

  lines.push('  -H "X-API-Key: YOUR_API_KEY"')

  const body = getExampleBody(endpoint)
  if (body) {
    lines.push('  -H "Content-Type: application/json"')
    lines.push(`  -d '${body}'`)
  }

  lines.push(`  "${url}"`)

  return lines.join(' \\\n')
}

export function generateTypeScript(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const body = getExampleBody(endpoint)

  let code = 'const response: Response = await fetch(\n'
  code += `  "${url}",\n  {\n`
  code += `    method: "${endpoint.method}",\n`
  code += '    headers: {\n'
  code += '      "X-API-Key": process.env.PREFLIGHT_API_KEY!'

  if (body) {
    code += ',\n      "Content-Type": "application/json"'
  }

  code += ',\n    }'

  if (body) {
    code += `,\n    body: JSON.stringify(${body})`
  }

  code += ',\n  },\n)\n\n'
  code += 'const data: unknown = await response.json()\nconsole.log(data)'

  return code
}

/** Convert JSON string to Python-safe syntax (true/false/null → True/False/None) */
function jsonToPython(json: string): string {
  return json
    .replace(/: true/g, ': True')
    .replace(/: false/g, ': False')
    .replace(/: null/g, ': None')
}

export function generatePython(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const body = getExampleBody(endpoint)

  let code = 'import requests\n\n'
  code += `url = "${url}"\n`
  code += 'headers = {\n'
  code += '    "X-API-Key": "YOUR_API_KEY"'
  if (body) {
    code += ',\n    "Content-Type": "application/json"'
  }
  code += ',\n}\n'

  if (body) {
    code += `\npayload = ${jsonToPython(body)}\n`
  }

  code += `\nresponse = requests.${endpoint.method.toLowerCase()}(url, headers=headers`
  if (body) {
    code += ', json=payload'
  }
  code += ')\n'
  code += 'data = response.json()\nprint(data)'

  return code
}

export function generateJava(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const body = getExampleBody(endpoint)

  let code = 'import java.net.URI;\n'
  code += 'import java.net.http.HttpClient;\n'
  code += 'import java.net.http.HttpRequest;\n'
  code += 'import java.net.http.HttpResponse;\n\n'
  code += 'HttpClient client = HttpClient.newHttpClient();\n\n'

  if (body) {
    code += `String json = """\n${body}""";\n\n`
  }

  code += 'HttpRequest request = HttpRequest.newBuilder()\n'
  code += `    .uri(URI.create("${url}"))\n`
  code += `    .header("X-API-Key", "YOUR_API_KEY")\n`

  if (body) {
    code += '    .header("Content-Type", "application/json")\n'
    code += `    .${endpoint.method === 'GET' ? 'GET' : endpoint.method}(HttpRequest.BodyPublishers.ofString(json))\n`
  } else {
    code += `    .${endpoint.method}(${endpoint.method === 'GET' ? '' : 'HttpRequest.BodyPublishers.noBody()'})\n`
  }

  code += '    .build();\n\n'
  code += 'HttpResponse<String> response = client.send(\n'
  code += '    request, HttpResponse.BodyHandlers.ofString()\n);\n'
  code += 'System.out.println(response.body());'

  return code
}

export function generateGo(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const body = getExampleBody(endpoint)
  const needsBody = !!body

  let code = 'package main\n\nimport (\n'
  code += '    "fmt"\n'
  code += '    "io"\n'
  code += '    "net/http"\n'
  if (needsBody) {
    code += '    "strings"\n'
  }
  code += ')\n\nfunc main() {\n'

  if (needsBody) {
    code += `    body := strings.NewReader(\`${body}\`)\n`
    code += `    req, _ := http.NewRequest("${endpoint.method}", "${url}", body)\n`
  } else {
    code += `    req, _ := http.NewRequest("${endpoint.method}", "${url}", nil)\n`
  }

  code += '    req.Header.Set("X-API-Key", "YOUR_API_KEY")\n'
  if (needsBody) {
    code += '    req.Header.Set("Content-Type", "application/json")\n'
  }

  code += '\n    resp, _ := http.DefaultClient.Do(req)\n'
  code += '    defer resp.Body.Close()\n'
  code += '    data, _ := io.ReadAll(resp.Body)\n'
  code += '    fmt.Println(string(data))\n'
  code += '}'

  return code
}

export function generateCSharp(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const body = getExampleBody(endpoint)

  let code = 'using System.Net.Http;\n'
  if (body) {
    code += 'using System.Text;\n'
  }
  code += '\n'

  code += 'var client = new HttpClient();\n'
  code += 'client.DefaultRequestHeaders.Add(\n'
  code += '    "X-API-Key", "YOUR_API_KEY"\n);\n'

  if (body) {
    code += `\nvar json = @"\n${body}";\n`
    code +=
      'var content = new StringContent(json, Encoding.UTF8, "application/json");\n'
  }

  const methodMap: Record<string, string> = {
    GET: 'GetAsync',
    POST: 'PostAsync',
    PUT: 'PutAsync',
    DELETE: 'DeleteAsync',
    PATCH: 'PatchAsync',
  }
  const method = methodMap[endpoint.method] ?? 'GetAsync'

  if (body && endpoint.method !== 'GET') {
    code += `\nvar response = await client.${method}("${url}", content);\n`
  } else {
    code += `\nvar response = await client.${method}("${url}");\n`
  }

  code += 'var data = await response.Content.ReadAsStringAsync();\n'
  code += 'Console.WriteLine(data);'

  return code
}

export function generatePhp(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const body = getExampleBody(endpoint)

  let code = '<?php\n'
  code += '$ch = curl_init();\n\n'
  code += `curl_setopt($ch, CURLOPT_URL, "${url}");\n`
  code += 'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n'

  if (endpoint.method !== 'GET') {
    code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${endpoint.method}");\n`
  }

  code += '\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n'
  code += '    "X-API-Key: YOUR_API_KEY"'
  if (body) {
    code += ',\n    "Content-Type: application/json"'
  }
  code += ',\n]);\n'

  if (body) {
    code += `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${body}');\n`
  }

  code += '\n$response = curl_exec($ch);\ncurl_close($ch);\n\n'
  code += '$data = json_decode($response, true);\nprint_r($data);'

  return code
}

export type LanguageId =
  | 'curl'
  | 'typescript'
  | 'python'
  | 'java'
  | 'go'
  | 'csharp'
  | 'php'

export interface LanguageOption {
  id: LanguageId
  label: string
  highlight: string
  generate: (endpoint: ParsedEndpoint) => string
}

export const LANGUAGES: Array<LanguageOption> = [
  { id: 'curl', label: 'cURL', highlight: 'bash', generate: generateCurl },
  {
    id: 'typescript',
    label: 'TypeScript',
    highlight: 'typescript',
    generate: generateTypeScript,
  },
  {
    id: 'python',
    label: 'Python',
    highlight: 'python',
    generate: generatePython,
  },
  { id: 'java', label: 'Java', highlight: 'java', generate: generateJava },
  { id: 'go', label: 'Go', highlight: 'go', generate: generateGo },
  { id: 'csharp', label: 'C#', highlight: 'csharp', generate: generateCSharp },
  { id: 'php', label: 'PHP', highlight: 'php', generate: generatePhp },
]
