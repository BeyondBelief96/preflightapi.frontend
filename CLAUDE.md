# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev             # Dev server on port 3000 (auto-syncs OpenAPI spec + regenerates types)
npm run build           # Production build (runs lint + API sync first)
npm run start           # Start production server (.output/server/index.mjs)
npm run test            # Run all Vitest tests (vitest run)
npm run test -- <pattern>  # Run a single test file (e.g. npm run test -- stripe-utils)
npm run lint            # ESLint with auto-fix
npm run format          # Prettier check
npm run check           # Prettier --write + ESLint --fix
npm run sync-api        # Fetch OpenAPI spec + regenerate TypeScript types
npx shadcn@latest add <component>  # Add shadcn/ui components
```

## Tech Stack

TanStack Start (React 19, Vite 7, Nitro SSR) with TanStack Router (file-based), Query, Form, and Table. Clerk for auth, Stripe for billing (SDK v20, API `2026-01-28.clover`), Azure APIM for API gateway. Tailwind CSS v4 + shadcn/ui (New York style). TypeScript 5.7 strict mode, Zod v4 for validation. Node 25.6.0 (see `.nvmrc`). Deployed on Vercel.

## Architecture

### Routing (TanStack Router, file-based)

Routes live in `src/routes/`. The route tree is auto-generated at `src/routeTree.gen.ts` — **never edit it manually**.

- `_` prefix = **pathless layout** (wraps children, no URL segment added)
- No prefix = **path-based layout** (adds its name as a URL segment)

| Layout File      | Type       | URL Prefix    | Purpose                                                |
| ---------------- | ---------- | ------------- | ------------------------------------------------------ |
| `__root.tsx`     | Root       | `/`           | HTML shell, providers (Clerk, Query, Toaster)          |
| `_marketing.tsx` | Pathless   | _(none)_      | Public pages (landing, pricing, about, contact, legal) |
| `dashboard.tsx`  | Path-based | `/dashboard/` | Authenticated user pages                               |
| `docs.tsx`       | Path-based | `/docs/`      | API documentation with sidebar + search                |

Sign-in/sign-up routes are at root level (not under `_marketing`). Use `createFileRoute` with the auto-generated path from file location.

### Server Functions (BFF Pattern)

Server-side logic uses `createServerFn()` from `@tanstack/react-start`. Two distinct locations:

**`src/lib/server/`** — Modules imported by server functions:

| Module                    | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `apim.ts`                 | APIM user & subscription management             |
| `apim-client.ts`          | Authenticated Azure APIM REST client            |
| `apim-products.ts`        | APIM product ID mapping (`getApimProductIds`)   |
| `stripe.ts`               | Checkout, portal, subscription management       |
| `stripe-client.ts`        | Stripe SDK singleton                            |
| `stripe-utils.ts`         | Price/plan ID mapping utilities                 |
| `stripe-tier-resolver.ts` | Resolves Stripe price → APIM product ID         |
| `tier-config.ts`          | Dynamic plan data (APIM limits + Stripe prices) |
| `auth.ts`                 | `requireAuth()` helper                          |
| `contact.ts`              | Contact form handler (sends via Resend)         |

**`server/api/`** — Nitro HTTP endpoints (webhooks, public APIs):

| Endpoint            | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `stripe/webhook.ts` | Handles Stripe subscription events, syncs tier changes to APIM |
| `clerk/webhook.ts`  | Clerk user event handlers                                      |
| `openapi.get.ts`    | Serves the OpenAPI JSON spec                                   |

### Server Function Conventions

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'
import { auth } from '@clerk/tanstack-react-start/server'

const myServerFn = createServerFn()
  .inputValidator(z.object({ id: z.string() })) // .inputValidator(), NOT .validator()
  .handler(async ({ data }) => {
    // destructure { data }
    const { userId } = await auth() // no request param needed
  })
```

- Don't use React hooks in `beforeLoad` — it's not a React component context
- `@/` alias maps to `./src/`
- Clerk middleware in `src/start.ts` handles server-side auth

### Subscription Tiers

Three tiers defined in `src/lib/constants.ts`. Plan data (names, limits, prices) is fetched dynamically from APIM and Stripe at runtime — avoid hardcoding tier names or prices in UI.

| Tier             | Plan ID      | APIM Product ID    | Default Price | Calls/Month | Rate Limit  |
| ---------------- | ------------ | ------------------ | ------------- | ----------- | ----------- |
| Student Pilot    | `student`    | `student-pilot`    | Free          | 5,000       | 10 req/min  |
| Private Pilot    | `private`    | `private-pilot`    | $14.99/mo     | 150,000     | 60 req/min  |
| Commercial Pilot | `commercial` | `commercial-pilot` | $49.99/mo     | 750,000     | 300 req/min |

- `ENDPOINT_ACCESS` maps API endpoints to minimum required tier (`EndpointTier`)
- `src/lib/endpoint-registry.ts` is the single source of truth for endpoint categories, doc links, and tier access computation — used by pricing, docs overview, and upgrade banner
- `usePlans()` hook returns dynamic plan data including `endpointAccess` — pass it to registry helpers for dynamic tier resolution

### Stripe Specifics

- Stripe API version `2026-01-28.clover`: `current_period_end` is on `SubscriptionItem`, not `Subscription`
- Portal upgrades change price but NOT custom metadata — price ID takes priority over metadata for tier mapping
- Stripe customer ID stored in Clerk `privateMetadata.stripeCustomerId`
- Price IDs are server-only env vars (differ between test/live): `STRIPE_PRIVATE_PRICE_ID`, `STRIPE_COMMERCIAL_PRICE_ID`
- Checkout is redirect-based (no `@stripe/stripe-js` on client)
- `createCheckoutSession` prevents duplicate subscriptions server-side
- APIM API keys stay the same across tier changes (subscription scope is PATCHed)

### Styling

- Tailwind v4 with oklch color space (aviation-themed dark cockpit aesthetic)
- CSS variables in `src/styles.css`
- `cn()` utility in `src/lib/utils.ts` for Tailwind class merging
- shadcn/ui: New York style, zinc base, configured in `components.json`

### Environment Variables

Validated via T3Env in `src/env.ts`. Frontend vars use `VITE_` prefix. Server-only vars (Stripe keys, Azure credentials) have no prefix. Import as `import { env } from '@/env'`. See `.env.example` for the full list.

### Generated Types

`src/generated/api.ts` is auto-generated from the OpenAPI spec — **never edit manually**. Regenerate with `npm run sync-api`.

## Testing

- **Framework:** Vitest with jsdom environment (`vitest.config.ts` is separate from `vite.config.ts`)
- **Test location:** `src/lib/__tests__/` and `src/lib/server/__tests__/`
- **Run all:** `npm run test`
- **Run one file:** `npm run test -- stripe-utils` (pattern match on filename)
- **Mocking env:** Use `vi.mock('@/env', () => ({ env: { ... } }))` before imports

## Code Style

- No semicolons, single quotes, trailing commas (Prettier)
- ESLint uses `@tanstack/eslint-config`
- `@/` path alias maps to `./src/`
- Run `npm run check` to auto-format and fix all lint issues
