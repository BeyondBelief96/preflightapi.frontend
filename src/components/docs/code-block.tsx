import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { CopyButton } from './copy-button'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language: string
  className?: string
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('')

  useEffect(() => {
    codeToHtml(code, {
      lang: language,
      theme: 'github-dark',
    }).then(setHtml)
  }, [code, language])

  return (
    <div className={cn('group relative overflow-x-auto rounded-lg border bg-[#0d1117]', className)}>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <CopyButton text={code} />
      </div>
      {html ? (
        <div
          className="overflow-x-auto p-4 text-sm [&_pre]:!bg-transparent [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 text-sm text-white/80">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
