import { Callout } from './callout'
import { getEndpointContent } from '@/lib/docs/endpoint-content'

interface EndpointTipsProps {
  operationId: string
}

export function EndpointTips({ operationId }: EndpointTipsProps) {
  const content = getEndpointContent(operationId)
  if (!content?.tips?.length) return null

  return (
    <div className="space-y-3">
      {content.tips.map((tip) => (
        <Callout key={tip.title} variant={tip.variant} title={tip.title}>
          {tip.body}
        </Callout>
      ))}
    </div>
  )
}
