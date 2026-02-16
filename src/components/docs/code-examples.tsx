import { CodeBlock } from './code-block'
import type { ParsedEndpoint } from '@/lib/docs/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateCurl, generateTypeScript } from '@/lib/docs/code-examples'

interface CodeExamplesProps {
  endpoint: ParsedEndpoint
}

export function CodeExamples({ endpoint }: CodeExamplesProps) {
  const curl = generateCurl(endpoint)
  const ts = generateTypeScript(endpoint)

  return (
    <Tabs defaultValue="curl" className="w-full">
      <TabsList className="h-auto bg-transparent p-0">
        <TabsTrigger
          value="curl"
          className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent"
        >
          cURL
        </TabsTrigger>
        <TabsTrigger
          value="typescript"
          className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent"
        >
          TypeScript
        </TabsTrigger>
      </TabsList>
      <TabsContent value="curl" className="mt-2">
        <CodeBlock code={curl} language="bash" />
      </TabsContent>
      <TabsContent value="typescript" className="mt-2">
        <CodeBlock code={ts} language="typescript" />
      </TabsContent>
    </Tabs>
  )
}
