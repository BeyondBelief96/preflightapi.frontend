import { getEndpointContent } from '@/lib/docs/endpoint-content'

interface UseCaseBlockProps {
  operationId: string
}

export function UseCaseBlock({ operationId }: UseCaseBlockProps) {
  const content = getEndpointContent(operationId)
  if (!content?.useCase && !content?.aviationContext) return null

  return (
    <div className="rounded-lg border-l-4 border-l-accent bg-accent/5 p-4">
      {content.useCase && (
        <p className="text-sm font-medium text-foreground">{content.useCase}</p>
      )}
      {content.aviationContext && (
        <p className="mt-2 text-sm text-muted-foreground">
          {content.aviationContext}
        </p>
      )}
    </div>
  )
}
