import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Globe, Search, User, Wifi } from 'lucide-react'
import type { AdminSearchResult } from '@/lib/server/admin/search'
import { adminKeys } from '@/lib/server/queries'
import { adminGlobalSearch } from '@/lib/server/admin/search'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const ICONS: Record<AdminSearchResult['type'], typeof User> = {
  user: User,
  subscription: Globe,
  ip: Wifi,
}

const GROUP_LABELS: Record<AdminSearchResult['type'], string> = {
  user: 'Users',
  subscription: 'Subscriptions',
  ip: 'IP Addresses',
}

export function AdminSearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const mounted = useRef(false)

  // Only render on client to avoid SSR hydration mismatch
  useEffect(() => {
    mounted.current = true
  }, [])

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results, isLoading } = useQuery({
    queryKey: adminKeys.globalSearch(debouncedQuery),
    queryFn: () => adminGlobalSearch({ data: { query: debouncedQuery } }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 15_000,
  })

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      navigate({ to: href })
    },
    [navigate],
  )

  // Group results by type
  const grouped = new Map<string, Array<AdminSearchResult>>()
  for (const result of results ?? []) {
    const group = grouped.get(result.type) ?? []
    group.push(result)
    grouped.set(result.type, group)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search users, IPs, subscriptions..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {debouncedQuery.length > 0 && !isLoading && (results?.length ?? 0) === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {isLoading && debouncedQuery.length > 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}
        {[...grouped.entries()].map(([type, items]) => {
          const Icon = ICONS[type as AdminSearchResult['type']] ?? Search
          return (
            <CommandGroup
              key={type}
              heading={GROUP_LABELS[type as AdminSearchResult['type']] ?? type}
            >
              {items.map((item, idx) => (
                <CommandItem
                  key={`${item.href}-${idx}`}
                  onSelect={() => handleSelect(item.href)}
                >
                  <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
