import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { createPageHead } from '@/lib/seo'
import { adminKeys } from '@/lib/server/queries'
import {
  getAdminUserHealthBatch,
  getAdminUsers,
  getFilteredAdminUsers,
} from '@/lib/server/admin/users'
import { AdminUserTable } from '@/components/admin/users/admin-user-table'
import { UserSearchInput } from '@/components/admin/users/user-search-input'
import { UserFilterBar } from '@/components/admin/users/user-filter-bar'

const searchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().catch(''),
  tier: z.enum(['all', 'student', 'private', 'commercial']).catch('all'),
  filter: z
    .enum(['all', 'high-error', 'near-quota', 'high-usage', 'rate-limited'])
    .catch('all'),
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

type TierFilter = 'all' | 'student' | 'private' | 'commercial'
type StatusFilter =
  | 'all'
  | 'high-error'
  | 'near-quota'
  | 'high-usage'
  | 'rate-limited'

function AdminUsersPage() {
  const { page, search, tier, filter } = Route.useSearch()
  const navigate = Route.useNavigate()

  const useAdvancedFilter = filter !== 'all'

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.users(page, search, tier, filter),
    queryFn: () =>
      useAdvancedFilter
        ? getFilteredAdminUsers({
            data: {
              filter: filter,
              page,
              pageSize: 20,
            },
          })
        : getAdminUsers({ data: { page, pageSize: 20, search, tier } }),
    staleTime: 30_000,
  })

  const userIds = (data?.users ?? []).map((u) => u.clerkId)

  const { data: healthData } = useQuery({
    queryKey: adminKeys.userHealth(page, search),
    queryFn: () => getAdminUserHealthBatch({ data: { userIds } }),
    enabled: userIds.length > 0,
    staleTime: 30_000,
  })

  const totalPages = data ? Math.ceil(data.totalCount / 20) : 0

  function updateSearch(updates: {
    page?: number
    search?: string
    tier?: TierFilter
    filter?: StatusFilter
  }) {
    void navigate({
      search: {
        page: updates.page ?? 1,
        search: updates.search ?? search,
        tier: updates.tier ?? tier,
        filter: updates.filter ?? filter,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          {data ? `${data.totalCount} total users` : 'Loading users...'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UserSearchInput
          value={search}
          onChange={(value) => updateSearch({ search: value })}
        />
        <UserFilterBar
          tier={tier}
          filter={filter}
          onTierChange={(value) => updateSearch({ tier: value as TierFilter })}
          onFilterChange={(value) =>
            updateSearch({ filter: value as StatusFilter })
          }
        />
      </div>

      <AdminUserTable
        users={data?.users ?? []}
        healthData={healthData}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={(newPage) => updateSearch({ page: newPage })}
      />
    </div>
  )
}
