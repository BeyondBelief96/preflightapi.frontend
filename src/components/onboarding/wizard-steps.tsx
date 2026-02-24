import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Check,
  CloudSun,
  CreditCard,
  Eye,
  EyeOff,
  FlaskConical,
  GraduationCap,
  Key,
  LayoutDashboard,
  Plane,
  Rocket,
  Sparkles,
  Tablet,
  Zap,
} from 'lucide-react'
import type { ParsedEndpoint } from '@/lib/docs/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/docs/copy-button'
import { CodeBlock } from '@/components/docs/code-block'
import { OnboardingPlayground } from '@/components/onboarding/onboarding-playground'
import { TakeoffCelebration } from '@/components/onboarding/takeoff-celebration'
import { maskApiKey } from '@/lib/format'
import { API_BASE_URL } from '@/lib/gateway-url'

export function WelcomeStep({
  firstName,
  onNext,
}: {
  firstName?: string | null
  onNext: () => void
}) {
  return (
    <Card>
      <CardContent className="space-y-6 p-8">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome to PreflightAPI
            {firstName ? `, ${firstName}` : ''}!
          </h2>
          <p className="mt-2 text-muted-foreground">
            Access real-time aviation weather, airport data, NOTAMs, and more
            through a single REST API.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">
            Here is what we will do in the next 2 minutes:
          </p>
          <ul className="space-y-2">
            {[
              { icon: Key, text: 'Get your API key' },
              { icon: Zap, text: 'Make a live API request' },
              { icon: Rocket, text: 'Start building' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15">
                  <Icon className="h-3.5 w-3.5 text-accent" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={onNext} className="gap-2">
          Let's Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

const USE_CASE_OPTIONS = [
  { value: 'flight-school', label: 'Flight School / Training', icon: GraduationCap },
  { value: 'efb', label: 'Electronic Flight Bag', icon: Tablet },
  { value: 'weather', label: 'Weather Briefing Tool', icon: CloudSun },
  { value: 'drone', label: 'Drone / UAV Operations', icon: Plane },
  { value: 'research', label: 'Aviation Research', icon: FlaskConical },
  { value: 'other', label: 'Something Else', icon: Sparkles },
] as const

export function UseCaseStep({
  selectedUseCase,
  onSelect,
  onNext,
}: {
  selectedUseCase: string | null
  onSelect: (value: string) => void
  onNext: () => void
}) {
  return (
    <Card>
      <CardContent className="space-y-6 p-8">
        <div>
          <h2 className="text-2xl font-bold">What Are You Building?</h2>
          <p className="mt-2 text-muted-foreground">
            This helps us understand how you're using PreflightAPI. You can skip this if you
            prefer.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {USE_CASE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all hover:border-accent/50 hover:bg-accent/5 ${
                selectedUseCase === value
                  ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
                  : 'border-border'
              }`}
            >
              <Icon className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <Button onClick={onNext} className="gap-2">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export function ApiKeyStep({
  isLoading,
  primaryKey,
  revealKey,
  onToggleReveal,
}: {
  isLoading: boolean
  primaryKey: string
  revealKey: boolean
  onToggleReveal: () => void
}) {
  return (
    <Card>
      <CardContent className="space-y-6 p-8">
        <div>
          <h2 className="text-2xl font-bold">Your API Key</h2>
          <p className="mt-2 text-muted-foreground">
            Your account has been provisioned with an API key. Use it to
            authenticate every request.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : primaryKey ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Key</label>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-muted px-3 py-2 font-mono text-sm">
                  {revealKey ? primaryKey : maskApiKey(primaryKey)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={onToggleReveal}
                  title={revealKey ? 'Hide key' : 'Reveal key'}
                >
                  {revealKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <CopyButton
                  text={primaryKey}
                  className="h-9 w-9 shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Include this key in the{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                Ocp-Apim-Subscription-Key
              </code>{' '}
              header with every request.
            </p>

            <CodeBlock
              code={`curl -H "Ocp-Apim-Subscription-Key: ${maskApiKey(primaryKey)}" \\
  ${API_BASE_URL}/metars/KJFK`}
              language="bash"
              className="max-w-full"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Unable to load your API key. Please try refreshing the page.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function TryItStep({
  endpoint,
  apiKey,
  hasFirstSuccess,
  onSuccess,
}: {
  endpoint: ParsedEndpoint | undefined
  apiKey: string
  hasFirstSuccess: boolean
  onSuccess: () => void
}) {
  return (
    <Card>
      <CardContent className="space-y-6 p-8">
        <div>
          <h2 className="text-2xl font-bold">Make Your First Request</h2>
          <p className="mt-2 text-muted-foreground">
            Try fetching live METAR weather data. Change the ICAO code to any
            airport you like.
          </p>
        </div>

        {hasFirstSuccess && (
          <div className="flex items-center gap-2 rounded-md border border-aviation-success/30 bg-aviation-success/10 px-4 py-3 text-sm text-aviation-success">
            <Check className="h-4 w-4" />
            Request successful! You're ready for the next step.
          </div>
        )}

        {endpoint ? (
          <OnboardingPlayground
            endpoint={endpoint}
            apiKey={apiKey}
            onSuccess={onSuccess}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Unable to load the METAR endpoint. You can try it later from the{' '}
            <Link to="/docs" className="text-accent hover:underline">
              API documentation
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function CompleteStep({ onComplete }: { onComplete: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-8 p-8">
        <TakeoffCelebration />

        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/docs">
            <Card className="h-full cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <BookOpen className="h-8 w-8 text-accent" />
                <div>
                  <p className="font-medium">Explore the API</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Browse endpoints and examples
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/billing">
            <Card className="h-full cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <CreditCard className="h-8 w-8 text-accent" />
                <div>
                  <p className="font-medium">Upgrade Your Plan</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Unlock more endpoints and calls
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card
            className="h-full cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20"
            onClick={onComplete}
          >
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <LayoutDashboard className="h-8 w-8 text-accent" />
              <div>
                <p className="font-medium">Go to Dashboard</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  View your usage and keys
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
