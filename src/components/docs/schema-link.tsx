import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SCHEMA_TO_GROUP } from '@/lib/docs/schema-groups'

interface SchemaLinkProps {
  name: string
  isArray?: boolean
  className?: string
}

export function SchemaLink({ name, isArray, className }: SchemaLinkProps) {
  const groupSlug = SCHEMA_TO_GROUP[name]

  return (
    <Link
      to={groupSlug ? '/docs/data-models/$group' : '/docs/data-models'}
      params={groupSlug ? { group: groupSlug } : undefined}
      hash={name}
      className={cn(
        'font-mono text-xs text-blue-400 hover:underline',
        className,
      )}
    >
      {isArray ? `${name}[]` : name}
    </Link>
  )
}
