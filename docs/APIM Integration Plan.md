# APIM Integration & Content Update Plan

## Context

The PreflightAPI backend is now behind Azure API Management (APIM) and is no longer directly accessible. The frontend needs to:
1. Integrate with APIM's Management REST API for subscription/key management
2. Align all pricing, marketing, and documentation content with the actual APIM tiers
3. Use environment-based gateway URLs (dev test URL by default, production via env var)

**Key decisions from user:**
- APIM product IDs: `free-tier`, `starter-tier`, `professional-tier`
- Tier names: Free, Starter (renamed from Standard), Professional
- Pricing: $0 / $29.99 / $79.99 per month
- Quotas: 500 / 25,000 / 250,000 calls per month
- Rate limits: 10 / 60 / 300 requests per minute
- Enterprise tier removed entirely
- Dev gateway: `https://preflightapi-apim-service-test.azure-api.net` (default)
- Production gateway: set via `VITE_APIM_GATEWAY_URL` env var at deploy time

---

## Phase 1: Configuration & Constants (Foundation)

### 1A. Update `src/env.ts`
- **Remove**: `AZURE_APIM_GATEWAY_URL`, `AZURE_APIM_MANAGEMENT_URL`, `AZURE_APIM_SAS_TOKEN`
- **Add server vars**: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_SUBSCRIPTION_ID`, `APIM_RESOURCE_GROUP`, `APIM_SERVICE_NAME`, `APIM_API_VERSION` (all `.optional()`)
- **Add client var**: `VITE_APIM_GATEWAY_URL` with default `https://preflightapi-apim-service-test.azure-api.net`

### 1B. Update `src/lib/constants.ts`
- Rename Standard to Starter (`id: 'starter'`, `name: 'Starter'`)
- Remove Enterprise plan entirely (3 plans total)
- Fix APIM product IDs: `free-tier`, `starter-tier`, `professional-tier`
- Fix prices: $0 / $29.99 / $79.99
- Fix quotas: 500 / 25,000 / 250,000
- Update features lists per the APIM endpoint access matrix
- Move `highlighted: true` to Starter
- Add `ENDPOINT_ACCESS` constant mapping each endpoint to tier availability (used by pricing comparison table and docs tier badges)

### 1C. Update `src/types/plans.ts`
- Change `PlanId` to `'free' | 'starter' | 'professional'`
- Add `ApimSubscription` and `ApimUsageReport` interfaces for server function return types

### 1D. Create `src/lib/gateway-url.ts`
- Export `GATEWAY_URL` constant reading from `VITE_APIM_GATEWAY_URL` env var with dev default fallback

**Verify:** Dev server boots, pricing page renders 3 tiers with correct numbers.

---

## Phase 2: APIM Server Functions (Backend Integration)

### 2A. Install dependency
- `npm install @azure/identity` (Azure AD auth for Management API)

### 2B. Create `src/lib/server/apim-client.ts`
- `ClientSecretCredential` singleton from `@azure/identity`
- Builds APIM Management API base URL from env vars
- `apimFetch(path, options)` helper: acquires Bearer token, appends `?api-version=2024-05-01`, calls Management API

### 2C. Create `src/lib/server/apim.ts` (server functions via `createServerFn`)
Each function authenticates via Clerk, then calls `apimFetch`:

| Function | APIM Operation | Used By |
|----------|---------------|---------|
| `getOrCreateApimUser` | `PUT /users/{clerkUserId}` | Signup / first dashboard visit |
| `createSubscription` | `PUT /subscriptions/{subId}` | After signup (free tier) or Stripe payment |
| `getUserSubscription` | `GET /users/{userId}/subscriptions` | Dashboard overview, billing, keys |
| `getSubscriptionKeys` | `POST /subscriptions/{subId}/listSecrets` | Keys page |
| `regenerateKey` | `POST /subscriptions/{subId}/regenerate{Primary\|Secondary}Key` | Keys page |
| `changeTier` | `PATCH /subscriptions/{subId}` with new scope | Billing/upgrade flow |
| `suspendSubscription` | `PATCH /subscriptions/{subId}` state=suspended | Stripe webhook (future) |
| `deleteSubscription` | `DELETE /subscriptions/{subId}` | Account deletion (future) |
| `getUsageAnalytics` | `GET /reports/bySubscription` with date filter | Dashboard overview, billing |

### 2D. Create `src/lib/server/apim-queries.ts`
- TanStack Query key factories: `apimKeys.subscription(userId)`, `apimKeys.keys(subId)`, `apimKeys.usage(subId, period)`

**Verify:** Server functions can be imported without build errors. With Azure credentials configured, test `getOrCreateApimUser` and `createSubscription` manually.

---

## Phase 3: Dashboard Routes (Live Data)

### 3A. `src/routes/dashboard/keys/index.tsx`
- Replace mock `useState` key management with TanStack Query calling `getUserSubscription` + `getSubscriptionKeys`
- Show **primary + secondary key** cards (APIM model) instead of arbitrary named keys
- Each key card: masked value, copy button, regenerate button (calls `regenerateKey` mutation)
- Update usage example: `Ocp-Apim-Subscription-Key` header, gateway URL from env
- Remove "Create Key" dialog and environment selector (not applicable to APIM model)

### 3B. `src/routes/dashboard/billing/index.tsx`
- Fetch real subscription via `getUserSubscription` to determine current tier
- Fetch real usage via `getUsageAnalytics` for progress bar
- "Upgrade Plan" button links to `/pricing` (Stripe checkout is future work)

### 3C. `src/routes/dashboard/index.tsx`
- Replace `--` placeholder stats with real data from `getUsageAnalytics`
- Show: API Calls Today, Calls This Month, Subscription Status, Current Plan

**Verify:** Dashboard pages load with real APIM data when credentials are configured. Without credentials, graceful error/loading states.

---

## Phase 4: Marketing & Pricing Pages

### 4A. `src/routes/_marketing/pricing.tsx`
- Change grid from `lg:grid-cols-4` to `lg:grid-cols-3`
- Update `comparisonFeatures` to use `free | starter | professional` keys (remove `enterprise`)
- Rebuild comparison table data from `ENDPOINT_ACCESS` constant
- Table columns: 4 (label + 3 plans) instead of 5

### 4B. `src/components/marketing/pricing-preview.tsx`
- Grid becomes `lg:grid-cols-3` (auto-renders 3 plans from updated `PLANS`)
- Remove Enterprise-specific "Contact Sales" link logic

### 4C. `src/components/marketing/hero-section.tsx`
- Update code example: `Ocp-Apim-Subscription-Key` header, gateway URL
- Update "1,000 API calls/month" to "500 API calls/month"

**Verify:** `/pricing` and `/` show 3 tiers, correct prices ($0/$29.99/$79.99), correct quotas, correct endpoint access in comparison table.

---

## Phase 5: Documentation Pages

### 5A. Create `src/components/docs/tier-badge.tsx`
- Small badge component showing minimum tier required (Free / Starter+ / Professional)
- Color-coded: green (Free), blue (Starter+), purple (Professional)

### 5B. Update core docs pages

| File | Changes |
|------|---------|
| `docs/getting-started.tsx` | `Ocp-Apim-Subscription-Key` header, gateway URL, "500 calls/month" |
| `docs/authentication.tsx` | Full rewrite of header name, primary/secondary key model, APIM gateway host |
| `docs/rate-limits.tsx` | Plan table auto-updates from `PLANS`; update response header names if needed |
| `docs/errors.tsx` | Verify error format matches APIM responses |

### 5C. Update all 17 endpoint doc pages (bulk change)
Each page gets the same 3 changes:
1. Replace `https://api.preflightapi.com/v1/` with `${GATEWAY_URL}/api/v1/`
2. Replace `X-Api-Key` with `Ocp-Apim-Subscription-Key`
3. Add `<TierBadge>` next to endpoint title showing minimum required tier

**Endpoint tier mapping:**
- **Free**: metar, taf, airports/search, airports/details, airports/runways, airports/frequencies
- **Starter+**: pirep, airmet-sigmet, g-airmet, airspace/controlled, airspace/special-use, navigation/obstacles, notams
- **Professional**: airports/diagrams, charts/supplements, performance/calculator, navigation/nav-log

### 5D. Update non-docs references
- `src/routes/dashboard/keys/index.tsx` usage example (header + URL)
- `src/components/marketing/hero-section.tsx` code example (header + URL)
- `src/components/marketing/endpoint-showcase.tsx` (verify paths match APIM routing)

**Verify:** Global search for `api.preflightapi.com` and `X-Api-Key` returns zero results. Every docs page shows correct gateway URL and header.

---

## Dependency Graph

```
Phase 1 (Config) ← no deps
  ├──→ Phase 2 (Server Functions) → Phase 3 (Dashboard)
  ├──→ Phase 4 (Marketing)
  └──→ Phase 5 (Docs)
```

Phases 4 and 5 can run in parallel with Phases 2-3.

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/server/apim-client.ts` | Azure AD auth + Management API fetch wrapper |
| `src/lib/server/apim.ts` | All APIM server functions (`createServerFn`) |
| `src/lib/server/apim-queries.ts` | TanStack Query key factories |
| `src/lib/gateway-url.ts` | Gateway URL constant from env var |
| `src/components/docs/tier-badge.tsx` | Tier requirement badge for docs |

## New Dependency

- `@azure/identity` (Azure AD authentication)

## End-to-End Verification

1. `npm run dev` boots without errors
2. `/pricing` shows 3 tiers: Free ($0), Starter ($29.99), Professional ($79.99)
3. Comparison table shows correct endpoint access per tier
4. `/docs/getting-started` shows `Ocp-Apim-Subscription-Key` header and test gateway URL
5. All 17 endpoint doc pages show correct header, URL, and tier badge
6. Global search for `api.preflightapi.com`, `X-Api-Key`, `preflight-free`, `preflight-standard`, `preflight-pro`, `enterprise` returns zero results in source
7. With APIM credentials: `/dashboard/keys` shows real primary/secondary keys, `/dashboard` shows real usage stats
8. Without APIM credentials: dashboard pages show graceful loading/error states
