import { defineEventHandler, setResponseHeaders } from 'h3'
import spec from '../../docs/preflightapi_swagger.json'

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Content-Type': 'application/json',
    'Content-Disposition': 'inline; filename="preflightapi_openapi.json"',
  })
  return spec
})
