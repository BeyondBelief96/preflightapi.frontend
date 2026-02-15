import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_marketing/legal/cookie-policy')({
  beforeLoad: () => {
    throw redirect({
      href: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=fafc9eda-4cbf-4a29-ae1c-d3329e8b70e1',
    })
  },
  component: () => null,
})
