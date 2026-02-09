import { useState, useCallback, useRef } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  Key,
  LayoutDashboard,
  Rocket,
  Zap,
} from 'lucide-react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { createPageHead } from '@/lib/seo'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/docs/copy-button'
import { CodeBlock } from '@/components/docs/code-block'
import { OnboardingPlayground } from '@/components/onboarding/onboarding-playground'
import { TakeoffCelebration } from '@/components/onboarding/takeoff-celebration'
import { getUserSubscription, getSubscriptionKeys } from '@/lib/server/apim'
import { apimKeys } from '@/lib/server/apim-queries'
import { allEndpoints } from '@/lib/docs/spec-parser'
import { GATEWAY_URL } from '@/lib/gateway-url'

export const Route = createFileRoute('/dashboard/getting-started')({
  head: () =>
    createPageHead({
      title: 'Getting Started',
      description: 'Set up your PreflightAPI account.',
      noIndex: true,
    }),
  component: GettingStartedPage,
})

const STEP_LABELS = ['Welcome', 'API Key', 'Try It', 'Complete']

function StepIndicator({
  currentStep,
  completedSteps,
}: {
  currentStep: number
  completedSteps: Set<number>
}) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const isCompleted = completedSteps.has(i)
        const isActive = i === currentStep

        return (
          <div key={label} className="flex items-center">
            {/* Connecting line before (except first) */}
            {i > 0 && (
              <div
                className={`h-0.5 w-8 sm:w-16 ${
                  completedSteps.has(i - 1)
                    ? 'bg-aviation-success'
                    : 'bg-muted'
                }`}
              />
            )}

            <div className="flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-aviation-success text-white'
                    : isActive
                      ? 'bg-accent text-accent-foreground ring-2 ring-accent/30 ring-offset-2 ring-offset-background'
                      : 'border-2 border-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>

              {/* Label (hidden on mobile) */}
              <span
                className={`hidden text-xs sm:block ${
                  isActive
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GettingStartedPage() {
  const { user } = useUser()
  const { userId } = useAuth()
  const navigate = useNavigate()

  const topRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(),
  )
  const [revealKey, setRevealKey] = useState(false)
  const [hasFirstSuccess, setHasFirstSuccess] = useState(false)

  // Pre-fetch subscription and keys data
  const subsQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId,
  })

  const activeSubscription = subsQuery.data?.find(
    (s) => s.state === 'active',
  )

  const keysQuery = useQuery({
    queryKey: apimKeys.keys(activeSubscription?.id ?? ''),
    queryFn: () =>
      getSubscriptionKeys({
        data: { subscriptionId: activeSubscription!.id },
      }),
    enabled: !!activeSubscription?.id,
  })

  const primaryKey = keysQuery.data?.primaryKey ?? ''

  const maskKey = (key: string) =>
    key.slice(0, 6) + '••••••••••••••••••••••••••' + key.slice(-4)

  const metarEndpoint = allEndpoints.find(
    (e) =>
      e.method === 'GET' &&
      e.path === '/api/v1/metars/{icaoCodeOrIdent}',
  )

  const goToStep = useCallback(
    (step: number) => {
      // Mark current step as completed when moving forward
      if (step > currentStep) {
        setCompletedSteps((prev) => {
          const next = new Set(prev)
          next.add(currentStep)
          return next
        })
      }
      setCurrentStep(step)
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    [currentStep],
  )

  const handleComplete = useCallback(async () => {
    if (user) {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingComplete: true,
        },
      })
    }
    navigate({ to: '/dashboard' })
  }, [user, navigate])

  const handleTryItSuccess = useCallback(() => {
    setHasFirstSuccess(true)
  }, [])

  const isDataLoading = subsQuery.isLoading || keysQuery.isLoading

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div ref={topRef} />
      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <WelcomeStep
            firstName={user?.firstName}
            onNext={() => goToStep(1)}
          />
        )}

        {currentStep === 1 && (
          <ApiKeyStep
            isLoading={isDataLoading}
            primaryKey={primaryKey}
            revealKey={revealKey}
            onToggleReveal={() => setRevealKey((r) => !r)}
            maskKey={maskKey}
          />
        )}

        {currentStep === 2 && (
          <TryItStep
            endpoint={metarEndpoint}
            apiKey={primaryKey}
            hasFirstSuccess={hasFirstSuccess}
            onSuccess={handleTryItSuccess}
          />
        )}

        {currentStep === 3 && (
          <CompleteStep onComplete={handleComplete} />
        )}
      </div>

      {/* Navigation Footer */}
      <WizardNavigation
        currentStep={currentStep}
        isDataLoading={isDataLoading}
        hasKey={!!primaryKey}
        hasFirstSuccess={hasFirstSuccess}
        onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
        onNext={() => goToStep(currentStep + 1)}
        onSkip={handleComplete}
      />
    </div>
  )
}

/* ---------- Step Components ---------- */

function WelcomeStep({
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
            Access real-time aviation weather, airport data, NOTAMs, and
            more through a single REST API.
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

function ApiKeyStep({
  isLoading,
  primaryKey,
  revealKey,
  onToggleReveal,
  maskKey,
}: {
  isLoading: boolean
  primaryKey: string
  revealKey: boolean
  onToggleReveal: () => void
  maskKey: (key: string) => string
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
                <code className="flex-1 truncate rounded bg-muted px-3 py-2 font-mono text-sm">
                  {revealKey ? primaryKey : maskKey(primaryKey)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
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
                  className="h-9 w-9 [&_svg]:h-4 [&_svg]:w-4"
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
              code={`curl -H "Ocp-Apim-Subscription-Key: ${maskKey(primaryKey)}" \\
  ${GATEWAY_URL}/api/v1/metars/KJFK`}
              language="bash"
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

function TryItStep({
  endpoint,
  apiKey,
  hasFirstSuccess,
  onSuccess,
}: {
  endpoint: ReturnType<typeof allEndpoints.find>
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
            Try fetching live METAR weather data. Change the ICAO code to
            any airport you like.
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
            Unable to load the METAR endpoint. You can try it later from
            the{' '}
            <Link
              to="/docs"
              className="text-accent hover:underline"
            >
              API documentation
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function CompleteStep({ onComplete }: { onComplete: () => void }) {
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

/* ---------- Wizard Navigation ---------- */

function WizardNavigation({
  currentStep,
  isDataLoading,
  hasKey,
  hasFirstSuccess,
  onBack,
  onNext,
  onSkip,
}: {
  currentStep: number
  isDataLoading: boolean
  hasKey: boolean
  hasFirstSuccess: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}) {
  // Hide nav on welcome (has its own CTA) and complete step
  if (currentStep === 0 || currentStep === 3) {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Skip setup
        </button>
      </div>
    )
  }

  const showHighlight = currentStep === 2 && hasFirstSuccess
  const nextLabel =
    currentStep === 2
      ? hasFirstSuccess
        ? 'Continue'
        : 'Skip to Finish'
      : 'Continue'
  const nextDisabled = currentStep === 1 && (isDataLoading || !hasKey)

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" onClick={onBack}>
        Back
      </Button>

      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Skip setup
      </button>

      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className={`gap-2 ${showHighlight ? 'animate-pulse ring-2 ring-accent/50 ring-offset-2 ring-offset-background' : ''}`}
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
