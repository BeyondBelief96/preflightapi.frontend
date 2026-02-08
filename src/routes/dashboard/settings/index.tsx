import { createFileRoute } from '@tanstack/react-router'
import { UserProfile } from '@clerk/clerk-react'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/dashboard/settings/')({
  head: () =>
    createPageHead({
      title: 'Settings',
      description: 'Account settings.',
      noIndex: true,
    }),
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your profile, email, and security settings.
        </p>
      </div>
      <div className="mx-auto max-w-3xl overflow-hidden rounded-xl">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: 'w-full',
              cardBox: 'w-full shadow-none',
              card: 'shadow-none border rounded-xl',
            },
          }}
        />
      </div>
    </div>
  )
}
