import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/docs/api-reference')({
  component: ApiReferencePage,
})

function ApiReferencePage() {
  const [Reference, setReference] = useState<React.ComponentType<{
    configuration: Record<string, unknown>
  }> | null>(null)

  useEffect(() => {
    // Dynamically import Scalar to avoid SSR issues (client-only component)
    Promise.all([
      import('@scalar/api-reference-react'),
      import('@scalar/api-reference-react/style.css'),
    ]).then(([mod]) => {
      setReference(() => mod.ApiReferenceReact)
    })
  }, [])

  if (!Reference) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading API Reference...</div>
      </div>
    )
  }

  return (
    <Reference
      configuration={{
        // Served as a static asset from public/ — no CORS issues
        url: '/api-spec.json',
        theme: 'bluePlanet',
        darkMode: true,
        hideDarkModeToggle: true,
        withDefaultFonts: false,
        layout: 'modern',
        authentication: {
          preferredSecurityScheme: 'apiKey',
        },
        searchHotKey: 'k',
      }}
    />
  )
}
