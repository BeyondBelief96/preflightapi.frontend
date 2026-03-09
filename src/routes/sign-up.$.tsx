import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-up/$')({
  // Parent route (sign-up.tsx) handles rendering; this route exists
  // only to prevent a TanStack Router 404 for Clerk sub-paths.
  component: () => null,
})
