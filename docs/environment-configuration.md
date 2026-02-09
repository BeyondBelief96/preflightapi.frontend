# Environment Configuration Guide

Complete configuration reference for running PreflightAPI Frontend across all environments.

## Architecture Overview

The app has three layers that need configuration:

1. **Runtime App** — APIM gateway URL, Clerk auth, Stripe billing, Azure AD credentials for APIM Management API
2. **Spec Sync** — Backend swagger URL for fetching the OpenAPI spec (used by `npm run sync-api`)
3. **GitHub Actions** — Spec URLs for CI/CD type generation workflows

## 1. Local Development

All URLs default to the **test** environment. You only need to provide secrets.

### `.env.local`

```env
# --- Clerk (test instance) ---
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# --- APIM Gateway (test) ---
# Optional — defaults to https://preflightapi-apim-service-test.azure-api.net
VITE_APIM_GATEWAY_URL=https://preflightapi-apim-service-test.azure-api.net

# --- Azure AD (for APIM Management API — tier-config, subscription management) ---
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<your-app-registration-client-id>
AZURE_CLIENT_SECRET=<your-app-registration-secret>
AZURE_SUBSCRIPTION_ID=<your-azure-subscription-id>
APIM_RESOURCE_GROUP=<resource-group-containing-apim>
APIM_SERVICE_NAME=preflightapi-apim-service-test

# --- Stripe (test) ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
```

### Spec Sync (automatic)

- `npm run dev` and `npm run build` auto-fetch the latest spec via the `predev`/`prebuild` hooks.
- Default fetch URL: `https://preflightapi-eastus-web-api-test-bmfecfftf6bgemdf.eastus-01.azurewebsites.net/swagger/v1/swagger.json`
- If the backend is unreachable, the build continues with the committed spec.
- To fetch from a local backend: `npm run update-api-spec -- --local` (uses `https://localhost:7014`)

### npm Scripts

| Command | What it does |
|---|---|
| `npm run sync-api` | Fetch latest spec + regenerate TypeScript types + copy spec to `public/` |
| `npm run update-api-spec` | Fetch spec only (saves to `docs/` and `public/`) |
| `npm run update-api-spec -- --local` | Fetch spec from local backend (`https://localhost:7014`) |
| `npm run update-api-spec -- --url <url>` | Fetch spec from a custom URL |
| `npm run generate-api-types` | Regenerate `src/generated/api.ts` from the committed spec |

## 2. Vercel — Develop Branch (Pre-production)

Uses the same **test** resources as local development. Set these in Vercel project settings (Settings > Environment Variables) for the **Preview** environment or scoped to the `develop` branch.

| Variable | Value | Notes |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Test Clerk instance |
| `CLERK_SECRET_KEY` | `sk_test_...` | Test Clerk instance |
| `VITE_APIM_GATEWAY_URL` | `https://preflightapi-apim-service-test.azure-api.net` | Test APIM gateway |
| `AZURE_TENANT_ID` | `<your-tenant-id>` | Same across environments |
| `AZURE_CLIENT_ID` | `<your-client-id>` | Same across environments |
| `AZURE_CLIENT_SECRET` | `<your-client-secret>` | Same across environments |
| `AZURE_SUBSCRIPTION_ID` | `<your-subscription-id>` | Same across environments |
| `APIM_RESOURCE_GROUP` | `<your-resource-group>` | Resource group containing test APIM |
| `APIM_SERVICE_NAME` | `preflightapi-apim-service-test` | **Test** APIM service |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe test mode |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe test webhook secret |
| `STRIPE_STARTER_PRICE_ID` | `price_...` | Stripe test price ID |
| `STRIPE_PROFESSIONAL_PRICE_ID` | `price_...` | Stripe test price ID |

The `prebuild` hook runs during Vercel builds and fetches the latest spec from the test backend if reachable.

## 3. Vercel — Master Branch (Production)

Set these for the **Production** environment in Vercel. Every value differs from test.

| Variable | Value | Notes |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | **Production** Clerk |
| `CLERK_SECRET_KEY` | `sk_live_...` | **Production** Clerk |
| `VITE_APIM_GATEWAY_URL` | `https://preflightapi-apim-service.azure-api.net` | **Production** APIM gateway |
| `AZURE_TENANT_ID` | `<same>` | Same tenant |
| `AZURE_CLIENT_ID` | `<same>` | Same app registration |
| `AZURE_CLIENT_SECRET` | `<same>` | Same secret |
| `AZURE_SUBSCRIPTION_ID` | `<same>` | Same subscription |
| `APIM_RESOURCE_GROUP` | `<your-prod-resource-group>` | **Production** resource group (if different) |
| `APIM_SERVICE_NAME` | `preflightapi-apim-service` | **Production** APIM (no `-test` suffix) |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe live mode |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe live webhook secret |
| `STRIPE_STARTER_PRICE_ID` | `price_...` | Stripe live price ID |
| `STRIPE_PROFESSIONAL_PRICE_ID` | `price_...` | Stripe live price ID |

### Prerequisites before going live

- Production Clerk application (`pk_live_` / `sk_live_` keys)
- Production APIM service deployed with the same product tiers (`free-tier`, `starter-tier`, `professional-tier`)
- Production APIM gateway URL
- Stripe live mode keys and price IDs (switch from test to live in Stripe dashboard)
- Production backend Azure Web App URL (for the swagger spec in CI)

## 4. GitHub Actions

Set these in your repo settings: **Settings > Secrets and variables > Actions > Variables** tab.

These are not secrets — they are publicly accessible swagger endpoint URLs.

| Variable | Value | Purpose |
|---|---|---|
| `TEST_API_SPEC_URL` | `https://preflightapi-eastus-web-api-test-bmfecfftf6bgemdf.eastus-01.azurewebsites.net/swagger/v1/swagger.json` | Spec source for `develop` branch |
| `PROD_API_SPEC_URL` | *(set when production backend is deployed)* | Spec source for `master` branch |

No GitHub secrets are needed. The default `GITHUB_TOKEN` has sufficient permissions via the `permissions` block in the workflow YAML.

### Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | PRs to `develop` / `master` | Lint, build, test |
| `update-api-types.yml` | Push to `develop` / `master`, `repository_dispatch`, manual | Fetches latest spec, regenerates types, creates a PR if anything changed |

### Triggering type updates from backend CI

After your backend deploys, trigger the frontend type update workflow:

```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/BeyondBelief96/preflightapi.frontend/dispatches \
  -d '{"event_type":"api-deployed","client_payload":{"branch":"develop"}}'
```

Replace `develop` with `master` for production deployments.

## Defaults Baked Into Code

These values are hardcoded as fallbacks so local development works with minimal configuration:

| What | Default value | Source file |
|---|---|---|
| APIM Gateway URL | `https://preflightapi-apim-service-test.azure-api.net` | `src/env.ts`, `src/lib/gateway-url.ts` |
| Spec fetch URL | `https://preflightapi-eastus-web-api-test-bmfecfftf6bgemdf.eastus-01.azurewebsites.net` | `scripts/update-api-spec.mjs` |
| CI spec URL (test) | Same as spec fetch URL | `.github/workflows/update-api-types.yml` |
| APIM API version | `2024-05-01` | `src/lib/server/apim-client.ts` |

For local and develop, you only need to provide secrets (Clerk, Azure AD, Stripe). All URLs default to test.

For production, you must explicitly set all URLs and secrets — no production defaults are baked in.
