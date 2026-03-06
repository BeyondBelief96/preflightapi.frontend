import type { ParsedParameter } from '@/lib/docs/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ParameterTableProps {
  parameters: Array<ParsedParameter>
}

function LocationLabel({ location }: { location: string }) {
  const colors: Record<string, string> = {
    path: 'text-amber-400',
    query: 'text-blue-400',
    header: 'text-purple-400',
    body: 'text-green-400',
  }
  return (
    <span className={`text-xs ${colors[location] ?? 'text-muted-foreground'}`}>
      {location}
    </span>
  )
}

export function ParameterTable({ parameters }: ParameterTableProps) {
  if (parameters.length === 0) return null

  // Sort: path first, then query, then others
  const sorted = [...parameters].sort((a, b) => {
    const order = { path: 0, query: 1, header: 2, body: 3 }
    return (order[a.in] ?? 4) - (order[b.in] ?? 4)
  })

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[160px]">Name</TableHead>
            <TableHead className="w-[80px]">In</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((param) => (
            <TableRow key={`${param.in}-${param.name}`}>
              <TableCell className="font-mono text-sm">
                {param.name}
                {param.required && (
                  <span className="ml-1.5 text-xs text-red-400">*</span>
                )}
              </TableCell>
              <TableCell>
                <LocationLabel location={param.in} />
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {param.type}
                {param.nullable && '?'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {param.description}
                {param.enum && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {param.enum.map((v) => (
                      <span
                        key={v}
                        className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] leading-tight text-muted-foreground"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
