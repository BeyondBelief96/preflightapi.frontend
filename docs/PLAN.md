# PreflightAPI Frontend - Comprehensive Implementation Plan

## Project Overview

Build the marketing site, authentication flows, user dashboard, API key management, documentation, and billing for PreflightAPI - an aviation data API platform.

**Stack:** TanStack Start, React 19, Tailwind CSS v4, shadcn/ui, Clerk, Stripe, Azure APIM
**Deployment:** Vercel
**Branding:** Design from scratch (aviation-themed)

---

## Architecture Decisions

### Route Layout Strategy
Two pathless layout routes provide distinct shells:
- **`_marketing.tsx`** - Public header/footer, SSR for SEO
- **`_dashboard.tsx`** - Authenticated sidebar/header, protected routes
- **`docs.tsx`** - Separate docs layout with sidebar navigation

### Data Flow
- **Public pages**: Full SSR via `head()` for SEO
- **Dashboard pages**: Client-side behind auth guard, TanStack Query for data
- **Server functions**: BFF (Backend for Frontend) pattern - all Azure APIM and Stripe calls go through `createServerFn`, never exposing secrets to the client

### Stripe + Azure APIM Integration
```
User clicks "Subscribe to Pro" on pricing page
  -> Stripe Checkout session created (server function)
  -> User completes payment on Stripe
  -> Stripe webhook fires to our API route
  -> Server creates APIM user (Clerk ID as identifier)
  -> Server creates APIM subscription (tied to "Pro" product)
  -> User gets API key + access to Pro-tier endpoints
```

### State Management
- **TanStack Query**: All server state (API keys, usage, billing)
- **TanStack Router search params**: Docs version, filters
- **Clerk**: All auth state
- **React state**: UI-only (modals, forms)

---

## Phase 0: Foundation & Cleanup

**Goal:** Clean slate, project structure, design system, Vercel deployment config.

### Delete demo files
- `src/routes/demo/` (entire directory)
- `src/routes/index.tsx` (replace with marketing landing)
- `src/data/demo-table-data.ts`, `src/data/demo.punk-songs.ts`
- `src/hooks/demo.form.ts`, `src/hooks/demo.form-context.ts`
- `src/components/demo.FormComponents.tsx`
- `src/components/Header.tsx` (replaced by layout-specific headers)
- `public/tanstack-circle-logo.png`, `public/tanstack-word-logo-white.svg`

### Create project structure
```
src/
  lib/
    utils.ts              # EXISTS - keep
    constants.ts          # NEW - plan definitions, site config
    seo.ts                # NEW - head() meta tag helper
  types/
    api.ts                # NEW - TypeScript types for API responses
    plans.ts              # NEW - pricing plan types
  server/
    apim.ts               # NEW - Azure APIM client (stubbed initially)
    api-keys.ts           # NEW - API key server functions
    billing.ts            # NEW - Stripe server functions
    usage.ts              # NEW - Usage analytics server functions
  integrations/
    clerk/                # EXISTS - enhance
    tanstack-query/       # EXISTS - keep
```

### Design system setup
- **Modify `src/styles.css`**: Aviation-themed color palette
  - Primary: Deep navy blue (trust, professionalism)
  - Accent: Sky blue (aviation)
  - Success: Green, Warning: Amber, Error: Red
  - Neutral: Slate grays
- **Add fonts**: Inter (body), JetBrains Mono (code)
- **Create text logo**: "PreflightAPI" wordmark using CSS

### Install additional shadcn components
```
card, badge, separator, tabs, navigation-menu, dialog, dropdown-menu,
avatar, tooltip, accordion, scroll-area, sheet, sidebar, table,
skeleton, alert, alert-dialog, command, popover, toast
```

### Modify `src/env.ts`
Add environment variables:
```
Server: AZURE_APIM_GATEWAY_URL, AZURE_APIM_MANAGEMENT_URL,
        AZURE_APIM_SAS_TOKEN, PREFLIGHT_API_BASE_URL,
        STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLERK_SECRET_KEY
Client: VITE_STRIPE_PUBLISHABLE_KEY
```

### Modify `src/__root.tsx`
- Remove demo `<Header />` from shell
- Add `errorComponent` and `notFoundComponent`
- Shell only provides ClerkProvider + HTML wrapper + devtools
- Each layout route provides its own header/footer

### Configure for Vercel
- Add `vercel.json` or configure TanStack Start's Vercel preset in vite config
- Update deployment configuration for SSR on Vercel

### Files to modify
- `src/routes/__root.tsx` - Remove demo header, add error handling
- `src/env.ts` - Add new env vars
- `src/styles.css` - Aviation theme
- `vite.config.ts` - Vercel deployment preset
- `package.json` - Add new dependencies

### New dependencies
```
shiki (syntax highlighting), recharts (charts), date-fns (dates),
stripe (payments), @stripe/stripe-js (client)
```

---

## Phase 1: Marketing Site & Public Pages

**Goal:** Professional landing page, pricing, about, legal pages. All SSR for SEO.

### Route structure
```
src/routes/
  _marketing.tsx                    # Layout: public header + footer
  _marketing/
    index.tsx                       # Landing page
    pricing.tsx                     # Pricing page
    about.tsx                       # About page
    contact.tsx                     # Contact form
    legal/
      terms.tsx                     # Terms of Service
      privacy.tsx                   # Privacy Policy
```

### Components to create
```
src/components/marketing/
  site-header.tsx         # Nav bar: logo, links (Pricing, Docs, About), Sign In / Get Started CTAs
  site-footer.tsx         # Links, copyright, social
  hero-section.tsx        # Tagline, animated code snippet, CTA buttons
  features-grid.tsx       # Feature cards (weather, airports, airspace, etc.)
  endpoint-showcase.tsx   # Interactive API preview with real responses
  pricing-card.tsx        # Individual plan card
  pricing-table.tsx       # Feature comparison table
  cta-section.tsx         # "Get started for free" banner
  code-example.tsx        # Syntax-highlighted code block
  stats-counter.tsx       # Key numbers (airports, stations, etc.)
```

### Landing page sections (top to bottom)
1. **Hero**: "Aviation Data API for Developers" + animated code snippet showing a METAR request/response + "Get Started Free" and "View Documentation" CTAs
2. **Stats bar**: 20,000+ airports, real-time weather, 10+ data categories
3. **Features grid**: 6 cards covering Weather (METAR/TAF/PIREP), Airport Data, Airspace, NOTAMs, Flight Planning, Performance Calculations
4. **Code showcase**: Tabbed code examples (cURL, JS, Python) with live-looking responses
5. **Pricing preview**: 4 tier cards
6. **CTA banner**: "Start building with PreflightAPI today"

### SEO helper (`src/lib/seo.ts`)
Reusable function to generate `head()` configs with title, description, OG tags, Twitter cards.

---

## Phase 2: Authentication Flows & Dashboard Shell

**Goal:** Sign-in/sign-up, auth guards, dashboard layout.

### Route structure
```
src/routes/
  sign-in.tsx                       # Clerk <SignIn /> (bare layout, centered)
  sign-up.tsx                       # Clerk <SignUp /> (bare layout, centered)
  _dashboard.tsx                    # Layout: sidebar + header, auth-protected
  _dashboard/
    index.tsx                       # Redirects to overview
    overview.tsx                    # Usage stats, quick links
```

### Auth guard in `_dashboard.tsx`
Use `beforeLoad` to check Clerk auth status. Redirect unauthenticated users to `/sign-in`. Clerk middleware in `src/start.ts` already handles server-side token validation.

### Clerk configuration notes
- Set `afterSignInUrl: '/dashboard'` and `afterSignUpUrl: '/dashboard/getting-started'` in ClerkProvider
- Use Clerk's `<UserButton />` in dashboard header
- Use `<SignIn />` and `<SignUp />` components (not redirect-based) for custom-styled pages
- Clerk environment variables: `VITE_CLERK_PUBLISHABLE_KEY` (client), `CLERK_SECRET_KEY` (server)

### Dashboard components
```
src/components/dashboard/
  dashboard-sidebar.tsx       # Collapsible sidebar: Overview, API Keys, Billing, Docs, Settings
  dashboard-header.tsx        # Top bar with breadcrumbs + UserButton
  quick-stats-cards.tsx       # API calls today/month, current plan, keys active
  plan-badge.tsx              # Shows current tier with color coding
```

---

## Phase 3: API Key Management

**Goal:** Create, view, rotate, and revoke API keys via Azure APIM.

### Route structure
```
src/routes/_dashboard/
  keys/
    index.tsx                 # API keys list with actions
```

### Server functions (`src/server/api-keys.ts`)
All APIM calls proxied through server functions (secrets stay server-side):
- `listApiKeys` - List user's APIM subscriptions
- `createApiKey` - Create new APIM subscription (name + plan product)
- `rotateApiKey` - Regenerate primary/secondary key
- `revokeApiKey` - Delete/suspend subscription

### Azure APIM client (`src/server/apim.ts`)
Wrapper around Azure APIM Management REST API. **Initially stubbed** with mock data since APIM isn't set up yet. Interface designed so swapping in real APIM calls later is seamless.

### Components
```
src/components/dashboard/
  api-key-table.tsx           # Table of keys (name, created, last used, status, actions)
  api-key-create-dialog.tsx   # Modal: name input, environment selector
  api-key-rotate-dialog.tsx   # Confirmation with warning
  api-key-revoke-dialog.tsx   # Confirmation dialog
  api-key-reveal.tsx          # One-time key display with copy button
```

### UX flow
1. User clicks "Create API Key"
2. Dialog: enter name (e.g., "Production", "Development"), select environment
3. Key is created - shown ONCE in a reveal component with copy-to-clipboard
4. Key appears in table (masked: `pk_live_****...****abcd`)
5. Actions: Rotate (regenerate), Revoke (delete with confirmation)

---

## Phase 4: API Documentation

**Goal:** Comprehensive, searchable, interactive documentation for all API endpoints.

### Route structure
```
src/routes/
  docs.tsx                          # Docs layout (own sidebar, outside _marketing)
  docs/
    index.tsx                       # Docs overview + search
    getting-started.tsx             # Quickstart guide
    authentication.tsx              # How to use API keys
    rate-limits.tsx                 # Rate limiting by plan
    errors.tsx                      # Error codes reference
    weather/
      metar.tsx                     # METAR endpoints
      taf.tsx                       # TAF endpoints
      pirep.tsx                     # PIREP endpoints
      airmet-sigmet.tsx             # AIRMET/SIGMET endpoints
      g-airmet.tsx                  # G-AIRMET endpoints
    airports/
      search.tsx                    # Airport search/lookup
      details.tsx                   # Airport details
      runways.tsx                   # Runway data
      frequencies.tsx               # Communication frequencies
      diagrams.tsx                  # Airport diagrams
    airspace/
      controlled.tsx                # Controlled airspace
      special-use.tsx               # Special use airspace
    navigation/
      nav-log.tsx                   # Navigation log calculation
      obstacles.tsx                 # Obstacle data
    notams.tsx                      # NOTAMs
    charts/
      supplements.tsx               # Chart supplements
    performance/
      calculator.tsx                # Crosswind/density altitude
```

### Documentation data layer
```
src/content/docs/
  endpoints.ts              # Master registry of all endpoints
  v1/
    weather.ts              # Weather endpoint definitions
    airports.ts             # Airport endpoint definitions
    airspace.ts             # Airspace endpoint definitions
    navigation.ts           # Navigation endpoint definitions
    notams.ts               # NOTAM definitions
    charts.ts               # Chart definitions
    performance.ts          # Performance definitions
```

Each endpoint definition includes: method, path, description, parameters (name, type, required, description), response schema, code examples (cURL/JS/Python/C#), sample responses.

### Documentation components
```
src/components/docs/
  docs-sidebar.tsx              # Left sidebar with collapsible categories
  docs-search.tsx               # Cmd+K search overlay (shadcn Command)
  endpoint-header.tsx           # Method badge + URL pattern
  parameter-table.tsx           # Parameters table
  response-schema.tsx           # Expandable response fields
  code-block.tsx                # Syntax-highlighted code (shiki) + copy
  try-it-panel.tsx              # Interactive API tester
  request-builder.tsx           # Parameter form (TanStack Form)
  response-viewer.tsx           # JSON response display
  version-selector.tsx          # API version dropdown
  example-tabs.tsx              # Language tabs for code examples
```

### Versioning strategy
- Endpoint definitions organized by version directory (`v1/`, future `v2/`)
- Version selector in docs sidebar header
- URL search param `?v=v1` controls active version
- All versions accessible simultaneously

### Search
- Client-side using `@tanstack/match-sorter-utils` (already installed)
- Index built from endpoint definitions
- `Cmd+K` shortcut opens Command palette

---

## Phase 5: Pricing & Billing (Stripe)

**Goal:** Subscription management with Stripe, plan selection, billing dashboard.

### How Stripe + APIM work together
| Concern | Handled By |
|---------|-----------|
| Charging credit cards | Stripe |
| Subscription lifecycle | Stripe |
| Invoices & receipts | Stripe |
| Payment methods | Stripe |
| API key generation | Azure APIM |
| Rate limiting | Azure APIM |
| Route-level access | Azure APIM |
| Usage metering | Azure APIM |

### Stripe webhook flow
```
Stripe fires webhook -> API route in TanStack Start -> Server function:
  checkout.session.completed -> Create APIM user + subscription for the plan's product
  customer.subscription.updated -> Update APIM subscription to new product
  customer.subscription.deleted -> Suspend/delete APIM subscription
```

### Plan definitions (`src/lib/constants.ts`)
```typescript
export const PLANS = [
  { id: 'free', name: 'Free', price: 0, stripePriceId: null,
    apimProductId: 'preflight-free',
    limits: { callsPerMonth: 1000, ratePerMinute: 10 },
    features: ['METAR & TAF data', 'Airport search', 'Community support'] },
  { id: 'standard', name: 'Standard', price: 29, stripePriceId: 'price_...',
    apimProductId: 'preflight-standard',
    limits: { callsPerMonth: 50_000, ratePerMinute: 60 },
    features: ['All weather data', 'NOTAMs', 'Nav log', 'Email support'] },
  { id: 'pro', name: 'Professional', price: 99, stripePriceId: 'price_...',
    apimProductId: 'preflight-pro',
    limits: { callsPerMonth: 500_000, ratePerMinute: 300 },
    features: ['All endpoints', 'Performance calc', 'Priority support'] },
  { id: 'enterprise', name: 'Enterprise', price: null, stripePriceId: null,
    apimProductId: 'preflight-enterprise',
    limits: { callsPerMonth: null, ratePerMinute: null },
    features: ['Unlimited', 'SLA', 'Dedicated support', 'Custom integration'] },
]
```
*Note: Exact limits TBD - placeholders above are reasonable starting points.*

### Route structure
```
src/routes/
  _dashboard/
    billing/
      index.tsx               # Current plan, usage meter, upgrade/downgrade
  api/
    stripe-webhook.ts         # Stripe webhook handler (API route)
```

### Server functions (`src/server/billing.ts`)
- `createCheckoutSession` - Creates Stripe Checkout session for plan upgrade
- `createBillingPortalSession` - Opens Stripe's billing portal (manage payment methods, invoices)
- `getCurrentSubscription` - Gets user's active plan from Stripe
- `handleStripeWebhook` - Processes webhook events

### Components
```
src/components/pricing/
  pricing-toggle.tsx              # Monthly/annual billing toggle
  pricing-comparison-table.tsx    # Full feature comparison
src/components/dashboard/
  billing-overview.tsx            # Current plan + next billing date
  usage-meter.tsx                 # Bar chart of calls used vs limit
  plan-upgrade-dialog.tsx         # Confirm plan change
```

---

## Phase 6: Dashboard Features & Polish

**Goal:** Usage analytics, onboarding, account settings.

### Route structure
```
src/routes/_dashboard/
  getting-started.tsx         # Onboarding checklist
  settings/
    index.tsx                 # Account settings (redirects to profile)
    profile.tsx               # Clerk UserProfile embed
```

### Server functions (`src/server/usage.ts`)
- `getUsageStats` - Fetch usage from APIM Analytics API (stubbed initially)
- `getRecentActivity` - Recent API call log

### Components
```
src/components/dashboard/
  getting-started-checklist.tsx   # Steps: Create account ✓, Choose plan, Create key, Make first call
  usage-chart.tsx                 # Line chart - daily API calls (recharts)
  endpoint-breakdown.tsx          # Usage by endpoint category
  recent-activity-feed.tsx        # Latest API calls log
```

---

## Phase 7: Production Hardening

**Goal:** Error handling, analytics, performance, security.

### Error handling
- Add `errorComponent` to `__root.tsx` and `_dashboard.tsx`
- Create `src/components/error-boundary.tsx` and `src/components/not-found.tsx`
- Global 404 page with helpful navigation

### Performance
- Route-level code splitting (automatic with TanStack Router)
- `defaultPreload: 'intent'` already configured
- Image optimization (WebP, lazy loading)
- Font subsetting for Inter + JetBrains Mono

### SEO & Metadata
- `sitemap.xml` generation (API route)
- Update `robots.txt`
- Structured data (JSON-LD) for Organization
- OG images for key pages

### Security
- CSP headers via middleware
- CORS configuration
- Stripe webhook signature verification
- APIM SAS token only on server side

### Analytics
- Plausible or PostHog integration (privacy-friendly)
- Page view tracking via router subscription
- Custom events: sign-up, key creation, plan upgrade

### Health check
- `src/routes/api/health.ts` - Health check endpoint for monitoring

---

## Phase Summary

| Phase | Description | Key Deliverables |
|-------|-------------|-----------------|
| 0 | Foundation & Cleanup | Clean project, design system, env vars, shadcn components |
| 1 | Marketing Site | Landing page, pricing page, about, contact, legal |
| 2 | Auth & Dashboard Shell | Sign-in/up, dashboard layout, sidebar, auth guard |
| 3 | API Key Management | Key CRUD UI, APIM server functions (stubbed) |
| 4 | API Documentation | Full docs site, interactive examples, search, versioning |
| 5 | Billing (Stripe) | Checkout, webhooks, billing dashboard, plan management |
| 6 | Dashboard Features | Usage analytics, onboarding, settings |
| 7 | Production Hardening | Error handling, SEO, analytics, security, performance |

---

## Verification Plan

After each phase, verify by:
1. `npm run dev` - Development server starts without errors
2. `npm run build` - Production build succeeds
3. Manual navigation of all new routes
4. Responsive testing at mobile (375px), tablet (768px), desktop (1280px)
5. Clerk auth flow works (sign in, sign out, protected routes redirect)
6. Phase 7: Run Lighthouse audit targeting 90+ on all metrics
