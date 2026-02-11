import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/api-reference')({
  beforeLoad: () => {
    throw redirect({ to: '/docs/metars' })
  },
  component: () => null,
})
