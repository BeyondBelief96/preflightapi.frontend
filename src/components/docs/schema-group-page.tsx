import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, Search } from 'lucide-react'
import type { SchemaGroup } from '@/lib/docs/schema-groups'
import type { ParsedSchema } from '@/lib/docs/types'
import { schemas } from '@/lib/docs/spec-parser'
import { SchemaViewer } from '@/components/docs/schema-viewer'
import { FormatApiText } from '@/components/docs/format-api-text'

interface SchemaGroupPageProps {
  group: SchemaGroup
}

function EnumTable({ schema }: { schema: ParsedSchema }) {
  const values = schema.enum ?? []
  const names = schema.enumNames ?? []

  return (
    <div className="overflow-x-auto rounded-lg border text-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Value
            </th>
            {names.length > 0 && (
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Name
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {values.map((val, i) => (
            <tr key={val} className="border-b border-border/50">
              <td className="px-3 py-1.5 font-mono text-xs">{val}</td>
              {names.length > 0 && (
                <td className="px-3 py-1.5 text-muted-foreground">
                  {names[i] ?? ''}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SchemaCard({ schema, hashTarget }: { schema: ParsedSchema; hashTarget?: string }) {
  const [expanded, setExpanded] = useState(schema.name === hashTarget)
  const hasContent = schema.isEnum ? (schema.enum?.length ?? 0) > 0 : schema.fields.length > 0

  // Auto-expand when this card becomes the hash target (e.g. from search navigation)
  useEffect(() => {
    if (hashTarget === schema.name) {
      setExpanded(true)
    }
  }, [hashTarget, schema.name])

  return (
    <div
      id={schema.name}
      className="scroll-mt-20 rounded-lg border"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-5 text-left transition-colors hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-mono text-lg font-semibold">
            {schema.name}
            {schema.isEnum && (
              <span className="ml-2 rounded bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-400">
                enum
              </span>
            )}
          </h3>
          {schema.description && (
            <FormatApiText
              text={schema.description}
              className="text-sm text-muted-foreground"
            />
          )}
          {!expanded && hasContent && (
            <p className="text-xs text-muted-foreground">
              {schema.isEnum
                ? `${schema.enum?.length ?? 0} values`
                : `${schema.fields.length} fields`}
            </p>
          )}
        </div>
        {hasContent && (
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {expanded && hasContent && (
        <div className="border-t px-5 pb-5 pt-4">
          {schema.isEnum ? (
            <EnumTable schema={schema} />
          ) : (
            <SchemaViewer fields={schema.fields} />
          )}
        </div>
      )}
    </div>
  )
}

export function SchemaGroupPage({ group }: SchemaGroupPageProps) {
  const [search, setSearch] = useState('')
  const location = useLocation()
  const hashTarget = location.hash

  const groupSchemas = useMemo(() => {
    return group.schemaNames
      .map((name) => schemas[name])
      .filter(Boolean)
  }, [group.schemaNames])

  const filteredSchemas = useMemo(() => {
    if (!search.trim()) return groupSchemas
    const q = search.toLowerCase()
    return groupSchemas.filter((s) => s.name.toLowerCase().includes(q))
  }, [groupSchemas, search])

  // Scroll to hash on load
  useEffect(() => {
    if (hashTarget) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hashTarget)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [hashTarget])

  return (
    <div>
      <Link
        to="/docs/data-models"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Data Models
      </Link>

      <h1 className="text-3xl font-bold">{group.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {group.description}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {groupSchemas.length} schemas in this group
      </p>

      {/* Search filter */}
      {groupSchemas.length > 5 && (
        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter schemas by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
      )}

      {/* Quick nav TOC */}
      {!search.trim() && groupSchemas.length > 3 && (
        <nav className="mt-6 rounded-lg border bg-muted/20 p-4">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            On this page
          </h2>
          <div className="flex flex-wrap gap-2">
            {groupSchemas.map((schema) => (
              <a
                key={schema.name}
                href={`#${schema.name}`}
                className="rounded-md bg-muted px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                {schema.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Schema cards */}
      <div className="mt-8 space-y-4">
        {filteredSchemas.map((schema) => (
          <SchemaCard
            key={schema.name}
            schema={schema}
            hashTarget={hashTarget}
          />
        ))}
      </div>

      {filteredSchemas.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          No schemas match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  )
}
