import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { createPageHead } from '@/lib/seo'
import { adminKeys } from '@/lib/server/apim-queries'
import { getAdminUsers } from '@/lib/server/admin'
import { AdminUserTable } from '@/components/admin/users/admin-user-table'
import { UserSearchInput } from '@/components/admin/users/user-search-input'

const searchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/dashboard/admin/users/')({
  validateSearch: searchSchema.parse,
  head: () =>
    createPageHead({
      title: 'Admin - Users',
      description: 'Manage platform users.',
      noIndex: true,
    }),
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { page, search } = Route.useSearch()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.users(page, search),
    queryFn: () => getAdminUsers({ data: { page, pageSize: 20, search } }),
    staleTime: 30_000,
  })

  const totalPages = data ? Math.ceil(data.totalCount / 20) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          {data ? `${data.totalCount} total users` : 'Loading users...'}
        </p>
      </div>

      <UserSearchInput
        value={search}
        onChange={(value) =>
          navigate({
            search: { page: 1, search: value },
          })
        }
      />

      <AdminUserTable
        users={data?.users ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={(newPage) =>
          navigate({
            search: { page: newPage, search },
          })
        }
      />
    </div>
  )
}
