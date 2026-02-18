# PreflightAPI Frontend

The frontend application for [PreflightAPI](https://preflightapi.io) — an aviation data API that provides developers with real-time access to METARs, TAFs, NOTAMs, airport information, airspace data, and flight planning tools through a modern REST API.

Built with [TanStack Start](https://tanstack.com/start), React 19, and deployed on Vercel.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [Routing](#routing)
  - [Server Functions (BFF Pattern)](#server-functions-bff-pattern)
  - [Authentication](#authentication)
  - [Subscription Tiers](#subscription-tiers)
  - [Stripe Billing](#stripe-billing)
  - [Azure APIM Integration](#azure-apim-integration)
- [Styling](#styling)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Spec Synchronization](#api-spec-synchronization)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Code Style](#code-style)
- [Useful References](#useful-references)

## Tech Stack

| Category        | Technology                                            |
| --------------- | ----------------------------------------------------- |
| **Framework**   | TanStack Start (SSR via Nitro)                        |
| **UI**          | React 19, Tailwind CSS v4, shadcn/ui (New York style) |
| **Routing**     | TanStack Router (file-based)                          |
| **Data**        | TanStack Query, TanStack Form, TanStack Table         |
| **Auth**        | Clerk                                                 |
| **Payments**    | Stripe (SDK v20, API `2026-01-28.clover`)             |
| **API Gateway** | Azure API Management                                  |
| **Validation**  | Zod v4                                                |
| **Build**       | Vite 7                                                |
| **Language**    | TypeScript 5.7 (strict mode)                          |
| **Deployment**  | Vercel                                                |
| **Node**        | 25.6.0 (see `.nvmrc`)                                 |

## Prerequisites

- **Node.js 25.6.0** — install via [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows), then run `nvm use` in the project root
- **npm 11+** (ships with Node 25)
- Access credentials for Clerk, Stripe, Azure APIM, and Resend (see [Environment Variables](#environment-variables))

## Getting Started

1. **Clone the repo**

   ```bash
   git clone https://github.com/BeyondBelief96/preflightapi.frontend.git
   cd preflightapi.frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in the values — see [Environment Variables](#environment-variables) for details.

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`. On startup, the `predev` script automatically fetches the latest OpenAPI spec from the backend and regenerates TypeScript types. If the backend is unreachable it falls back to the existing spec file.

## Project Structure

```
preflightapi.frontend/
├── .github/workflows/     # CI pipeline (lint, build, test)
├── docs/                  # OpenAPI spec + planning documents
├── public/                # Static assets (favicon, images, manifest)
├── scripts/               # Build & deployment scripts
├── server/                # Nitro HTTP endpoints (webhooks)
│   └── api/
│       ├── clerk/         # Clerk webhook handler
│       ├── stripe/        # Stripe webhook handler
│       └── openapi.get.ts # Serves the OpenAPI spec
├── src/
│   ├── components/        # React components
│   │   ├── dashboard/     # Dashboard pages (billing, keys, usage)
│   │   ├── docs/          # API documentation components
│   │   ├── marketing/     # Landing page, pricing, footer
│   │   ├── onboarding/    # Getting-started wizard
│   │   └── ui/            # shadcn/ui primitives
│   ├── generated/         # Auto-generated API types from OpenAPI spec
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Third-party setup (Clerk, TanStack Query)
│   ├── lib/               # Utilities + server-side logic
│   │   ├── docs/          # Doc page utilities (spec parser, search)
│   │   └── server/        # BFF server functions (APIM, Stripe, auth)
│   ├── routes/            # File-based routing (TanStack Router)
│   ├── types/             # Shared TypeScript types
│   ├── env.ts             # Environment variable validation (T3Env + Zod)
│   ├── router.tsx         # Router configuration
│   ├── start.ts           # TanStack Start entry + Clerk middleware
│   └── styles.css         # Global styles + CSS variables (Tailwind v4)
├── .env.example           # Required environment variables
├── .nvmrc                 # Node version (25.6.0)
├── CLAUDE.md              # AI assistant instructions
├── components.json        # shadcn/ui component config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Key files to know

| File                   | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `src/routeTree.gen.ts` | Auto-generated route tree — **never edit manually**    |
| `src/env.ts`           | T3Env validation for all environment variables         |
| `src/lib/constants.ts` | Tier definitions, endpoint access map, site config     |
| `src/lib/utils.ts`     | `cn()` utility for Tailwind class merging              |
| `vite.config.ts`       | Vite + Nitro + Tailwind + TanStack Start plugin config |
| `components.json`      | shadcn/ui configuration (New York style, zinc base)    |

## Architecture

### Routing

This project uses **TanStack Router with file-based routing**. Routes are defined as files under `src/routes/` and a route tree is auto-generated at `src/routeTree.gen.ts`.

**Key routing conventions:**

- Files prefixed with `_` are **pathless layouts** — they wrap child routes without adding a URL segment
- Files without a `_` prefix are **path-based layouts** — they add their name as a URL segment

**Layout structure:**

| Layout File      | Type       | URL Prefix    | Purpose                                                |
| ---------------- | ---------- | ------------- | ------------------------------------------------------ |
| `__root.tsx`     | Root       | `/`           | HTML shell, providers (Clerk, Query, Toaster)          |
| `_marketing.tsx` | Pathless   | _(none)_      | Public pages (landing, pricing, about, contact, legal) |
| `dashboard.tsx`  | Path-based | `/dashboard/` | Authenticated user pages                               |
| `docs.tsx`       | Path-based | `/docs/`      | API documentation with sidebar                         |

**Full route map:**

```
/                              Landing page
/pricing                       Pricing page
/about                         About page
/contact                       Contact form
/legal/terms                   Terms of service
/legal/privacy                 Privacy policy
/sign-in                       Clerk sign-in
/sign-up                       Clerk sign-up
/waitlist                      Waitlist (when VITE_WAITLIST_MODE=true)

/dashboard                     Overview
/dashboard/getting-started     Onboarding wizard
/dashboard/keys                API key management
/dashboard/billing             Subscription & billing
/dashboard/settings            Account settings

/docs                          Documentation home
/docs/getting-started          Quick start guide
/docs/authentication           Auth docs
/docs/rate-limits              Rate limit docs
/docs/errors                   Error reference
/docs/api-reference            Full API reference
/docs/openapi                  OpenAPI spec viewer
/docs/metars                   METAR endpoint docs
/docs/tafs                     TAF endpoint docs
/docs/pireps                   PIREP endpoint docs
/docs/airmets-sigmets          AIRMET/SIGMET docs
/docs/g-airmets                G-AIRMET docs
/docs/airports                 Airport endpoint docs
/docs/airport-diagrams         Airport diagram docs
/docs/chart-supplements        Chart supplement docs
/docs/communication-frequencies  Frequency docs
/docs/airspace                 Airspace endpoint docs
/docs/obstacles                Obstacle endpoint docs
/docs/notams                   NOTAM endpoint docs
/docs/e6b                      E6B flight computer docs
/docs/nav-log                  Nav log docs
/docs/data-models              Data model index
/docs/data-models/:group       Dynamic data model group pages
```

**Adding a new route:** Create a file in `src/routes/` following the directory structure above. TanStack Router will auto-generate the route tree entry. Use `createFileRoute` to define the route component:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/my-new-page')({
  component: MyNewPage,
})

function MyNewPage() {
  return <div>Hello</div>
}
```

### Server Functions (BFF Pattern)

Server-side logic uses the **Backend for Frontend (BFF)** pattern via TanStack Start's `createServerFn()`. These functions run on the server (Nitro) and are called from React components as if they were local async functions.

**Server function modules** (`src/lib/server/`):

| Module             | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `apim.ts`          | APIM user & subscription management                           |
| `apim-client.ts`   | Authenticated Azure APIM REST client                          |
| `apim-products.ts` | APIM product ID mapping                                       |
| `apim-queries.ts`  | TanStack Query keys for APIM data                             |
| `stripe.ts`        | Checkout, portal, subscription management                     |
| `stripe-client.ts` | Stripe SDK singleton                                          |
| `stripe-utils.ts`  | Price/plan ID mapping utilities                               |
| `tier-config.ts`   | Dynamic plan data (APIM limits + Stripe prices, cached 5 min) |
| `auth.ts`          | `requireAuth()` and `requireOwnership()` helpers              |
| `api-proxy.ts`     | Gateway proxy for authenticated API calls                     |
| `contact.ts`       | Contact form handler (sends via Resend)                       |
| `health.ts`        | Health check endpoint                                         |

**Conventions for writing server functions:**

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'
import { auth } from '@clerk/tanstack-react-start/server'

const myServerFn = createServerFn()
  .inputValidator(z.object({ id: z.string() })) // Use .inputValidator(), NOT .validator()
  .handler(async ({ data }) => {
    // Destructure { data } from handler arg
    const { userId } = await auth() // No request param needed
    // ... server-side logic
  })
```

**HTTP endpoints** (`server/api/`) — for webhooks and other external-facing routes:

| Endpoint            | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `stripe/webhook.ts` | Handles Stripe subscription events, syncs tier changes to APIM |
| `clerk/`            | Clerk webhook handlers                                         |
| `openapi.get.ts`    | Serves the OpenAPI JSON spec                                   |

> **Note:** `src/lib/server/` contains modules imported by server functions. `server/api/` contains Nitro HTTP endpoints (webhooks, public APIs). These are different concerns.

### Authentication

Authentication is handled by [Clerk](https://clerk.com):

- **Provider:** `src/integrations/clerk/provider.tsx` wraps the app with `ClerkProvider`
- **Middleware:** `src/start.ts` applies `clerkMiddleware()` to all server requests
- **Redirects:** After sign-in goes to `/dashboard`, after sign-up goes to `/dashboard/getting-started`
- **Server-side auth:** Use `auth()` from `@clerk/tanstack-react-start/server` in server functions — no request parameter needed
- **Stripe link:** Stripe customer ID is stored in Clerk's `privateMetadata.stripeCustomerId`

> **Important:** Do not use React hooks inside `beforeLoad` route functions — they are not React component contexts.

### Subscription Tiers

Three subscription tiers. Plan data (names, limits, prices) is fetched dynamically from APIM and Stripe at runtime:

| Tier             | Plan ID      | APIM Product ID    | Default Price | Default Calls/Month | Rate Limit  |
| ---------------- | ------------ | ------------------ | ------------- | ------------------- | ----------- |
| Student Pilot    | `student`    | `student-pilot`    | Free          | 5000                | 10 req/min  |
| Private Pilot    | `private`    | `private-pilot`    | $14.99/mo     | 150,000             | 60 req/min  |
| Commercial Pilot | `commercial` | `commercial-pilot` | $49.99/mo     | 750,000             | 300 req/min |
| ATP              | `atp`        | `atp`              | $149.99/mo    | 2,000,000           | 500 req/min |

- `ENDPOINT_ACCESS` in `src/lib/constants.ts` maps each API endpoint to its minimum required tier
- UI pages use the `usePlans()` hook for dynamic plan data — avoid hardcoding tier names or prices
- `TIER_FEATURES` in `src/lib/constants.ts` defines static marketing feature lists per tier

### Stripe Billing

- **Checkout:** Redirect-based (no `@stripe/stripe-js` needed on the client)
- **Portal:** Stripe's hosted customer portal for managing subscriptions
- **Webhook:** `server/api/stripe/webhook.ts` listens for subscription events and syncs tier changes to APIM
- **Price mapping:** Price IDs are server-only env vars that differ between test and live environments
- **Clover API note:** In Stripe API version `2026-01-28.clover`, `current_period_end` is on `SubscriptionItem`, not `Subscription`
- **Portal upgrades:** Change the price but not custom metadata — price ID takes priority over metadata for tier mapping
- **Duplicate guard:** `createCheckoutSession` prevents duplicate subscriptions server-side
- **Legacy IDs:** `normalizePlanId()` handles old `free`/`starter`/`professional` metadata from before the tier rename

### Azure APIM Integration

Azure API Management sits between consumers and the backend API:

- **User management:** APIM users are created/linked when a Clerk user first accesses the dashboard
- **Subscription scoping:** API keys are scoped to APIM products (tiers). On tier change, the subscription scope is PATCHed — keys stay the same
- **Azure credentials:** Service principal auth via `@azure/identity` (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`)
- **Product IDs:** Configured via env vars (`APIM_STUDENT_PRODUCT_ID`, `APIM_PRIVATE_PRODUCT_ID`, `APIM_COMMERCIAL_PRODUCT_ID`)

## Styling

- **Tailwind CSS v4** with oklch color space
- **Theme:** Aviation-themed dark cockpit aesthetic — deep navy backgrounds, sky-blue accents
- **CSS variables:** Defined in `src/styles.css` using oklch values
- **shadcn/ui:** New York style variant, configured in `components.json`
- **Fonts:** Inter (body), JetBrains Mono (code) — loaded from Google Fonts
- **Utility:** `cn()` from `src/lib/utils.ts` for merging Tailwind classes (`clsx` + `tailwind-merge`)

**Adding a shadcn/ui component:**

```bash
pnpm dlx shadcn@latest add <component>
```

**Aviation-specific CSS variables** (defined in `src/styles.css`):

| Variable             | Purpose                           |
| -------------------- | --------------------------------- |
| `--aviation-sky`     | Sky blue accent                   |
| `--aviation-navy`    | Deep navy for panels              |
| `--aviation-dark`    | Darkest background                |
| `--aviation-runway`  | Muted gray for secondary elements |
| `--aviation-warning` | Amber warning color               |
| `--aviation-success` | Green success color               |

## Environment Variables

All environment variables are validated at startup via [T3Env](https://env.t3.gg/) in `src/env.ts`. Copy `.env.example` to `.env` and fill in the values.

### Client-side (`VITE_` prefix — exposed to browser)

| Variable                     | Description                                 | Default       |
| ---------------------------- | ------------------------------------------- | ------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key                       | _(required)_  |
| `VITE_WAITLIST_MODE`         | Enable waitlist mode (`"true"` / `"false"`) | `"false"`     |
| `VITE_APIM_GATEWAY_URL`      | API gateway base URL                        | test instance |
| `VITE_APP_TITLE`             | App title override                          | _(optional)_  |

### Server-side (never exposed to browser)

| Variable                     | Description                          | Default            |
| ---------------------------- | ------------------------------------ | ------------------ |
| **Clerk**                    |                                      |                    |
| `CLERK_SECRET_KEY`           | Clerk secret key                     | _(required)_       |
| **Resend**                   |                                      |                    |
| `RESEND_API_KEY`             | Resend API key (contact form emails) | _(required)_       |
| **Azure**                    |                                      |                    |
| `AZURE_TENANT_ID`            | Azure AD tenant ID                   | _(required)_       |
| `AZURE_CLIENT_ID`            | Service principal client ID          | _(required)_       |
| `AZURE_CLIENT_SECRET`        | Service principal secret             | _(required)_       |
| `AZURE_SUBSCRIPTION_ID`      | Azure subscription ID                | _(required)_       |
| `APIM_RESOURCE_GROUP`        | APIM resource group name             | _(required)_       |
| `APIM_SERVICE_NAME`          | APIM service instance name           | _(required)_       |
| `APIM_API_VERSION`           | Azure APIM REST API version          | `2024-05-01`       |
| `APIM_STUDENT_PRODUCT_ID`    | APIM product for student tier        | `student-pilot`    |
| `APIM_PRIVATE_PRODUCT_ID`    | APIM product for private tier        | `private-pilot`    |
| `APIM_COMMERCIAL_PRODUCT_ID` | APIM product for commercial tier     | `commercial-pilot` |
| **Stripe**                   |                                      |                    |
| `STRIPE_SECRET_KEY`          | Stripe secret key                    | _(required)_       |
| `STRIPE_WEBHOOK_SECRET`      | Stripe webhook signing secret        | _(required)_       |
| `STRIPE_PRIVATE_PRICE_ID`    | Stripe price ID for private tier     | _(required)_       |
| `STRIPE_COMMERCIAL_PRICE_ID` | Stripe price ID for commercial tier  | _(required)_       |

> **Note:** Stripe price IDs differ between test and live environments. Use your test mode IDs for local development.

### Accessing environment variables in code

```typescript
import { env } from '@/env'

// Client-side
console.log(env.VITE_CLERK_PUBLISHABLE_KEY)

// Server-side (only available in server functions)
console.log(env.STRIPE_SECRET_KEY)
```

## Scripts

| Command                      | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `npm run dev`                | Start dev server on port 3000 (auto-syncs API spec)      |
| `npm run build`              | Production build (runs lint + API sync first)            |
| `npm run start`              | Start the production server (`.output/server/index.mjs`) |
| `npm run preview`            | Preview the production build locally                     |
| `npm run test`               | Run Vitest tests                                         |
| `npm run lint`               | Run ESLint with auto-fix                                 |
| `npm run format`             | Run Prettier                                             |
| `npm run check`              | Run Prettier --write + ESLint --fix                      |
| `npm run sync-api`           | Fetch latest OpenAPI spec + regenerate TypeScript types  |
| `npm run update-api-spec`    | Fetch latest OpenAPI spec from backend                   |
| `npm run generate-api-types` | Generate TypeScript types from the local OpenAPI spec    |

## API Spec Synchronization

The project auto-generates TypeScript types from the backend's OpenAPI specification:

1. `scripts/update-api-spec.mjs` fetches the spec from the backend and saves it to `docs/preflightapi_swagger.json`
2. `openapi-typescript` generates types into `src/generated/api.ts`

This runs automatically before `dev` and `build` via the `predev`/`prebuild` scripts. If the backend is unreachable, it falls back to the existing spec file.

**Flags for `update-api-spec`:**

```bash
node scripts/update-api-spec.mjs --local   # Fetch from localhost
node scripts/update-api-spec.mjs --url <url>  # Fetch from custom URL
```

The API version from the spec is also inlined at build time via Vite's `define` option as the `__API_VERSION__` global constant.

## Testing

- **Framework:** [Vitest](https://vitest.dev/) with jsdom environment
- **Libraries:** `@testing-library/react`, `@testing-library/dom`
- **Run tests:** `npm run test`

## CI/CD

GitHub Actions runs on pull requests targeting `develop` or `master`:

1. **Lint** — `npm run lint`
2. **Build** — `npm run build`
3. **Test** — `npm run test`

The pipeline uses the Node version from `.nvmrc` and caches npm dependencies. Concurrent runs on the same branch are cancelled in favor of the latest.

See `.github/workflows/ci.yml` for the full configuration.

## Deployment

The app deploys to **Vercel**. The production build outputs to `.output/` via Nitro and runs as a Node.js server.

```bash
npm run build   # Build for production
npm run start   # Start the server (.output/server/index.mjs)
```

Alternative deployment via nixpacks is also supported (see `nixpacks.toml` — Node 22).

## Code Style

- **No semicolons**, single quotes, trailing commas (Prettier)
- **ESLint** uses `@tanstack/eslint-config`
- **Path alias:** `@/` maps to `./src/`
- Run `npm run check` to auto-format and fix all lint issues

## Useful References

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [TanStack Router — File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
- [Clerk — TanStack Start Integration](https://clerk.com/docs/references/tanstack-start/overview)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Stripe API Docs](https://docs.stripe.com/api)
- [Azure APIM REST API](https://learn.microsoft.com/en-us/rest/api/apimanagement/)
