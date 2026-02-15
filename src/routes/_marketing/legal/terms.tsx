import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_marketing/legal/terms')({
  beforeLoad: () => {
    throw redirect({
      href: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=e225b782-9965-4b3c-94b5-0cacdacfb0a3',
    })
  },
  component: () => null,
})
