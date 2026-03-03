import { useCallback, useEffect, useState } from 'react'
import { CodeBlock } from './code-block'
import type { ParsedEndpoint } from '@/lib/docs/types'
import type { LanguageId } from '@/lib/docs/code-examples'
import { LANGUAGES } from '@/lib/docs/code-examples'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STORAGE_KEY = 'preflight-docs-lang'
const DEFAULT_LANG: LanguageId = 'curl'

function getStoredLang(): LanguageId {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && LANGUAGES.some((l) => l.id === stored)) return stored as LanguageId
  return DEFAULT_LANG
}

interface CodeExamplesProps {
  endpoint: ParsedEndpoint
}

const tabTriggerClass =
  'rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent'

export function CodeExamples({ endpoint }: CodeExamplesProps) {
  const [lang, setLang] = useState<LanguageId>(DEFAULT_LANG)

  useEffect(() => {
    setLang(getStoredLang())
  }, [])

  const handleChange = useCallback((value: string) => {
    const id = value as LanguageId
    setLang(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const current = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0]
  const code = current.generate(endpoint)

  return (
    <div>
      {/* Desktop: horizontal tabs */}
      <div className="hidden md:block">
        <Tabs value={lang} onValueChange={handleChange} className="w-full">
          <TabsList className="h-auto bg-transparent p-0">
            {LANGUAGES.map((l) => (
              <TabsTrigger key={l.id} value={l.id} className={tabTriggerClass}>
                {l.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {LANGUAGES.map((l) => (
            <TabsContent key={l.id} value={l.id} className="mt-2">
              <CodeBlock code={l.generate(endpoint)} language={l.highlight} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Mobile: dropdown selector */}
      <div className="md:hidden">
        <Select value={lang} onValueChange={handleChange}>
          <SelectTrigger size="sm" className="mb-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CodeBlock code={code} language={current.highlight} />
      </div>
    </div>
  )
}
