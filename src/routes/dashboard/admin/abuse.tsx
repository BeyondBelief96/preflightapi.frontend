import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { createPageHead } from '@/lib/seo'
import { adminKeys } from '@/lib/server/apim-queries'
import { getAbuseIndicators } from '@/lib/server/admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HighErrorUsers } from '@/components/admin/abuse/high-error-users'
import { RateLimitAbusers } from '@/components/admin/abuse/rate-limit-abusers'
import { TrafficSpikes } from '@/components/admin/abuse/traffic-spikes'
import { SuspiciousIps } from '@/components/admin/abuse/suspicious-ips'
import { QuotaExceeders } from '@/components/admin/abuse/quota-exceeders'

export const Route = createFileRoute('/dashboard/admin/abuse')({
  head: () =>
    createPageHead({
      title: 'Admin - Abuse Detection',
      description: 'Monitor suspicious API usage patterns.',
      noIndex: true,
    }),
  component: AbuseDetectionPage,
})

function AbuseDetectionPage() {
  const { data, isLoading } = useQuery({
    queryKey: adminKeys.abuse(),
    queryFn: () => getAbuseIndicators(),
    staleTime: 60_000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abuse Detection</h1>
        <p className="text-muted-foreground">
          Monitor suspicious usage patterns and potential abuse
        </p>
      </div>

      <Tabs defaultValue="errors">
        <TabsList>
          <TabsTrigger value="errors">
            High Server Error Rate
            {data?.highErrorUsers.length
              ? ` (${data.highErrorUsers.length})`
              : ''}
          </TabsTrigger>
          <TabsTrigger value="ratelimit">
            Rate Limits
            {data?.rateLimitAbusers.length
              ? ` (${data.rateLimitAbusers.length})`
              : ''}
          </TabsTrigger>
          <TabsTrigger value="spikes">
            Traffic Spikes
            {data?.trafficSpikes.length
              ? ` (${data.trafficSpikes.length})`
              : ''}
          </TabsTrigger>
          <TabsTrigger value="ips">
            Suspicious IPs
            {data?.suspiciousIps.length
              ? ` (${data.suspiciousIps.length})`
              : ''}
          </TabsTrigger>
          <TabsTrigger value="quota">
            Quota
            {data?.quotaExceeders.length
              ? ` (${data.quotaExceeders.length})`
              : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <HighErrorUsers
            data={data?.highErrorUsers}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="ratelimit">
          <RateLimitAbusers
            data={data?.rateLimitAbusers}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="spikes">
          <TrafficSpikes data={data?.trafficSpikes} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="ips">
          <SuspiciousIps data={data?.suspiciousIps} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="quota">
          <QuotaExceeders
            data={data?.quotaExceeders}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
