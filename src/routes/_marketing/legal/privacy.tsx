import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_marketing/legal/privacy')({
  beforeLoad: () => {
    throw redirect({
      href: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=f127c333-f59d-407c-ba4e-78c16d6b3d99',
    })
  },
  component: () => null,
})
