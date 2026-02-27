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
  users: (page: number, search: string) =>
    [...adminKeys.all, 'users', page, search] as const,
  userDetail: (userId: string) =>
    [...adminKeys.all, 'user-detail', userId] as const,
  userAnalytics: (subscriptionId: string) =>
    [...adminKeys.all, 'user-analytics', subscriptionId] as const,
  abuse: () => [...adminKeys.all, 'abuse'] as const,
  revenue: () => [...adminKeys.all, 'revenue'] as const,
  emailRecipients: (tier: string) =>
    [...adminKeys.all, 'email-recipients', tier] as const,
  emailHistory: () => [...adminKeys.all, 'email-history'] as const,
  emailDetail: (emailId: string) =>
    [...adminKeys.all, 'email-detail', emailId] as const,
}

export const stripeKeys = {
  all: ['stripe'] as const,
  subscription: (userId: string) =>
    [...stripeKeys.all, 'subscription', userId] as const,
}
