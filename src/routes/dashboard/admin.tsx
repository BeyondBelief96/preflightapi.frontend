import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { checkIsAdmin } from '@/lib/server/admin/auth'
import { AdminSearchCommand } from '@/components/admin/admin-search-command'

export const Route = createFileRoute('/dashboard/admin')({
  beforeLoad: async () => {
    const admin = await checkIsAdmin()
    if (!admin) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <>
      <AdminSearchCommand />
      <Outlet />
    </>
  )
}
