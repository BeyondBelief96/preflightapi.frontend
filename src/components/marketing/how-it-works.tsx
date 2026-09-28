import { Code, Key, UserPlus } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create a free account in seconds. No credit card required.',
  },
  {
    icon: Key,
    title: 'Get Your API Key',
    description:
      'Create a key from your dashboard in one click. Copy it — it is shown only once.',
  },
  {
    icon: Code,
    title: 'Start Building',
    description: 'Make your first API call. 40+ endpoints, one API key.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Getting started
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in minutes
          </h2>
        </div>
        <div className="relative mt-16">
          {/* Connector line (desktop only) */}
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-border lg:block" />
          <div className="grid gap-10 lg:grid-cols-3">
            {steps.map((step, index) => (
              <FadeIn key={step.title} delay={index * 150}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Numbered circle */}
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent/30 bg-card">
                    <step.icon className="h-8 w-8 text-accent" />
                    <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
