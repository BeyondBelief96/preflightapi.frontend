import { defineEventHandler } from 'h3'
import spec from '../../docs/preflightapi_swagger.json'

export default defineEventHandler((event) => {
  event.res.headers.set('Content-Type', 'application/json')
  event.res.headers.set(
    'Content-Disposition',
    'inline; filename="preflightapi_openapi.json"',
  )

  const gatewayUrl = process.env.VITE_API_GATEWAY_URL
  if (gatewayUrl && spec.servers?.[0]) {
    return { ...spec, servers: [{ url: gatewayUrl }] }
  }

  return spec
})
