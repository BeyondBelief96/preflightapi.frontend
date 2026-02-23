import { SITE_CONFIG } from './constants'

interface PageHeadOptions {
  title: string
  description: string
  path?: string
  ogImage?: string
  noIndex?: boolean
}

export function createPageHead(options: PageHeadOptions) {
  const fullTitle = `${options.title} | ${SITE_CONFIG.name}`
  const ogImage = `${SITE_CONFIG.url}${options.ogImage ?? '/preflight_logo_with_text_1.png'}`
  const url = options.path ? `${SITE_CONFIG.url}${options.path}` : undefined

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: options.description },
      { property: 'og:title', content: options.title },
      { property: 'og:description', content: options.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_CONFIG.name },
      { property: 'og:locale', content: 'en_US' },
      ...(url ? [{ property: 'og:url', content: url }] : []),
      { property: 'og:image', content: ogImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: options.title },
      { name: 'twitter:description', content: options.description },
      { name: 'twitter:image', content: ogImage },
      ...(options.noIndex ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
    links: [...(url ? [{ rel: 'canonical', href: url }] : [])],
  }
}
