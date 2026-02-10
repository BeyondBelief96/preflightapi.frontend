import { Check } from 'lucide-react'

const STEP_LABELS = ['Welcome', 'API Key', 'Try It', 'Complete']

interface StepIndicatorProps {
  currentStep: number
  completedSteps: Set<number>
}

export function StepIndicator({
  currentStep,
  completedSteps,
}: StepIndicatorProps) {
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
