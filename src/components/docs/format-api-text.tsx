import { CodeBlock } from './code-block'
import { cn } from '@/lib/utils'

interface FormatApiTextProps {
  text: string
  className?: string
}

interface TextSegment {
  type: 'paragraph' | 'code-block' | 'bullet-list' | 'example-calls'
  content: string
  language?: string
  items?: Array<string>
}

const API_EXAMPLE_RE = /^(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/
const JSON_OPEN_RE = /^[{[]/
const JSON_SINGLE_LINE_RE = /^[{[].*[}\]]$/

function isJsonOpener(line: string): boolean {
  const trimmed = line.trim()
  return trimmed === '{' || trimmed === '['
}

function isSingleLineJson(line: string): boolean {
  const trimmed = line.trim()
  return (
    JSON_SINGLE_LINE_RE.test(trimmed) &&
    JSON_OPEN_RE.test(trimmed) &&
    (trimmed.includes('"') || trimmed.includes(':'))
  )
}

function parseSegments(text: string): Array<TextSegment> {
  const segments: Array<TextSegment> = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

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

    // Multi-line JSON block — line is exactly { or [
    if (isJsonOpener(trimmed)) {
      const opener = trimmed[0]
      const closer = opener === '{' ? '}' : ']'
      let depth = 1
      const jsonLines: Array<string> = [line]
      i++
      while (i < lines.length && depth > 0) {
        const jLine = lines[i]
        for (const ch of jLine) {
          if (ch === opener) depth++
          else if (ch === closer) depth--
        }
        jsonLines.push(jLine)
        i++
      }
      segments.push({ type: 'code-block', content: jsonLines.join('\n'), language: 'json' })
      continue
    }

    // Single-line JSON
    if (isSingleLineJson(trimmed)) {
      segments.push({ type: 'code-block', content: trimmed, language: 'json' })
      i++
      continue
    }

    // API example call lines — group consecutive matches
    if (API_EXAMPLE_RE.test(trimmed)) {
      const callLines: Array<string> = []
      while (i < lines.length && API_EXAMPLE_RE.test(lines[i].trim())) {
        callLines.push(lines[i].trim())
        i++
      }
      segments.push({ type: 'example-calls', content: callLines.join('\n') })
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
    if (trimmed === '') {
      i++
      continue
    }

    // Regular text — collect consecutive non-blank, non-special lines into a paragraph
    const paraLines: Array<string> = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^```/) &&
      !lines[i].match(/^\s*- /) &&
      !isJsonOpener(lines[i].trim()) &&
      !isSingleLineJson(lines[i].trim()) &&
      !API_EXAMPLE_RE.test(lines[i].trim())
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      segments.push({ type: 'paragraph', content: paraLines.join('\n') })
    }
  }

  return segments
}

const BOLD_RE = /\*\*([^*]+)\*\*/g
const INLINE_CODE_RE = /`([^`]+)`/g
const API_PATH_RE = /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/\S+)/g

function formatInlineText(text: string): Array<React.ReactNode> {
  const parts: Array<React.ReactNode> = []
  let lastIndex = 0
  let key = 0

  // Combine patterns: bold > inline code > API paths (priority order)
  const combined = new RegExp(
    `${BOLD_RE.source}|${INLINE_CODE_RE.source}|${API_PATH_RE.source}`,
    'g',
  )
  let match: RegExpExecArray | null

  while ((match = combined.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1] !== undefined) {
      // Bold: **something**
      parts.push(<strong key={key++}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      // Inline code: `something`
      parts.push(
        <code key={key++} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {match[2]}
        </code>,
      )
    } else if (match[3] !== undefined) {
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

function renderExampleCalls(content: string, segmentKey: number): React.ReactNode {
  const lines = content.split('\n')
  return (
    <div key={segmentKey} className="space-y-1.5">
      {lines.map((line, j) => {
        // Split on em-dash, en-dash, or spaced hyphen
        const dashIndex = line.search(/\s[—–-]\s/)
        if (dashIndex !== -1) {
          const methodPath = line.slice(0, dashIndex).trim()
          // Skip past the dash and surrounding whitespace
          const rest = line.slice(dashIndex).replace(/^\s[—–-]\s/, '').trim()
          return (
            <div key={j} className="flex items-baseline gap-2">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {methodPath}
              </code>
              <span className="text-muted-foreground">{rest}</span>
            </div>
          )
        }
        return (
          <div key={j} className="flex items-baseline gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{line}</code>
          </div>
        )
      })}
    </div>
  )
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
          case 'example-calls':
            return renderExampleCalls(segment.content, i)
          case 'paragraph':
            return <p key={i}>{formatInlineText(segment.content)}</p>
        }
      })}
    </div>
  )
}
