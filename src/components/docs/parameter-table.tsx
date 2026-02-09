import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ParsedParameter } from '@/lib/docs/types'

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
                  <span className="ml-1 text-xs text-muted-foreground/70">
                    ({param.enum.join(' | ')})
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
