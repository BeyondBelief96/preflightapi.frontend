interface PageHeadOptions {
  title: string
  description: string
  path?: string
  ogImage?: string
  noIndex?: boolean
}

export function createPageHead(options: PageHeadOptions) {
  const fullTitle = `${options.title} | PreflightAPI`
  const ogImage = options.ogImage ?? '/og-default.png'
  const url = options.path
    ? `https://preflightapi.com${options.path}`
    : undefined

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: options.description },
      { property: 'og:title', content: options.title },
      { property: 'og:description', content: options.description },
      { property: 'og:type', content: 'website' },
      ...(url ? [{ property: 'og:url', content: url }] : []),
      { property: 'og:image', content: ogImage },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: options.title },
      { name: 'twitter:description', content: options.description },
      ...(options.noIndex ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
  }
}
