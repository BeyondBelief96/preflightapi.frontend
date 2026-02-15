import { CodeBlock } from './code-block'
import { cn } from '@/lib/utils'

interface FormatApiTextProps {
  text: string
  className?: string
}

interface TextSegment {
  type: 'paragraph' | 'code-block' | 'bullet-list' | 'example-calls' | 'heading'
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

/**
 * Detects whether a line looks like a section heading or definition term.
 * Headings are short, title-cased phrases that don't end in sentence punctuation.
 * e.g. "Wind Correction", "Top of Climb (TOC)", "Altitude Levels", "6-hour"
 */
function isHeadingLike(line: string, nextLine?: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > 60) return false
  // Ends with sentence punctuation → not a heading
  if (/[.,;!?:]$/.test(trimmed)) return false
  // Starts with lowercase → continuation text, not a heading
  if (/^[a-z]/.test(trimmed)) return false
  // Too many words for a heading
  const wordCount = trimmed.split(/\s+/).length
  if (wordCount > 6) return false
  // Must be followed by a longer line (to distinguish from short sentence fragments)
  if (nextLine) {
    const nextTrimmed = nextLine.trim()
    if (nextTrimmed.length > 0 && nextTrimmed.length > trimmed.length)
      return true
  }
  // Very short (≤ 3 words) is likely a heading even without longer follow-up
  return wordCount <= 3
}

/**
 * Detects em-dash reference items like "AirspaceGlobalIds — use with GET /api/v1/..."
 * These are PascalCase identifiers followed by an em/en-dash and a description.
 */
const REFERENCE_ITEM_RE = /^[A-Z]\w+\s+[—–-]\s+/

/**
 * Splits inline code-fence content that has multiple API examples or JSON
 * crammed onto a single line (common in swagger descriptions where newlines
 * inside fences are lost during JSON serialization).
 */
function splitInlineExamples(raw: string): string {
  // Multiple API examples on one line: split before each HTTP method
  const hasMultipleExamples =
    (raw.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+\//g)?.length ?? 0) > 1
  if (hasMultipleExamples) {
    return raw.replace(/\s+(GET|POST|PUT|PATCH|DELETE)\s+\//g, '\n$1 /').trim()
  }
  return raw
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
      const afterOpener = line.slice(fenceMatch[0].length)

      // Same-line fence: ``` content ``` (common in swagger descriptions)
      const closingIdx = afterOpener.indexOf('```')
      if (closingIdx !== -1) {
        const raw = afterOpener.slice(0, closingIdx).trim()
        // Split API examples that are crammed onto one line
        const content = splitInlineExamples(raw)
        if (content) {
          segments.push({ type: 'code-block', content, language })
        }
        i++
        continue
      }

      // Multi-line fence: content may start on the opener line
      const codeLines: Array<string> = []
      if (afterOpener.trim()) {
        codeLines.push(afterOpener)
      }
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      segments.push({
        type: 'code-block',
        content: codeLines.join('\n'),
        language,
      })
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
      segments.push({
        type: 'code-block',
        content: jsonLines.join('\n'),
        language: 'json',
      })
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

    // Reference items with em-dash (e.g. "AirspaceGlobalIds — use with GET /api/v1/...")
    if (REFERENCE_ITEM_RE.test(trimmed)) {
      const refLines: Array<string> = []
      while (i < lines.length && REFERENCE_ITEM_RE.test(lines[i].trim())) {
        refLines.push(lines[i].trim())
        i++
      }
      segments.push({ type: 'example-calls', content: refLines.join('\n') })
      continue
    }

    // Regular text — collect consecutive non-blank, non-special lines,
    // but split at heading-like lines to create proper sub-headings
    const paraLines: Array<string> = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^```/) &&
      !lines[i].match(/^\s*- /) &&
      !isJsonOpener(lines[i].trim()) &&
      !isSingleLineJson(lines[i].trim()) &&
      !API_EXAMPLE_RE.test(lines[i].trim()) &&
      !REFERENCE_ITEM_RE.test(lines[i].trim())
    ) {
      const currentLine = lines[i]
      const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined

      if (isHeadingLike(currentLine.trim(), nextLine)) {
        // Flush any accumulated paragraph text first
        if (paraLines.length > 0) {
          segments.push({ type: 'paragraph', content: paraLines.join('\n') })
          paraLines.length = 0
        }
        // Emit heading
        segments.push({ type: 'heading', content: currentLine.trim() })
        i++
        continue
      }

      paraLines.push(currentLine)
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
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
        >
          {match[2]}
        </code>,
      )
    } else if (match[3] !== undefined) {
      // API path: GET /api/v1/...
      parts.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
        >
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

function renderExampleCalls(
  content: string,
  segmentKey: number,
): React.ReactNode {
  const lines = content.split('\n')
  return (
    <div key={segmentKey} className="space-y-1.5">
      {lines.map((line, j) => {
        // Split on em-dash, en-dash, or spaced hyphen
        const dashIndex = line.search(/\s[—–-]\s/)
        if (dashIndex !== -1) {
          const methodPath = line.slice(0, dashIndex).trim()
          // Skip past the dash and surrounding whitespace
          const rest = line
            .slice(dashIndex)
            .replace(/^\s[—–-]\s/, '')
            .trim()
          return (
            <div key={j} className="flex items-baseline gap-2">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {methodPath}
              </code>
              <span className="text-muted-foreground">
                {formatInlineText(rest)}
              </span>
            </div>
          )
        }
        return (
          <div key={j} className="flex items-baseline gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {line}
            </code>
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
              <CodeBlock
                key={i}
                code={segment.content}
                language={segment.language || 'text'}
              />
            )
          case 'bullet-list':
            return (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {segment.items?.map((item, j) => (
                  <li key={j}>{formatInlineText(item)}</li>
                ))}
              </ul>
            )
          case 'example-calls':
            return renderExampleCalls(segment.content, i)
          case 'heading':
            return (
              <h4
                key={i}
                className="mt-3 text-sm font-semibold text-foreground first:mt-0"
              >
                {formatInlineText(segment.content)}
              </h4>
            )
          case 'paragraph':
            return <p key={i}>{formatInlineText(segment.content)}</p>
        }
      })}
    </div>
  )
}
