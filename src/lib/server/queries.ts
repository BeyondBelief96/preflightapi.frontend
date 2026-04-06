export const apimKeys = {
  all: ['apim'] as const,
  user: (userId: string) => [...apimKeys.all, 'user', userId] as const,
  subscription: (userId: string) =>
    [...apimKeys.all, 'subscription', userId] as const,
  keys: (subscriptionId: string) =>
    [...apimKeys.all, 'keys', subscriptionId] as const,
  usage: (subscriptionId: string, period: string) =>
    [...apimKeys.all, 'usage', subscriptionId, period] as const,
  dailyTrend: (subscriptionId: string) =>
    [...apimKeys.all, 'daily-trend', subscriptionId] as const,
  endpointBreakdown: (subscriptionId: string) =>
    [...apimKeys.all, 'endpoint-breakdown', subscriptionId] as const,
  errorBreakdown: (subscriptionId: string) =>
    [...apimKeys.all, 'error-breakdown', subscriptionId] as const,
  recentErrors: (subscriptionId: string) =>
    [...apimKeys.all, 'recent-errors', subscriptionId] as const,
  rateLimitAccess: (subscriptionId: string) =>
    [...apimKeys.all, 'rate-limit-access', subscriptionId] as const,
  serviceHealth: (subscriptionId: string) =>
    [...apimKeys.all, 'service-health', subscriptionId] as const,
  tierConfig: () => [...apimKeys.all, 'tier-config'] as const,
}

export const healthKeys = {
  all: ['health'] as const,
  system: () => [...healthKeys.all, 'system'] as const,
  dataCurrency: () => [...healthKeys.all, 'data-currency'] as const,
}

export const adminKeys = {
  all: ['admin'] as const,
  isAdmin: () => [...adminKeys.all, 'is-admin'] as const,
  overview: () => [...adminKeys.all, 'overview'] as const,
  dailyTrend: () => [...adminKeys.all, 'daily-trend'] as const,
  topEndpoints: () => [...adminKeys.all, 'top-endpoints'] as const,
  users: (page: number, search: string, tier = 'all', filter = 'all') =>
    [...adminKeys.all, 'users', page, search, tier, filter] as const,
  userHealth: (page: number, search: string) =>
    [...adminKeys.all, 'user-health', page, search] as const,
  userDetail: (userId: string) =>
    [...adminKeys.all, 'user-detail', userId] as const,
  userAnalytics: (subscriptionId: string) =>
    [...adminKeys.all, 'user-analytics', subscriptionId] as const,
  requestLog: (
    subscriptionId: string,
    timeRange: string,
    statusFilter: string,
  ) =>
    [
      ...adminKeys.all,
      'request-log',
      subscriptionId,
      timeRange,
      statusFilter,
    ] as const,
  serviceHealth: () => [...adminKeys.all, 'service-health'] as const,
  errorCorrelation: (timeRange: string) =>
    [...adminKeys.all, 'error-correlation', timeRange] as const,
  endpointTopUsers: (operationId: string) =>
    [...adminKeys.all, 'endpoint-top-users', operationId] as const,
  upgradeSignals: () => [...adminKeys.all, 'upgrade-signals'] as const,
  userActivityHeatmap: (subscriptionId: string) =>
    [...adminKeys.all, 'user-activity-heatmap', subscriptionId] as const,
  globalSearch: (query: string) =>
    [...adminKeys.all, 'global-search', query] as const,
  abuse: () => [...adminKeys.all, 'abuse'] as const,
  revenue: () => [...adminKeys.all, 'revenue'] as const,
  segments: () => [...adminKeys.all, 'segments'] as const,
  topics: () => [...adminKeys.all, 'topics'] as const,
  broadcastHistory: () => [...adminKeys.all, 'broadcast-history'] as const,
  broadcastDetail: (broadcastId: string) =>
    [...adminKeys.all, 'broadcast-detail', broadcastId] as const,
}

export const stripeKeys = {
  all: ['stripe'] as const,
  subscription: (userId: string) =>
    [...stripeKeys.all, 'subscription', userId] as const,
}
