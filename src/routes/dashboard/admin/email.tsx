import { createFileRoute } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmailComposeForm } from '@/components/admin/email/email-compose-form'
import { EmailHistoryTable } from '@/components/admin/email/email-history-table'

export const Route = createFileRoute('/dashboard/admin/email')({
  head: () =>
    createPageHead({
      title: 'Admin - Email',
      description: 'Compose and send emails to users.',
      noIndex: true,
    }),
  component: AdminEmailPage,
})

function AdminEmailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Management</h1>
        <p className="text-muted-foreground">
          Compose and send emails to users, view sent email history
        </p>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <EmailComposeForm />
        </TabsContent>

        <TabsContent value="history">
          <EmailHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
