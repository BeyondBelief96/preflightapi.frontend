import { defineEventHandler, setResponseHeader } from 'h3'

const SITE_URL = 'https://preflightapi.io'

// Static marketing pages
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/pricing', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
]

// Static doc pages
const DOC_PAGES = [
  '/docs',
  '/docs/getting-started',
  '/docs/authentication',
  '/docs/rate-limits',
  '/docs/errors',
  '/docs/openapi',
  '/docs/data-freshness',
  '/docs/data-models',
]

// Dynamic doc category pages (from category-config.ts)
const CATEGORY_SLUGS = [
  'metars',
  'tafs',
  'pireps',
  'sigmets',
  'g-airmets',
  'airports',
  'communication-frequencies',
  'airspace',
  'notams',
  'obstacles',
  'airport-diagrams',
  'chart-supplements',
  'e6b',
  'nav-log',
]

// Dynamic data model group pages (from schema-groups.ts)
const DATA_MODEL_SLUGS = [
  'weather',
  'airports',
  'airspace',
  'notams',
  'obstacles',
  'documents',
  'e6b',
  'navigation',
  'common',
]

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=86400')

  const today = new Date().toISOString().split('T')[0]

  const urls = [
    // Marketing pages
    ...STATIC_PAGES.map(
      (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    ),

    // Doc pages
    ...DOC_PAGES.map(
      (path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    ),

    // API category pages
    ...CATEGORY_SLUGS.map(
      (slug) => `  <url>
    <loc>${SITE_URL}/docs/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    ),

    // Data model group pages
    ...DATA_MODEL_SLUGS.map(
      (slug) => `  <url>
    <loc>${SITE_URL}/docs/data-models/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    ),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
})
