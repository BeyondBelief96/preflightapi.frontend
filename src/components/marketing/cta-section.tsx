import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="border-t border-border bg-card py-20 text-card-foreground">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to Build?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Get your API key in under a minute. Start with 500 free calls per
          month, no credit card required.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/sign-up">
            <Button
              size="lg"
              className="gap-2"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/docs">
            <Button
              size="lg"
              variant="outline"
            >
              Read the Docs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
