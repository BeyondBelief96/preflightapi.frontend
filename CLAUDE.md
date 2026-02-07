# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev             # Dev server on port 3000
npm run build           # Production build
npm run start           # Start production server (.output/server/index.mjs)
npm run test            # Run Vitest tests (vitest run)
npm run lint            # ESLint
npm run format          # Prettier
npm run check           # Prettier --write + ESLint --fix
pnpm dlx shadcn@latest add <component>  # Add shadcn/ui components
```

## Tech Stack

TanStack Start (React 19, Vite 7, Nitro SSR) with TanStack Router (file-based), Query, Form, and Table. Clerk for auth, Stripe for billing, Azure APIM for API gateway. Tailwind CSS v4 + shadcn/ui (New York style). Deployed on Vercel.

## Architecture

### Routing (TanStack Router, file-based)

- `src/routes/__root.tsx` — Root layout (HTML shell, providers)
- `src/routes/_marketing.tsx` — Pathless layout for public pages (landing, pricing, about, contact, legal). Prefix `_` = no URL segment.
- `src/routes/dashboard.tsx` — Path-based layout for authenticated pages. Adds `/dashboard/` prefix to children.
- `src/routes/docs.tsx` — Path-based layout for documentation pages at `/docs/`.
- `src/routeTree.gen.ts` — Auto-generated. **Never edit.**

### BFF Pattern (Server Functions)

Server-side logic lives in `src/lib/server/`:

- `apim.ts` / `apim-client.ts` — Azure APIM user/subscription management
- `stripe.ts` / `stripe-client.ts` — Stripe checkout, portal, subscriptions

HTTP endpoints (webhooks) live in `server/api/`:

- `server/api/stripe/webhook.ts` — Stripe webhook handler (syncs Stripe → APIM tiers)

### Key Conventions

- Server functions use `createServerFn()` from `@tanstack/react-start`
- Input validation: `.inputValidator()` (NOT `.validator()`)
- Handler receives `{ data }` (destructured input)
- Auth in server fns: `auth()` from `@clerk/tanstack-react-start/server` (no request param)
- Don't use React hooks in `beforeLoad` — it's not a React component context
- `@/` alias maps to `./src/`
- Clerk middleware in `src/start.ts` handles server-side auth

### Subscription Tiers

Three tiers defined in `src/lib/constants.ts`:

- **Free** (`free-tier`) — $0, 500 calls/month
- **Starter** (`starter-tier`) — $29.99, 25K calls/month
- **Professional** (`professional-tier`) — $79.99, 250K calls/month

`ENDPOINT_ACCESS` maps API endpoints to minimum required tier.

### Stripe Specifics

- Stripe API version `2026-01-28.clover`: `current_period_end` is on `SubscriptionItem`, not `Subscription`
- Portal upgrades change price but NOT custom metadata — price ID takes priority over metadata for tier mapping
- Stripe customer ID stored in Clerk `privateMetadata.stripeCustomerId`
- Price IDs are server-only env vars (differ between test/live)

### Styling

- Tailwind v4 with oklch color space (aviation-themed dark cockpit aesthetic)
- CSS variables in `src/styles.css`
- Fonts: Inter (body), JetBrains Mono (code)
- `cn()` utility in `src/lib/utils.ts` for Tailwind class merging

### Environment Variables

Validated via T3Env in `src/env.ts`. Frontend vars use `VITE_` prefix. Server-only vars (Stripe keys, Azure credentials) have no prefix. See `.env.example` for full list.

## Code Style

- No semicolons, single quotes, trailing commas (Prettier config)
- ESLint uses `@tanstack/eslint-config`
