import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WizardNavigationProps {
  currentStep: number
  isDataLoading: boolean
  hasKey: boolean
  hasFirstSuccess: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

export function WizardNavigation({
  currentStep,
  isDataLoading,
  hasKey,
  hasFirstSuccess,
  onBack,
  onNext,
  onSkip,
}: WizardNavigationProps) {
  // Hide nav on welcome (has its own CTA), use case (has its own CTA), and complete step
  if (currentStep === 0 || currentStep === 1 || currentStep === 4) {
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

  const showHighlight = currentStep === 3 && hasFirstSuccess
  const nextLabel =
    currentStep === 3
      ? hasFirstSuccess
        ? 'Continue'
        : 'Skip to Finish'
      : 'Continue'
  const nextDisabled = currentStep === 2 && (isDataLoading || !hasKey)

  return (
    <div className="grid grid-cols-3 items-center">
      <div className="justify-self-start">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="justify-self-center text-sm text-muted-foreground hover:text-foreground"
      >
        Skip setup
      </button>

      <div className="justify-self-end">
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          className={`gap-2 ${showHighlight ? 'animate-pulse ring-2 ring-accent/50 ring-offset-2 ring-offset-background' : ''}`}
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
