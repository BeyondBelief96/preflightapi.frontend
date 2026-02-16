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
  tierConfig: () => [...apimKeys.all, 'tier-config'] as const,
}

export const stripeKeys = {
  all: ['stripe'] as const,
  subscription: (userId: string) =>
    [...stripeKeys.all, 'subscription', userId] as const,
}
