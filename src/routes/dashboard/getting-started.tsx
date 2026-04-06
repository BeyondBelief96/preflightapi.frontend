import { useCallback, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/tanstack-react-start'
import { useQuery } from '@tanstack/react-query'
import { createPageHead } from '@/lib/seo'
import { getSubscriptionKeys, getUserSubscription } from '@/lib/server/apim/subscriptions'
import { completeOnboarding } from '@/lib/server/onboarding'
import { apimKeys } from '@/lib/server/queries'
import { allEndpoints } from '@/lib/docs/spec-parser'
import { API_BASE_PATH } from '@/lib/api-metadata'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import {
  ApiKeyStep,
  CompleteStep,
  TryItStep,
  UseCaseStep,
  WelcomeStep,
} from '@/components/onboarding/wizard-steps'
import { WizardNavigation } from '@/components/onboarding/wizard-navigation'

export const Route = createFileRoute('/dashboard/getting-started')({
  head: () =>
    createPageHead({
      title: 'Getting Started',
      description: 'Set up your PreflightAPI account.',
      noIndex: true,
    }),
  component: GettingStartedPage,
})

function GettingStartedPage() {
  const { user } = useUser()
  const { userId } = useAuth()
  const navigate = useNavigate()

  const topRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  type UseCase =
    | 'flight-school'
    | 'efb'
    | 'weather'
    | 'drone'
    | 'research'
    | 'other'
  const [useCase, setUseCase] = useState<UseCase | null>(null)
  const [revealKey, setRevealKey] = useState(false)
  const [hasFirstSuccess, setHasFirstSuccess] = useState(false)

  // Pre-fetch subscription and keys data
  const subsQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId,
  })

  const activeSubscription = subsQuery.data?.find((s) => s.state === 'active')

  const keysQuery = useQuery({
    queryKey: apimKeys.keys(activeSubscription?.id ?? ''),
    queryFn: () =>
      getSubscriptionKeys({
        data: { subscriptionId: activeSubscription!.id },
      }),
    enabled: !!activeSubscription?.id,
  })

  const primaryKey = keysQuery.data?.primaryKey ?? ''

  const metarEndpoint = allEndpoints.find(
    (e) =>
      e.method === 'GET' &&
      e.path === `${API_BASE_PATH}/metars/{icaoCodeOrIdent}`,
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
      // Mark onboarding complete once the user reaches the Try It step
      if (step === 3) {
        completeOnboarding({ data: { useCase } }).catch((err) => {
          console.error('Failed to mark onboarding complete:', err)
        })
      }
      setCurrentStep(step)
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    [currentStep, useCase],
  )

  const handleComplete = useCallback(() => {
    navigate({ to: '/dashboard' })
  }, [navigate])

  const handleTryItSuccess = useCallback(() => {
    setHasFirstSuccess(true)
  }, [])

  const isDataLoading = subsQuery.isLoading || keysQuery.isLoading

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div ref={topRef} />
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <WelcomeStep firstName={user?.firstName} onNext={() => goToStep(1)} />
        )}

        {currentStep === 1 && (
          <UseCaseStep
            selectedUseCase={useCase}
            onSelect={(v) => setUseCase(v as UseCase)}
            onNext={() => goToStep(2)}
          />
        )}

        {currentStep === 2 && (
          <ApiKeyStep
            isLoading={isDataLoading}
            primaryKey={primaryKey}
            revealKey={revealKey}
            onToggleReveal={() => setRevealKey((r) => !r)}
          />
        )}

        {currentStep === 3 && (
          <TryItStep
            endpoint={metarEndpoint}
            apiKey={primaryKey}
            hasFirstSuccess={hasFirstSuccess}
            onSuccess={handleTryItSuccess}
          />
        )}

        {currentStep === 4 && <CompleteStep onComplete={handleComplete} />}
      </div>

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
