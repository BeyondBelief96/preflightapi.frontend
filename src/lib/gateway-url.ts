import { API_BASE_PATH } from './api-metadata'
import { env } from '@/env'

export const GATEWAY_URL = env.VITE_APIM_GATEWAY_URL

if (!GATEWAY_URL) {
  throw new Error('VITE_APIM_GATEWAY_URL must be configured')
}

/** Full base URL including the API version prefix (e.g., "https://…/api/v1") */
export const API_BASE_URL = `${GATEWAY_URL}${API_BASE_PATH}`
