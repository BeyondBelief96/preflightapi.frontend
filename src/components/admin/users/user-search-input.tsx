import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface UserSearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function UserSearchInput({ value, onChange }: UserSearchInputProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) {
        onChange(local)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [local, value, onChange])

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by name or email..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
