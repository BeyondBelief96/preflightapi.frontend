import { ClerkProvider } from '@clerk/tanstack-react-start'
import { dark } from '@clerk/ui/themes'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env.local file')
}

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard/getting-started"
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: 'oklch(0.68 0.13 230)',
          colorBackground: 'oklch(0.18 0.03 245)',
          colorInput: 'oklch(0.14 0.025 245)',
          colorInputForeground: 'oklch(0.93 0.01 240)',
          colorNeutral: 'oklch(0.93 0.01 240)',
          colorDanger: 'oklch(0.55 0.2 25)',
          colorSuccess: 'oklch(0.68 0.14 185)',
          borderRadius: '0.625rem',
          fontFamily:
            "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
