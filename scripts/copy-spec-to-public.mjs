import { copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = resolve(__dirname, '..', 'docs', 'preflightapi_swagger.json')
const dest = resolve(__dirname, '..', 'public', 'api-spec.json')

copyFileSync(src, dest)
console.log('Copied spec to public/api-spec.json')
