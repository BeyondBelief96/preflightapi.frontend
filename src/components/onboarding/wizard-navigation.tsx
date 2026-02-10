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
