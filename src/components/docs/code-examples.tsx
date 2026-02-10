import { CodeBlock } from './code-block'
import type { ParsedEndpoint } from '@/lib/docs/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  generateCurl,
  generateJavaScript,
  generatePython,
} from '@/lib/docs/code-examples'

interface CodeExamplesProps {
  endpoint: ParsedEndpoint
}

export function CodeExamples({ endpoint }: CodeExamplesProps) {
  const curl = generateCurl(endpoint)
  const js = generateJavaScript(endpoint)
  const python = generatePython(endpoint)

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
          value="javascript"
          className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent"
        >
          JavaScript
        </TabsTrigger>
        <TabsTrigger
          value="python"
          className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent"
        >
          Python
        </TabsTrigger>
      </TabsList>
      <TabsContent value="curl" className="mt-2">
        <CodeBlock code={curl} language="bash" />
      </TabsContent>
      <TabsContent value="javascript" className="mt-2">
        <CodeBlock code={js} language="javascript" />
      </TabsContent>
      <TabsContent value="python" className="mt-2">
        <CodeBlock code={python} language="python" />
      </TabsContent>
    </Tabs>
  )
}
