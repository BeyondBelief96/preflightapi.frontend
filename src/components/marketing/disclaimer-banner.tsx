import { AlertTriangle } from 'lucide-react'

export function DisclaimerBanner() {
  return (
    <section className="border-t border-border bg-muted/40 py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>
              PreflightAPI sources its data from official providers such as the FAA and NOAA, but this
              service itself has not been approved and they do not endorse the accuracy or completeness of the data.
              This service is not a substitute for official aviation information sources. It is designed for
              supplemental pre-flight planning and application development
              purposes only.
            </p>
            <p>
              Developers integrating this API should ensure their end users
              understand that the information is supplemental in nature. Pilots
              and operators should continue to obtain official briefings from
              FAA-approved sources such as 1800wxbrief.com, the FAA NOTAM
              Search, and certified flight planning tools before any flight.
            </p>
            <p>
              Use of this data for in-flight purposes is entirely at the
              user&apos;s own risk. PreflightAPI assumes no responsibility or
              liability for any decisions made or actions taken based on the
              information provided.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
