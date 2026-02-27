import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type {EmailRecipient} from '@/lib/server/admin-email';
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  
  getEmailRecipients
} from '@/lib/server/admin-email'
import { adminKeys } from '@/lib/server/apim-queries'

export interface SelectedRecipient {
  email: string
  name?: string
}

interface RecipientSelectorProps {
  value: Array<SelectedRecipient>
  onChange: (recipients: Array<SelectedRecipient>) => void
}

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'student', label: 'Student Pilot' },
  { value: 'private', label: 'Private Pilot' },
  { value: 'commercial', label: 'Commercial Pilot' },
  { value: 'atp', label: 'ATP' },
]

export function RecipientSelector({ value, onChange }: RecipientSelectorProps) {
  const [tier, setTier] = useState('all')
  const [search, setSearch] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const { data: recipients, isLoading, error } = useQuery({
    queryKey: adminKeys.emailRecipients(tier),
    queryFn: () => getEmailRecipients({ data: { tier } }),
    staleTime: 60_000,
  })

  // Pre-select all recipients when tier changes
  useEffect(() => {
    if (recipients) {
      onChangeRef.current(
        recipients.map((r) => ({
          email: r.email,
          name: [r.firstName, r.lastName].filter(Boolean).join(' ') || undefined,
        })),
      )
    }
  }, [recipients])

  const filtered = useMemo(() => {
    if (!recipients) return []
    if (!search) return recipients
    const q = search.toLowerCase()
    return recipients.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.firstName?.toLowerCase().includes(q)) ||
        (r.lastName?.toLowerCase().includes(q)),
    )
  }, [recipients, search])

  const selectedEmails = useMemo(
    () => new Set(value.map((v) => v.email)),
    [value],
  )

  const toggleRecipient = (recipient: EmailRecipient) => {
    if (selectedEmails.has(recipient.email)) {
      onChange(value.filter((v) => v.email !== recipient.email))
    } else {
      onChange([
        ...value,
        {
          email: recipient.email,
          name:
            [recipient.firstName, recipient.lastName]
              .filter(Boolean)
              .join(' ') || undefined,
        },
      ])
    }
  }

  const toggleAll = () => {
    if (!filtered.length) return
    const allFilteredSelected = filtered.every((r) =>
      selectedEmails.has(r.email),
    )
    if (allFilteredSelected) {
      const filteredEmails = new Set(filtered.map((r) => r.email))
      onChange(value.filter((v) => !filteredEmails.has(v.email)))
    } else {
      const existing = new Map(value.map((v) => [v.email, v]))
      for (const r of filtered) {
        if (!existing.has(r.email)) {
          existing.set(r.email, {
            email: r.email,
            name:
              [r.firstName, r.lastName].filter(Boolean).join(' ') || undefined,
          })
        }
      }
      onChange(Array.from(existing.values()))
    }
  }

  const addManualEmail = () => {
    const email = manualEmail.trim()
    if (!email || selectedEmails.has(email)) return
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    onChange([...value, { email }])
    setManualEmail('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary">
          {value.length} recipient{value.length !== 1 ? 's' : ''} selected
        </Badge>
      </div>

      {/* Manual email input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add email manually..."
          value={manualEmail}
          onChange={(e) => setManualEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addManualEmail()
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addManualEmail}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search recipients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Recipient list */}
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load recipients:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[240px] rounded-md border">
          <div className="p-2">
            {/* Select all toggle */}
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="mb-1 flex w-full items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={
                    filtered.length > 0 &&
                    filtered.every((r) => selectedEmails.has(r.email))
                  }
                />
                <span className="font-medium text-muted-foreground">
                  Select all ({filtered.length})
                </span>
              </button>
            )}

            {filtered.map((recipient) => (
              <button
                key={recipient.clerkId}
                type="button"
                onClick={() => toggleRecipient(recipient)}
                className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox checked={selectedEmails.has(recipient.email)} />
                <span className="truncate">
                  {recipient.firstName || recipient.lastName
                    ? `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim()
                    : recipient.email}
                </span>
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {recipient.email}
                </span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recipients found
              </p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
