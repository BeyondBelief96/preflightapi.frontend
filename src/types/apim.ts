export type SubscriptionListResponse = {
  value: Array<{
    id: string
    name: string
    properties: {
      ownerId: string
      scope: string
      displayName: string
      state: string
      createdDate: string
      expirationDate: string | null
    }
  }>
}
