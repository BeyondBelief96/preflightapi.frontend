import type { ParsedEndpoint } from './types'

const GATEWAY_URL = 'https://preflightapi-apim-service.azure-api.net'

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
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query' && p.name !== 'cursor')
  if (queryParams.length > 0) {
    const qs = queryParams
      .map((p) => `${p.name}=${getExampleValue(p)}`)
      .join('&')
    url += `?${qs}`
  }

  return url
}

export function getExampleBody(endpoint: ParsedEndpoint): string | undefined {
  if (!endpoint.requestBody?.schema) return undefined
  const fields = endpoint.requestBody.schema.fields
  if (!fields.length) return '{}'

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

  lines.push('  -H "Ocp-Apim-Subscription-Key: YOUR_API_KEY"')

  const body = getExampleBody(endpoint)
  if (body) {
    lines.push('  -H "Content-Type: application/json"')
    lines.push(`  -d '${body}'`)
  }

  lines.push(`  "${url}"`)

  return lines.join(' \\\n')
}

export function generateJavaScript(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const body = getExampleBody(endpoint)

  let code = `const response = await fetch(\n  "${url}",\n  {\n`
  code += `    method: "${endpoint.method}",\n`
  code += '    headers: {\n'
  code += '      "Ocp-Apim-Subscription-Key": "YOUR_API_KEY"'

  if (body) {
    code += ',\n      "Content-Type": "application/json"'
  }

  code += '\n    }'

  if (body) {
    code += `,\n    body: JSON.stringify(${body})`
  }

  code += '\n  }\n)\n\n'
  code += 'const data = await response.json()\nconsole.log(data)'

  return code
}

export function generatePython(endpoint: ParsedEndpoint): string {
  const url = buildUrl(endpoint)
  const body = getExampleBody(endpoint)
  const methodLower = endpoint.method.toLowerCase()

  let code = 'import requests\n\n'

  code += `response = requests.${methodLower}(\n`
  code += `    "${url}",\n`

  if (body) {
    code += '    headers={\n'
    code += '        "Ocp-Apim-Subscription-Key": "YOUR_API_KEY",\n'
    code += '        "Content-Type": "application/json"\n'
    code += '    },\n'
    code += `    json=${body.replace(/"/g, "'").replace(/: true/g, ': True').replace(/: false/g, ': False').replace(/: null/g, ': None')}\n`
  } else {
    code += '    headers={"Ocp-Apim-Subscription-Key": "YOUR_API_KEY"}\n'
  }

  code += ')\n\n'
  code += 'data = response.json()\nprint(data)'

  return code
}
