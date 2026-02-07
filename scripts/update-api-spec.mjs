/**
 * Downloads the latest OpenAPI spec from the deployed API and saves it locally.
 *
 * Usage:
 *   npm run update-api-spec                          # uses default APIM gateway URL
 *   npm run update-api-spec -- --url <custom-url>    # uses a custom spec URL
 *   npm run update-api-spec -- --local               # uses local dev API (https://localhost:7014)
 *
 * After updating the spec, run `npm run generate-api-types` to regenerate TypeScript types.
 */

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '..', 'docs', 'preflightapi_swagger.json')
const PUBLIC_PATH = resolve(__dirname, '..', 'public', 'api-spec.json')

const DEFAULT_API_URL = 'https://preflightapi-eastus-web-api-test-bmfecfftf6bgemdf.eastus-01.azurewebsites.net'
const APIM_GATEWAY_URL = 'https://preflightapi-apim-service-test.azure-api.net'
const LOCAL_API_URL = 'https://localhost:7014'
const SPEC_PATH = '/swagger/v1/swagger.json'

function parseArgs() {
  const args = process.argv.slice(2)

  if (args.includes('--local')) {
    return `${LOCAL_API_URL}${SPEC_PATH}`
  }

  const urlIndex = args.indexOf('--url')
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    return args[urlIndex + 1]
  }

  return `${DEFAULT_API_URL}${SPEC_PATH}`
}

async function main() {
  const specUrl = parseArgs()
  console.log(`Fetching OpenAPI spec from: ${specUrl}`)

  try {
    const response = await fetch(specUrl, {
      // Allow self-signed certs for local dev
      ...(specUrl.startsWith(LOCAL_API_URL) && {
        dispatcher: undefined,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const spec = await response.json()

    // Normalize server URL to the APIM gateway (regardless of source)
    if (spec.servers?.[0]) {
      spec.servers[0].url = APIM_GATEWAY_URL
    }

    const specJson = JSON.stringify(spec, null, 2) + '\n'
    writeFileSync(OUTPUT_PATH, specJson)
    writeFileSync(PUBLIC_PATH, specJson)
    console.log(`OpenAPI spec saved to: ${OUTPUT_PATH}`)
    console.log(`Static spec copied to: ${PUBLIC_PATH}`)
    console.log(`\nRun 'npm run generate-api-types' to regenerate TypeScript types.`)
  } catch (error) {
    console.error(`Failed to fetch OpenAPI spec: ${error.message}`)
    console.error(`\nMake sure the API is deployed and accessible at: ${specUrl}`)
    process.exit(1)
  }
}

main()
