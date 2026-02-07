# Scalar API Documentation Setup Plan

## Goal

Replace hand-written API documentation pages with dynamic docs rendered from the live OpenAPI spec using Scalar. When the backend API changes and is deployed, the frontend docs automatically reflect those changes with zero manual sync.

## How It Works

The deployed API already serves its OpenAPI spec at `/openapi/v1.json` (via NSwag). Scalar is a React component that takes a spec URL and renders full interactive API documentation. The frontend simply points Scalar at the deployed API's spec endpoint.

```
User visits /docs → Scalar fetches https://your-apim-gateway/openapi/v1.json → Docs render
```

## Architecture

### Current State
- 21 hand-written React doc pages in `src/routes/docs/`
- Pages manually describe endpoints, parameters, and response shapes
- Any API change requires manually updating these pages

### Target State
- Scalar renders endpoint documentation dynamically from the live OpenAPI spec
- Custom pages (Getting Started, Authentication, Rate Limits, Errors) remain as hand-written React components
- Version selector loads different spec files when v2+ exists

## Implementation Steps

### 1. Install Scalar

```bash
npm install @scalar/api-reference-react
```

### 2. Spec URL Configuration

The spec URL should come from the existing gateway URL config:

**File:** `src/lib/gateway-url.ts` already has the APIM gateway URL.

The OpenAPI spec is served at: `{GATEWAY_URL}/openapi/v1.json`

Note: The `GatewaySecretMiddleware` in the backend already exempts `/openapi` and `/swagger` paths from the gateway secret check, so the spec is publicly accessible.

### 3. Create a Scalar Doc Component

Create a component that renders Scalar pointed at the live spec:

```tsx
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'
import { GATEWAY_URL } from '@/lib/gateway-url'

export function ApiReference() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: `${GATEWAY_URL}/openapi/v1.json`,
        },
        // Theme customization to match the existing site design
        darkMode: true,
        // Hide Scalar branding if desired
        hideModels: false,
        // Customize authentication display
        authentication: {
          preferredSecurityScheme: 'apiKey',
        },
      }}
    />
  )
}
```

### 4. Integration Strategy (Two Options)

**Option A: Replace individual endpoint pages with Scalar**
- Keep the existing docs layout and sidebar navigation
- Replace endpoint-specific content (METAR, TAF, Airport, etc.) with Scalar rendering just that tag/group
- Keep custom pages (Getting Started, Auth, Rate Limits, Errors) as-is
- Pros: Maintains the current look and feel
- Cons: More integration work

**Option B: Dedicated Scalar page + keep custom guides**
- Add a new route like `/docs/api-reference` that renders the full Scalar UI
- Keep Getting Started, Auth, Rate Limits, Errors as custom pages
- Link to the Scalar reference from the sidebar
- Pros: Simple, fast to implement
- Cons: Two different doc styles

**Recommendation: Option B** — simplest to implement, and Scalar's built-in navigation is already excellent for endpoint browsing.

### 5. Version Selector (Future)

When v2 endpoints are added:
- NSwag will generate separate specs per API version group (configured via `GroupNameFormat = "'v'VVV"` in Program.cs)
- Specs will be available at `/openapi/v1.json` and `/openapi/v2.json`
- Add a version dropdown that swaps the spec URL passed to Scalar

```tsx
const [version, setVersion] = useState('v1')

<ApiReferenceReact
  configuration={{
    spec: {
      url: `${GATEWAY_URL}/openapi/${version}.json`,
    },
  }}
/>
```

### 6. Pages to Keep vs Replace

**Keep as custom React pages:**
- `getting-started.tsx` — signup flow, first request examples
- `authentication.tsx` — API key setup, APIM subscription
- `rate-limits.tsx` — tier-specific rate limiting info
- `errors.tsx` — error code reference (or let Scalar show the ApiErrorResponse schema)

**Replace with Scalar (these just describe endpoints):**
- All weather endpoint pages (metar, taf, pirep, airsigmet, gairmet)
- All airport endpoint pages (airports, runways, frequencies, diagrams)
- Airspace pages (airspace, special-use-airspace)
- Navigation pages (navlog, obstacles)
- Other pages (notams, chart-supplements, performance)

### 7. CORS Consideration

If the frontend fetches the spec from the APIM gateway at runtime, ensure CORS is configured on APIM to allow the frontend domain to access `/openapi/*` endpoints. This should already work if APIM has CORS configured for the frontend domain.

### 8. OpenAPI Spec Quality

For the best Scalar output, the backend OpenAPI spec should include:
- Operation summaries and descriptions (via `/// <summary>` XML comments on controller actions)
- Response type annotations (`[ProducesResponseType]` attributes)
- Parameter descriptions

Check the current spec quality at the deployed `/openapi/v1.json` endpoint and consider adding XML doc comments to controllers for richer documentation.

## References

- Scalar React docs: https://github.com/scalar/scalar/tree/main/packages/api-reference-react
- Existing gateway URL config: `src/lib/gateway-url.ts`
- Backend OpenAPI setup: `PreflightApi.API/Program.cs` (lines 100-105)
- Backend gateway middleware exemption: `PreflightApi.API/Middleware/GatewaySecretMiddleware.cs` (lines 32-38)
- Current doc pages: `src/routes/docs/`
