import { readFileSync } from 'node:fs'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Read API version from OpenAPI spec at build time so it can be inlined
// as a zero-cost constant via Vite's `define` option.
const swaggerSpec = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('./docs/preflightapi_swagger.json', import.meta.url)),
    'utf-8',
  ),
)

const config = defineConfig({
  define: {
    __API_VERSION__: JSON.stringify(swaggerSpec.info.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    devtools(),
    nitro({ serverDir: 'server' }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
