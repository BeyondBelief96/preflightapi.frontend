import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BookOpen, Code2, Database } from 'lucide-react'
import type { SearchItem } from '@/lib/docs/search-index'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { searchIndex } from '@/lib/docs/search-index'

interface DocsSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeIcons: Record<
  SearchItem['type'],
  React.ComponentType<{ className?: string }>
> = {
  page: BookOpen,
  endpoint: Code2,
  schema: Database,
}

/** Score how well an item matches the query. Higher = better. 0 = no match. */
function scoreItem(item: SearchItem, q: string): number {
  const titleLower = item.title.toLowerCase()
  const subtitleLower = (item.subtitle ?? '').toLowerCase()

  // Exact title match
  if (titleLower === q) return 100

  // Title starts with query
  if (titleLower.startsWith(q)) return 80

  // Title contains query as a word boundary (e.g. "metar" in "Get Metars By Icao")
  if (
    new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(
      titleLower,
    )
  )
    return 60

  // Title contains query anywhere
  if (titleLower.includes(q)) return 40

  // Subtitle contains query
  if (subtitleLower.includes(q)) return 30

  // Keywords contain query
  if (item.keywords.some((kw) => kw.includes(q))) return 20

  return 0
}

/** Highlight the first occurrence of `query` in `text` (case-insensitive). */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>

  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, idx)}
      <span className="text-accent font-semibold group-data-[selected=true]:text-accent-foreground">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}

export function DocsSearch({ open, onOpenChange }: DocsSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // Reset query and selection when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected('')
    }
  }, [open])

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return searchIndex

    return searchIndex
      .map((item) => ({ item, score: scoreItem(item, q) }))
      .filter((r) => r.score > 0)
      .sort(
        (a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title),
      )
      .map((r) => r.item)
  }, [query])

  // Handle query changes: reset selection and force-scroll list to top
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setSelected('')
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = 0
      }
    })
  }, [])

  const grouped = useMemo(() => {
    const groups: Record<string, Array<SearchItem>> = {}
    for (const item of filteredItems) {
      ;(groups[item.group] ??= []).push(item)
    }
    return groups
  }, [filteredItems])

  function handleSelect(item: SearchItem) {
    onOpenChange(false)
    navigate({
      to: item.href,
      hash: item.hash,
    })

    // For same-page navigations the router won't re-trigger scroll effects,
    // so scroll to the hash target directly after a short delay.
    if (item.hash) {
      setTimeout(() => {
        const el = document.getElementById(item.hash!)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }

  const q = query.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Search Documentation</DialogTitle>
        <DialogDescription>
          Search docs, endpoints, and schemas
        </DialogDescription>
      </DialogHeader>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <Command
          shouldFilter={false}
          value={selected}
          onValueChange={setSelected}
        >
          <CommandInput
            placeholder="Search docs, endpoints, schemas..."
            value={query}
            onValueChange={handleQueryChange}
          />
          <CommandList ref={listRef} className="max-h-[min(60vh,400px)]">
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(grouped).map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.slice(0, 10).map((item) => {
                  const Icon = typeIcons[item.type]
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                      className="group gap-3 py-3"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-data-[selected=true]:text-accent-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">
                          <HighlightMatch text={item.title} query={q} />
                        </div>
                        {item.subtitle && (
                          <div className="truncate font-mono text-xs text-muted-foreground group-data-[selected=true]:text-accent-foreground/70">
                            <HighlightMatch text={item.subtitle} query={q} />
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
