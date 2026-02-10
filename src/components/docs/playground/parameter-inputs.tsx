import type { ParsedParameter } from '@/lib/docs/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ParameterInputsProps {
  label: string
  params: Array<ParsedParameter>
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  showOptionalHint?: boolean
}

export function ParameterInputs({
  label,
  params,
  values,
  onChange,
  showOptionalHint = false,
}: ParameterInputsProps) {
  if (params.length === 0) return null

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {params.map((p) => (
          <div key={p.name} className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {p.name}
              {p.required && <span className="ml-0.5 text-red-400">*</span>}
            </label>
            {p.enum?.length ? (
              <Select value={values[p.name] ?? ''} onValueChange={(v) => onChange(p.name, v)}>
                <SelectTrigger size="sm" className="w-full font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {p.enum.map((val) => (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={values[p.name] ?? ''}
                onChange={(e) => onChange(p.name, e.target.value)}
                className="font-mono text-xs"
                placeholder={showOptionalHint && !p.required ? `${p.name} (optional)` : p.name}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
