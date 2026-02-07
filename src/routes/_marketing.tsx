import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'

export const Route = createFileRoute('/_marketing')({
  component: MarketingLayout,
})

function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
