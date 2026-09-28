import { Link } from '@tanstack/react-router'
import { ArrowRight, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { isWaitlistMode } from '@/lib/waitlist'
import { usePlans } from '@/hooks/use-plans'
import { useTypingEffect } from '@/hooks/use-typing-effect'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Token-based syntax-highlighted code examples
// ---------------------------------------------------------------------------

interface Token {
  text: string
  className: string
}

interface CodeExample {
  label: string
  tokens: Array<Token>
  response: ReactNode
}

const Str = ({ children }: { children: string }) => (
  <span className="text-green-400">"{children}"</span>
)
const Num = ({ children }: { children: number }) => (
  <span className="text-orange-300">{children}</span>
)

function JsonLine({
  propKey,
  value,
  isLast = false,
}: {
  propKey: string
  value: ReactNode
  isLast?: boolean
}) {
  return (
    <>
      {'  '}
      <span className="text-sky-300">"{propKey}"</span>
      <span className="text-white/30">: </span>
      {value}
      {!isLast && <span className="text-white/30">,</span>}
      {'\n'}
    </>
  )
}

const EXAMPLES: Array<CodeExample> = [
  {
    label: 'Get METAR Weather',
    tokens: [
      { text: 'const ', className: 'text-purple-400' },
      { text: 'res', className: 'text-white/90' },
      { text: ' = ', className: 'text-white/30' },
      { text: 'await ', className: 'text-purple-400' },
      { text: 'fetch', className: 'text-yellow-300' },
      { text: '(', className: 'text-white/30' },
      { text: '`${API_URL}/metars/KJFK`', className: 'text-green-400' },
      { text: ', {\n  ', className: 'text-white/30' },
      { text: 'headers', className: 'text-sky-300' },
      { text: ': { ', className: 'text-white/30' },
      { text: "'X-API-Key'", className: 'text-green-400' },
      { text: ': ', className: 'text-white/30' },
      { text: 'API_KEY', className: 'text-white/90' },
      { text: ' }\n})\n', className: 'text-white/30' },
      { text: 'const ', className: 'text-purple-400' },
      { text: 'metar', className: 'text-white/90' },
      { text: ' = ', className: 'text-white/30' },
      { text: 'await ', className: 'text-purple-400' },
      { text: 'res', className: 'text-white/90' },
      { text: '.', className: 'text-white/30' },
      { text: 'json', className: 'text-yellow-300' },
      { text: '()', className: 'text-white/30' },
    ],
    response: (
      <>
        <span className="text-white/30">{'{\n'}</span>
        <JsonLine propKey="stationId" value={<Str>KJFK</Str>} />
        <JsonLine propKey="flightCategory" value={<Str>VFR</Str>} />
        <JsonLine propKey="tempC" value={<Num>{18}</Num>} />
        <JsonLine propKey="dewpointC" value={<Num>{12}</Num>} />
        <JsonLine propKey="windDirDegrees" value={<Str>220</Str>} />
        <JsonLine propKey="windSpeedKt" value={<Num>{12}</Num>} />
        <JsonLine propKey="visibilityStatuteMi" value={<Str>10</Str>} />
        <JsonLine propKey="altimInHg" value={<Num>{29.92}</Num>} isLast />
        <span className="text-white/30">{'}'}</span>
      </>
    ),
  },
  {
    label: 'NAVAID Lookup',
    tokens: [
      { text: 'const ', className: 'text-purple-400' },
      { text: 'res', className: 'text-white/90' },
      { text: ' = ', className: 'text-white/30' },
      { text: 'await ', className: 'text-purple-400' },
      { text: 'fetch', className: 'text-yellow-300' },
      { text: '(', className: 'text-white/30' },
      { text: '`${API_URL}/navaids/DFW`', className: 'text-green-400' },
      { text: ', {\n  ', className: 'text-white/30' },
      { text: 'headers', className: 'text-sky-300' },
      { text: ': { ', className: 'text-white/30' },
      { text: "'X-API-Key'", className: 'text-green-400' },
      { text: ': ', className: 'text-white/30' },
      { text: 'API_KEY', className: 'text-white/90' },
      { text: ' }\n})\n', className: 'text-white/30' },
      { text: 'const ', className: 'text-purple-400' },
      { text: 'navaid', className: 'text-white/90' },
      { text: ' = ', className: 'text-white/30' },
      { text: 'await ', className: 'text-purple-400' },
      { text: 'res', className: 'text-white/90' },
      { text: '.', className: 'text-white/30' },
      { text: 'json', className: 'text-yellow-300' },
      { text: '()', className: 'text-white/30' },
    ],
    response: (
      <>
        <span className="text-white/30">{'{\n'}</span>
        <JsonLine propKey="navId" value={<Str>DFW</Str>} />
        <JsonLine propKey="navType" value={<Str>Vortac</Str>} />
        <JsonLine propKey="name" value={<Str>Dallas-Fort Worth</Str>} />
        <JsonLine propKey="city" value={<Str>Dallas</Str>} />
        <JsonLine propKey="stateCode" value={<Str>TX</Str>} />
        <JsonLine propKey="latitude" value={<Num>{32.897}</Num>} />
        <JsonLine propKey="elevation" value={<Num>{535}</Num>} isLast />
        <span className="text-white/30">{'}'}</span>
      </>
    ),
  },
  {
    label: 'Calculate Flight Plan',
    tokens: [
      { text: 'const ', className: 'text-purple-400' },
      { text: 'res', className: 'text-white/90' },
      { text: ' = ', className: 'text-white/30' },
      { text: 'await ', className: 'text-purple-400' },
      { text: 'fetch', className: 'text-yellow-300' },
      { text: '(', className: 'text-white/30' },
      { text: '`${API_URL}/navlog/calculate`', className: 'text-green-400' },
      { text: ', {\n  ', className: 'text-white/30' },
      { text: 'method', className: 'text-sky-300' },
      { text: ': ', className: 'text-white/30' },
      { text: "'POST'", className: 'text-green-400' },
      { text: ',\n  ', className: 'text-white/30' },
      { text: 'headers', className: 'text-sky-300' },
      { text: ': { ', className: 'text-white/30' },
      { text: "'X-API-Key'", className: 'text-green-400' },
      { text: ': ', className: 'text-white/30' },
      { text: 'API_KEY', className: 'text-white/90' },
      { text: ' },\n  ', className: 'text-white/30' },
      { text: 'body', className: 'text-sky-300' },
      { text: ': ', className: 'text-white/30' },
      { text: 'JSON', className: 'text-white/90' },
      { text: '.', className: 'text-white/30' },
      { text: 'stringify', className: 'text-yellow-300' },
      { text: '({ ', className: 'text-white/30' },
      { text: 'from', className: 'text-sky-300' },
      { text: ': ', className: 'text-white/30' },
      { text: "'KJFK'", className: 'text-green-400' },
      { text: ', ', className: 'text-white/30' },
      { text: 'to', className: 'text-sky-300' },
      { text: ': ', className: 'text-white/30' },
      { text: "'KLAX'", className: 'text-green-400' },
      { text: ' })\n})\n', className: 'text-white/30' },
      { text: 'const ', className: 'text-purple-400' },
      { text: 'navlog', className: 'text-white/90' },
      { text: ' = ', className: 'text-white/30' },
      { text: 'await ', className: 'text-purple-400' },
      { text: 'res', className: 'text-white/90' },
      { text: '.', className: 'text-white/30' },
      { text: 'json', className: 'text-yellow-300' },
      { text: '()', className: 'text-white/30' },
    ],
    response: (
      <>
        <span className="text-white/30">{'{\n'}</span>
        <JsonLine propKey="totalRouteDistance" value={<Num>{2145.8}</Num>} />
        <JsonLine propKey="totalRouteTimeHours" value={<Num>{4.87}</Num>} />
        <JsonLine propKey="totalFuelUsed" value={<Num>{68.3}</Num>} />
        <JsonLine propKey="averageWindComponent" value={<Num>{-12.5}</Num>} />
        <JsonLine
          propKey="legs"
          value={
            <span className="text-white/30">
              [<span className="text-white/20 italic"> ...14 items </span>]
            </span>
          }
          isLast
        />
        <span className="text-white/30">{'}'}</span>
      </>
    ),
  },
]

// ---------------------------------------------------------------------------
// Token rendering — clips tokens to match the typing cursor position
// ---------------------------------------------------------------------------

function renderTokens(tokens: Array<Token>, charLimit: number) {
  let consumed = 0
  return tokens.map((token, i) => {
    if (consumed >= charLimit) return null
    const available = charLimit - consumed
    const text = token.text.slice(0, available)
    consumed += token.text.length
    return (
      <span key={i} className={token.className}>
        {text}
      </span>
    )
  })
}

/** Renders the not-yet-typed portion of tokens as invisible text to reserve height. */
function renderRemainingTokens(tokens: Array<Token>, charLimit: number) {
  let consumed = 0
  return tokens.map((token, i) => {
    const start = consumed
    consumed += token.text.length
    if (consumed <= charLimit) return null
    const untypedStart = Math.max(0, charLimit - start)
    return (
      <span key={`r${i}`} className="invisible" aria-hidden="true">
        {token.text.slice(untypedStart)}
      </span>
    )
  })
}

// ---------------------------------------------------------------------------
// HeroCodeDemo — auto-cycling animated terminal
// ---------------------------------------------------------------------------

type Phase = 'typing' | 'showing' | 'fading'

function HeroCodeDemo() {
  const [exampleIndex, setExampleIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('typing')

  const example = EXAMPLES[exampleIndex]
  const fullText = example.tokens.map((t) => t.text).join('')
  const { displayedText, isComplete } = useTypingEffect({
    text: fullText,
    speed: 18,
  })

  // TYPING → SHOWING: wait for typing to finish
  useEffect(() => {
    if (phase === 'typing' && isComplete && displayedText === fullText) {
      setPhase('showing')
    }
  }, [phase, isComplete, displayedText, fullText])

  // SHOWING → FADING: hold 3s then fade
  useEffect(() => {
    if (phase !== 'showing') return
    const id = setTimeout(() => setPhase('fading'), 3000)
    return () => clearTimeout(id)
  }, [phase])

  // FADING → next TYPING: swap example after 300ms fade-out
  useEffect(() => {
    if (phase !== 'fading') return
    const id = setTimeout(() => {
      setExampleIndex((i) => (i + 1) % EXAMPLES.length)
      setPhase('typing')
    }, 300)
    return () => clearTimeout(id)
  }, [phase])

  const goToExample = (index: number) => {
    if (index === exampleIndex) return
    setExampleIndex(index)
    setPhase('typing')
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-aviation-dark shadow-2xl">
      {/* Terminal chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="mr-2 flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <Terminal className="h-3.5 w-3.5 text-white/40" />
        <span className="text-xs text-white/50">Terminal</span>
        <span className="ml-auto text-xs text-white/40">{example.label}</span>
      </div>

      {/* Content: code + response (fades out together) */}
      <div
        className={
          phase === 'fading'
            ? 'opacity-0 transition-opacity duration-300'
            : 'opacity-100'
        }
      >
        {/* Code */}
        <div className="px-4 py-4">
          <pre className="text-[13px] leading-relaxed sm:text-sm">
            <code>
              {renderTokens(example.tokens, displayedText.length)}
              {!isComplete && (
                <span className="animate-cursor-blink text-accent">
                  &#x2588;
                </span>
              )}
              {renderRemainingTokens(example.tokens, displayedText.length)}
            </code>
          </pre>
        </div>

        {/* Response — always rendered to reserve height; invisible during typing */}
        <div
          className={cn(
            'border-t border-white/10 px-4 py-4',
            phase === 'typing' ? 'invisible' : 'animate-fade-in-up',
          )}
        >
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="text-white/30">Response</span>
            <Badge className="border-green-500/30 bg-green-500/15 text-[10px] text-green-400">
              200 OK
            </Badge>
          </div>
          <pre className="text-[13px] leading-relaxed sm:text-sm">
            <code>{example.response}</code>
          </pre>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-3">
        {EXAMPLES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToExample(i)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === exampleIndex
                ? 'w-6 bg-accent'
                : 'w-1.5 bg-white/20 hover:bg-white/40',
            )}
            aria-label={`Show example: ${EXAMPLES[i].label}`}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HeroSection
// ---------------------------------------------------------------------------

export function HeroSection() {
  const { plans } = usePlans()
  const studentPlan = plans.find((p) => p.id === 'student')
  const freeCallsLabel =
    studentPlan?.limits.callsPerMonth?.toLocaleString() ?? '5,000'

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[6fr_8fr]">
          {/* Left: Copy */}
          <div>
            <img
              src="/preflight_logo_with_text_2.svg"
              alt="PreflightAPI"
              className="mb-6 h-20 w-auto"
            />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              US Aviation Data.{' '}
              <span className="text-accent">Developer-Ready.</span>
            </h1>
            <p className="mt-4 text-lg font-medium text-muted-foreground sm:text-xl">
              Airports, runways, frequencies, NAVAIDs, airspace, NOTAMs,
              obstacles, and more — all with one API key. Your aviation data
              infrastructure, already built.
            </p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Built by a pilot and software engineer. All data sourced from the
              FAA and AWC.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to={isWaitlistMode ? '/waitlist' : '/sign-up'}>
                <Button size="lg" className="gap-2">
                  {isWaitlistMode ? 'Join the Waitlist' : 'Get Started Free'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="outline" size="lg" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  View Documentation
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {freeCallsLabel} calls/month free. No credit card required.
            </p>
          </div>

          {/* Right: Code Demo */}
          <div className="relative min-w-0">
            <HeroCodeDemo />
            {/* Decorative glow */}
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
