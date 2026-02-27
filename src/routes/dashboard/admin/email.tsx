import { createFileRoute } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmailComposeForm } from '@/components/admin/email/email-compose-form'
import { EmailHistoryTable } from '@/components/admin/email/email-history-table'

export const Route = createFileRoute('/dashboard/admin/email')({
  head: () =>
    createPageHead({
      title: 'Admin - Email',
      description: 'Send broadcasts and manage email communications.',
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
          Send broadcasts to segments, manage topics, and view email history
        </p>
      </div>

      <Tabs defaultValue="broadcast">
        <TabsList>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast">
          <EmailComposeForm />
        </TabsContent>

        <TabsContent value="history">
          <EmailHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
