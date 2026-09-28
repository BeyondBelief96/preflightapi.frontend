/** Query keys for the signed-in user's gateway account, keys and usage. */
export const accountKeys = {
  all: ['account'] as const,
  summary: (userId: string) => [...accountKeys.all, 'summary', userId] as const,
  keys: (userId: string) => [...accountKeys.all, 'keys', userId] as const,
  usage: (userId: string, period: string) =>
    [...accountKeys.all, 'usage', userId, period] as const,
  dailyTrend: (userId: string) =>
    [...accountKeys.all, 'daily-trend', userId] as const,
  endpointBreakdown: (userId: string) =>
    [...accountKeys.all, 'endpoint-breakdown', userId] as const,
  errorBreakdown: (userId: string) =>
    [...accountKeys.all, 'error-breakdown', userId] as const,
  recentErrors: (userId: string) =>
    [...accountKeys.all, 'recent-errors', userId] as const,
  rateLimitAccess: (userId: string) =>
    [...accountKeys.all, 'rate-limit-access', userId] as const,
  serviceHealth: (userId: string) =>
    [...accountKeys.all, 'service-health', userId] as const,
  tierConfig: () => [...accountKeys.all, 'tier-config'] as const,
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
  userAnalytics: (userId: string) =>
    [...adminKeys.all, 'user-analytics', userId] as const,
  requestLog: (userId: string, timeRange: string, statusFilter: string) =>
    [...adminKeys.all, 'request-log', userId, timeRange, statusFilter] as const,
  serviceHealth: () => [...adminKeys.all, 'service-health'] as const,
  errorCorrelation: (timeRange: string) =>
    [...adminKeys.all, 'error-correlation', timeRange] as const,
  endpointTopUsers: (operationId: string) =>
    [...adminKeys.all, 'endpoint-top-users', operationId] as const,
  userActivityHeatmap: (userId: string) =>
    [...adminKeys.all, 'user-activity-heatmap', userId] as const,
  globalSearch: (query: string) =>
    [...adminKeys.all, 'global-search', query] as const,
  userEmail: (userId: string) =>
    [...adminKeys.all, 'user-email', userId] as const,
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
