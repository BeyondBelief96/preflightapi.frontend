/**
 * API version metadata derived from docs/preflightapi_swagger.json at build time.
 * The __API_VERSION__ global is injected by Vite's `define` in vite.config.ts,
 * so no runtime JSON import is needed.
 */
declare const __API_VERSION__: string

/** API version string from the OpenAPI spec (e.g., "v1") */
export const API_VERSION = __API_VERSION__

/** API base path including the version prefix (e.g., "/api/v1") */
export const API_BASE_PATH = `/api/${API_VERSION}`
