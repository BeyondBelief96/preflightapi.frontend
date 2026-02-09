import { PlaneTakeoff } from 'lucide-react'

export function TakeoffCelebration() {
  return (
    <div className="flex flex-col items-center py-4">
      {/* Animation area */}
      <div className="relative h-[200px] w-full overflow-hidden">
        {/* Trail particles */}
        {[
          { bottom: '30%', left: '38%', delay: '0.3s' },
          { bottom: '35%', left: '42%', delay: '0.5s' },
          { bottom: '25%', left: '45%', delay: '0.7s' },
          { bottom: '40%', left: '40%', delay: '0.9s' },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-accent/60 motion-safe:animate-trail-fade"
            style={{
              bottom: pos.bottom,
              left: pos.left,
              animationDelay: pos.delay,
            }}
          />
        ))}

        {/* Airplane */}
        <div
          className="absolute bottom-[20%] left-1/2 -translate-x-1/2 motion-safe:animate-takeoff"
        >
          <PlaneTakeoff className="h-12 w-12 text-accent" />
        </div>
      </div>

      {/* Text */}
      <div
        className="mt-2 text-center opacity-0 motion-safe:animate-fade-in-up"
        style={{ animationDelay: '0.8s' }}
      >
        <h3 className="text-2xl font-bold">Cleared for takeoff!</h3>
        <p className="mt-1 text-muted-foreground">
          Your first API request was a success.
        </p>
      </div>
    </div>
  )
}
