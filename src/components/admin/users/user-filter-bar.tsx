import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserFilterBarProps {
  tier: string
  filter: string
  onTierChange: (tier: string) => void
  onFilterChange: (filter: string) => void
}

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'student', label: 'Student Pilot' },
  { value: 'private', label: 'Private Pilot' },
  { value: 'commercial', label: 'Commercial Pilot' },
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'high-error', label: 'High Error Rate' },
  { value: 'near-quota', label: 'Near Quota' },
  { value: 'high-usage', label: 'High Usage' },
  { value: 'rate-limited', label: 'Rate Limited' },
]

export function UserFilterBar({
  tier,
  filter,
  onTierChange,
  onFilterChange,
}: UserFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={tier} onValueChange={onTierChange}>
        <SelectTrigger className="h-8 w-[160px]">
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
      <Select value={filter} onValueChange={onFilterChange}>
        <SelectTrigger className="h-8 w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
