import { createFileRoute } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'
import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
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

const steps = [
  {
    id: 'account',
    title: 'Create your account',
    description: 'Sign up for a PreflightAPI account.',
    completed: true,
  },
  {
    id: 'plan',
    title: 'Choose a plan',
    description: 'Select a plan that fits your needs. Start free or upgrade anytime.',
    href: '/dashboard/billing',
    cta: 'View Plans',
  },
  {
    id: 'key',
    title: 'Create an API key',
    description: 'Generate an API key to authenticate your requests.',
    href: '/dashboard/keys',
    cta: 'Create Key',
  },
  {
    id: 'request',
    title: 'Make your first request',
    description: 'Use your API key to fetch aviation data.',
    href: '/docs/getting-started',
    cta: 'View Quick Start Guide',
  },
]

function GettingStartedPage() {
  const { user } = useUser()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">
          Welcome to PreflightAPI{user?.firstName ? `, ${user.firstName}` : ``}!
        </h2>
        <p className="mt-1 text-muted-foreground">
          Follow these steps to get up and running with the API.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={step.completed ? 'border-aviation-success/50 bg-aviation-success/5' : ''}
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="mt-0.5">
                {step.completed ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aviation-success text-white">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold ${step.completed ? `line-through text-muted-foreground` : ``}`}
                >
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
                {step.href && !step.completed && (
                  <Link to={step.href}>
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      {step.cta}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick example */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold">Quick Example</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Once you have your API key, making a request is this simple:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm leading-relaxed text-white/90">
            {`// Fetch current METAR for JFK airport
const response = await fetch(
  "${GATEWAY_URL}/api/v1/metars/KJFK",
  {
    headers: {
      "Ocp-Apim-Subscription-Key": "your-api-key-here"
    }
  }
);

const data = await response.json();
console.log(data.flightCategory); // "VFR"`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
