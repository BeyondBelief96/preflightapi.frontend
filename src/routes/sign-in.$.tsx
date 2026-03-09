import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-in/$')({
  // Parent route (sign-in.tsx) handles rendering; this route exists
  // only to prevent a TanStack Router 404 for Clerk sub-paths.
  component: () => null,
})
