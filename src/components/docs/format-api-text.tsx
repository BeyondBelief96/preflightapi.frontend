import { CodeBlock } from './code-block'
import { cn } from '@/lib/utils'

interface FormatApiTextProps {
  text: string
  className?: string
}

interface TextSegment {
  type: 'paragraph' | 'code-block' | 'bullet-list'
  content: string
  language?: string
  items?: Array<string>
}

function parseSegments(text: string): Array<TextSegment> {
  const segments: Array<TextSegment> = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    const fenceMatch = line.match(/^```(\w*)/)
    if (fenceMatch) {
      const language = fenceMatch[1] || 'text'
      const codeLines: Array<string> = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      segments.push({ type: 'code-block', content: codeLines.join('\n'), language })
      continue
    }

    // Bullet list
    if (line.match(/^\s*- /)) {
      const items: Array<string> = []
      while (i < lines.length && lines[i].match(/^\s*- /)) {
        items.push(lines[i].replace(/^\s*- /, ''))
        i++
      }
      segments.push({ type: 'bullet-list', content: '', items })
      continue
    }

    // Blank line — skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Regular text — collect consecutive non-blank, non-special lines into a paragraph
    const paraLines: Array<string> = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^```/) &&
      !lines[i].match(/^\s*- /)
    ) {
      paraLines.push(lines[i])
      i++
    }
    segments.push({ type: 'paragraph', content: paraLines.join('\n') })
  }

  return segments
}

const API_PATH_RE = /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/\S+)/g
const INLINE_CODE_RE = /`([^`]+)`/g

function formatInlineText(text: string): Array<React.ReactNode> {
  // First replace inline code, then API paths in the remaining text
  // We process the string by splitting on both patterns
  const parts: Array<React.ReactNode> = []
  let lastIndex = 0
  let key = 0

  // Combine both patterns: inline code takes priority
  const combined = new RegExp(`${INLINE_CODE_RE.source}|${API_PATH_RE.source}`, 'g')
  let match: RegExpExecArray | null

  while ((match = combined.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1] !== undefined) {
      // Inline code: `something`
      parts.push(
        <code key={key++} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {match[1]}
        </code>,
      )
    } else if (match[2] !== undefined) {
      // API path: GET /api/v1/...
      parts.push(
        <code key={key++} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {match[0]}
        </code>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export function FormatApiText({ text, className }: FormatApiTextProps) {
  const segments = parseSegments(text)

  return (
    <div className={cn('space-y-2', className)}>
      {segments.map((segment, i) => {
        switch (segment.type) {
          case 'code-block':
            return (
              <CodeBlock key={i} code={segment.content} language={segment.language || 'text'} />
            )
          case 'bullet-list':
            return (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {segment.items?.map((item, j) => <li key={j}>{formatInlineText(item)}</li>)}
              </ul>
            )
          case 'paragraph':
            return <p key={i}>{formatInlineText(segment.content)}</p>
        }
      })}
    </div>
  )
}
