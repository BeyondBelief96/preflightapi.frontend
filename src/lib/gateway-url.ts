import { env } from '@/env'

export const GATEWAY_URL =
  env.VITE_APIM_GATEWAY_URL ?? 'https://preflightapi-apim-service-test.azure-api.net'
