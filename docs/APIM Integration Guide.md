# APIM Integration Guide

Reference for building the frontend management portal's APIM integration. This documents the current APIM setup in the test environment and the REST API calls needed to manage subscriptions programmatically.

---

## Current APIM Setup

### Environment Details (Test)

| Resource                | Value                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APIM Service Name       | `preflightapi-apim-service-test`                                                                                                                                                  |
| Resource Group          | `rg-preflightapi-eastus-test`                                                                                                                                                     |
| Gateway URL             | `https://preflightapi-apim-service-test.azure-api.net`                                                                                                                            |
| Management API Base URL | `https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/rg-preflightapi-eastus-test/providers/Microsoft.ApiManagement/service/preflightapi-apim-service-test` |
| API Version             | `2024-05-01`                                                                                                                                                                      |

### Products (Tiers)

| Product ID          | Display Name      | Rate Limit  | Monthly Quota | Subscription Required |
| ------------------- | ----------------- | ----------- | ------------- | --------------------- |
| `free-tier`         | Free Tier         | 10 req/min  | 500/month     | Yes                   |
| `starter-tier`      | Starter Tier      | 60 req/min  | 25,000/month  | Yes                   |
| `professional-tier` | Professional Tier | 300 req/min | 250,000/month | Yes                   |

### Endpoint Access per Tier

| Endpoint                                                        | Free | Starter | Professional |
| --------------------------------------------------------------- | ---- | ------- | ------------ |
| METARs (`/api/v1/metars`)                                       | Yes  | Yes     | Yes          |
| TAFs (`/api/v1/tafs`)                                           | Yes  | Yes     | Yes          |
| Airports (`/api/v1/airports`)                                   | Yes  | Yes     | Yes          |
| Communication Frequencies (`/api/v1/communication-frequencies`) | Yes  | Yes     | Yes          |
| Airspace (`/api/v1/airspaces`)                                  | No   | Yes     | Yes          |
| PIREPs (`/api/v1/pireps`)                                       | No   | Yes     | Yes          |
| AIRSIGMETs (`/api/v1/airsigmets`)                               | No   | Yes     | Yes          |
| G-AIRMETs (`/api/v1/g-airmets`)                                 | No   | Yes     | Yes          |
| Obstacles (`/api/v1/obstacles`)                                 | No   | Yes     | Yes          |
| NOTAMs (`/api/v1/notams`)                                       | No   | Yes     | Yes          |
| Airport Diagrams (`/api/v1/airport-diagrams`)                   | No   | No      | Yes          |
| Chart Supplements (`/api/v1/chart-supplements`)                 | No   | No      | Yes          |
| Performance Calculations (`/api/v1/performance`)                | No   | No      | Yes          |
| Navlog / Flight Planning (`/api/v1/navlog`)                     | No   | No      | Yes          |

### How Customers Use Their API Key

Customers include their subscription key in every request as a header:

```bash
curl -H "Ocp-Apim-Subscription-Key: their-api-key" \
     https://preflightapi-apim-service-test.azure-api.net/api/v1/metars/KJFK
```

No bearer tokens, no OAuth. Just the API key header.

Each subscription has a **primary** and **secondary** key. Both work — the pair exists so customers can rotate keys without downtime.

---

## APIM Management REST API

These are the API calls your server functions need to make to manage APIM subscriptions programmatically. All calls go to the Azure Management REST API (not the APIM gateway).

### Authentication

All Management API calls require an Azure AD access token. Use a service principal with the **API Management Service Contributor** role on the APIM resource.

```
Authorization: Bearer {azure-ad-access-token}
Content-Type: application/json
```

For the frontend server functions, use the `@azure/identity` package with `ClientSecretCredential` or `DefaultAzureCredential` to obtain tokens.

```typescript
import { ClientSecretCredential } from '@azure/identity'

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
const token = await credential.getToken('https://management.azure.com/.default')
// Use token.token in Authorization header
```

### Base URL

All endpoints below are relative to:

```
https://management.azure.com/subscriptions/{azureSubscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.ApiManagement/service/{serviceName}
```

All requests require the query parameter `?api-version=2024-05-01`.

---

### 1. Create an APIM User

When a developer signs up via Clerk, create a corresponding APIM user.

```
PUT /users/{userId}
```

**Request body:**

```json
{
  "properties": {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "state": "active"
  }
}
```

**Notes:**

- Use the Clerk user ID as the `{userId}` to keep them linked.
- The APIM user is just a logical grouping for subscriptions — it has no login capabilities.

---

### 2. Create a Subscription (Generates API Keys)

After Stripe payment succeeds, create an APIM subscription under the correct product.

```
PUT /subscriptions/{subscriptionId}
```

**Request body:**

```json
{
  "properties": {
    "scope": "/products/{productId}",
    "displayName": "jane-doe-starter",
    "ownerId": "/users/{userId}",
    "state": "active"
  }
}
```

**Product IDs for `scope`:**

- Free: `/products/free-tier`
- Starter: `/products/starter-tier`
- Professional: `/products/professional-tier`

**Notes:**

- Generate a unique `{subscriptionId}` (e.g., UUID or Clerk user ID + product).
- The response includes the generated primary and secondary keys.
- Store the `subscriptionId` in your database linked to the Clerk user.

**Response (relevant fields):**

```json
{
  "properties": {
    "primaryKey": "generated-primary-key",
    "secondaryKey": "generated-secondary-key",
    "scope": "/products/starter-tier",
    "state": "active"
  }
}
```

---

### 3. Get Subscription Keys

Display API keys on the developer's dashboard.

```
POST /subscriptions/{subscriptionId}/listSecrets
```

**Response:**

```json
{
  "primaryKey": "a507bfb0f3b946ae89af2ca8f5dea3ca",
  "secondaryKey": "d4e2f1a0b3c546ae89af2ca8f5dea3cb"
}
```

---

### 4. Regenerate Keys

Allow developers to rotate their keys from the dashboard.

```
POST /subscriptions/{subscriptionId}/regeneratePrimaryKey
POST /subscriptions/{subscriptionId}/regenerateSecondaryKey
```

Both return `204 No Content` on success. After regeneration, call `listSecrets` to get the new key.

---

### 5. Change Tier (Upgrade/Downgrade)

When a developer changes their Stripe subscription, update their APIM subscription to the new product.

```
PATCH /subscriptions/{subscriptionId}
```

**Request body:**

```json
{
  "properties": {
    "scope": "/products/professional-tier"
  }
}
```

**Notes:**

- The API keys stay the same — only the product (and therefore rate limits, quotas, and endpoint access) changes.
- This should be triggered by a Stripe webhook (`customer.subscription.updated`).

---

### 6. Suspend a Subscription

When payment fails or a subscription is cancelled, suspend access.

```
PATCH /subscriptions/{subscriptionId}
```

**Request body:**

```json
{
  "properties": {
    "state": "suspended"
  }
}
```

**Notes:**

- Suspended subscriptions return `403` for all API calls.
- You can reactivate by setting `state` back to `"active"`.
- Triggered by Stripe webhook (`invoice.payment_failed` or `customer.subscription.deleted`).

---

### 7. Delete a Subscription

Permanently revoke access (e.g., account deletion).

```
DELETE /subscriptions/{subscriptionId}
```

Returns `204 No Content` on success.

---

### 8. Get Subscription Usage / Analytics

For the usage dashboard, APIM provides built-in analytics via the Reports API.

```
GET /reports/bySubscription?$filter=timestamp ge datetime'{startDate}' and timestamp le datetime'{endDate}'
```

**Response includes per-subscription:**

- `callCountSuccess` — successful requests
- `callCountBlocked` — blocked by rate limit/quota
- `callCountFailed` — backend errors
- `callCountTotal` — total requests
- `bandwidth` — data transferred

---

## Provisioning Flows

### New User Signup

```
1. Developer signs up via Clerk
2. Clerk webhook (user.created) → Server function:
   a. Create APIM user (PUT /users/{clerkUserId})
   b. Create APIM subscription under free-tier (PUT /subscriptions/{subId})
   c. Store subscriptionId linked to Clerk user in your database
   d. Dashboard shows API keys (from subscription creation response)
```

### Tier Upgrade

```
1. Developer clicks "Upgrade to Professional" on dashboard
2. Stripe Checkout creates/updates subscription
3. Stripe webhook (customer.subscription.updated) → Server function:
   a. Determine new product ID from Stripe price/product mapping
   b. Update APIM subscription (PATCH /subscriptions/{subId} with new scope)
   c. Dashboard reflects new tier and limits
   d. API keys remain unchanged
```

### Payment Failure

```
1. Stripe webhook (invoice.payment_failed) → Server function:
   a. Suspend APIM subscription (PATCH /subscriptions/{subId} state=suspended)
   b. Notify developer via email
   c. Dashboard shows "Payment failed — update billing to restore access"
```

### Payment Recovery

```
1. Developer updates payment method, Stripe retries charge
2. Stripe webhook (invoice.payment_succeeded) → Server function:
   a. Reactivate APIM subscription (PATCH /subscriptions/{subId} state=active)
   b. Dashboard restored to normal
```

### Account Deletion

```
1. Clerk webhook (user.deleted) → Server function:
   a. Cancel Stripe subscription
   b. Delete APIM subscription (DELETE /subscriptions/{subId})
   c. Delete APIM user (DELETE /users/{clerkUserId})
   d. Clean up database records
```

---

## Stripe ↔ APIM Product Mapping

Your server functions need a mapping between Stripe products/prices and APIM product IDs. Store this as configuration:

```typescript
const STRIPE_TO_APIM_PRODUCT: Record<string, string> = {
  price_free_monthly: 'free-tier',
  price_starter_monthly: 'starter-tier',
  price_professional_monthly: 'professional-tier',
}
```

When a Stripe webhook fires with a price ID, look up the corresponding APIM product ID and update the subscription accordingly.

---

## Environment Variables Needed

The frontend server functions will need these environment variables:

```env
# Azure AD Service Principal (for APIM Management API calls)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Azure resource identifiers
AZURE_SUBSCRIPTION_ID=your-azure-subscription-id
APIM_RESOURCE_GROUP=rg-preflightapi-eastus-test
APIM_SERVICE_NAME=preflightapi-apim-service-test

# APIM Management API
APIM_API_VERSION=2024-05-01
```

---

## Key Implementation Notes

1. **All APIM Management API calls are server-side only.** Never expose the Azure AD credentials or make Management API calls from the browser.

2. **The APIM gateway URL is public.** Developers call `https://preflightapi-apim-service-test.azure-api.net/...` directly from their applications with their API key.

3. **Subscription keys are the only auth mechanism for the data API.** There are no bearer tokens or OAuth flows for API consumers.

4. **Rate limits and endpoint gating are enforced by APIM policies**, defined in `preflight.api/apim-policies/*.xml`. The data API itself has no auth or rate limiting.

5. **Primary + secondary keys** exist for zero-downtime rotation. Both keys are always valid simultaneously.

6. **Tier changes preserve API keys.** When you PATCH a subscription to a new product, the keys don't change — only the policies (rate limits, quotas, endpoint access) change.

7. **The service principal needs the `API Management Service Contributor` role** on the APIM resource to manage users, subscriptions, and policies.
