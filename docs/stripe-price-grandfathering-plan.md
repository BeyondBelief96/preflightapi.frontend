# Stripe Price Grandfathering Plan

## Goal

Increase Private Pilot from $14.99 → $49.99/mo and Commercial Pilot from $49.99 → $149.99/mo while grandfathering existing subscribers at their current prices.

## Grandfathering Rules

- Existing paid subscribers keep their current price as long as they remain subscribed
- If a user cancels but un-cancels before the period ends, they keep the old price
- Only if the subscription fully expires (downgraded to Student Pilot) and they re-subscribe do they pay new prices
- Tier changes via Stripe portal move the user to the new price structure

## Why This Mostly Works Out of the Box

Stripe never changes prices on existing subscriptions. When a user subscribes at $14.99/mo, that subscription stays at $14.99/mo until it's canceled/expired. The cancel → un-cancel flow preserves the original price automatically because the subscription object is never deleted.

## The One Code Problem

`src/lib/server/stripe-utils.ts` maps price IDs to plan IDs (`planIdFromPriceId`). It only knows about the current env var price IDs. After swapping env vars to new prices, **grandfathered subscriptions with old price IDs will fail to resolve**, causing the webhook and subscription status to misidentify their tier (potentially defaulting to student).

## Implementation Steps

### 1. Create New Stripe Prices (Stripe Dashboard)

- Create a new Price on the Private Pilot product: **$49.99/month**
- Create a new Price on the Commercial Pilot product: **$149.99/month**
- Note both new price IDs (e.g., `price_new_private_xxx`, `price_new_commercial_xxx`)
- **Do NOT archive old prices yet** — wait until after deployment

### 2. Add Legacy Price ID Env Vars (`src/env.ts`)

Add two optional env vars for the old (grandfathered) price IDs:

```typescript
// In the server section of createEnv:
STRIPE_LEGACY_PRIVATE_PRICE_ID: z.string().optional(),
STRIPE_LEGACY_COMMERCIAL_PRICE_ID: z.string().optional(),
```

### 3. Update Price-to-Plan Mapping (`src/lib/server/stripe-utils.ts`)

Update `planIdFromPriceId` to recognize both old and new price IDs for each tier:

```typescript
import { env } from '@/env'

// Current prices — used for new checkouts
export const PRICE_ID_MAP: Record<string, () => string | undefined> = {
  private: () => env.STRIPE_PRIVATE_PRICE_ID,
  commercial: () => env.STRIPE_COMMERCIAL_PRICE_ID,
}

export function getPriceIdForPlan(planId: string): string | undefined {
  return PRICE_ID_MAP[planId]?.()
}

// All prices that should resolve to a tier (includes legacy/grandfathered)
const ALL_PRICE_IDS: Array<{
  planId: string
  getPriceId: () => string | undefined
}> = [
  { planId: 'private', getPriceId: () => env.STRIPE_PRIVATE_PRICE_ID },
  { planId: 'private', getPriceId: () => env.STRIPE_LEGACY_PRIVATE_PRICE_ID },
  { planId: 'commercial', getPriceId: () => env.STRIPE_COMMERCIAL_PRICE_ID },
  {
    planId: 'commercial',
    getPriceId: () => env.STRIPE_LEGACY_COMMERCIAL_PRICE_ID,
  },
]

export function planIdFromPriceId(priceId: string): string | undefined {
  for (const { planId, getPriceId } of ALL_PRICE_IDS) {
    if (getPriceId() === priceId) return planId
  }
  return undefined
}
```

### 4. Update Environment Variables

In your deployment environment (Railway):

| Variable                           | Old Value              | New Value              |
| ---------------------------------- | ---------------------- | ---------------------- |
| `STRIPE_PRIVATE_PRICE_ID`         | `price_old_private`    | `price_new_private`    |
| `STRIPE_COMMERCIAL_PRICE_ID`      | `price_old_commercial` | `price_new_commercial` |
| `STRIPE_LEGACY_PRIVATE_PRICE_ID`  | _(not set)_            | `price_old_private`    |
| `STRIPE_LEGACY_COMMERCIAL_PRICE_ID` | _(not set)_          | `price_old_commercial` |

### 5. Archive Old Prices (Stripe Dashboard — Post-Deployment)

After verifying the deployment works:

- Archive the old Private Pilot price ($14.99)
- Archive the old Commercial Pilot price ($49.99)
- This prevents new checkouts from using old prices while existing subscriptions continue unaffected

## What Each Part of the System Does After This Change

| Component | Behavior |
|---|---|
| `createCheckoutSession` | Uses `getPriceIdForPlan()` → new price IDs → new users pay new prices |
| Stripe Webhook (`planIdFromPriceId`) | Recognizes both old and new price IDs → correct tier for everyone |
| `getStripeSubscriptionInternal` | Uses `planIdFromPriceId()` → correct tier display for grandfathered users |
| `fetchStripePrices` (tier-config) | Fetches current env var prices → UI/pricing page shows new prices |
| Stripe Customer Portal | Shows new prices for tier changes; grandfathered users who switch tiers move to new pricing |
| Cancel → un-cancel | Stripe keeps subscription active at old price (no code involved) |
| Cancel → expire → re-subscribe | `subscription.deleted` → student tier → next checkout uses new prices |

## Deployment Order

1. Create new Stripe Prices in dashboard
2. Deploy code changes (env.ts + stripe-utils.ts) with all four env vars set
3. Test: create a new subscription → should use new price
4. Test: verify existing subscription status still resolves correctly
5. Archive old prices in Stripe dashboard

## Edge Cases

- **Portal upgrades**: A grandfathered Private user upgrading to Commercial via portal gets the new Commercial price ($149.99). This is correct — they're choosing a new plan.
- **Portal downgrades**: A grandfathered Commercial user downgrading to Private via portal gets the new Private price ($49.99). Also correct.
- **Payment failure recovery**: If Stripe recovers a failed payment on a grandfathered subscription, `subscription.updated` fires with the old price ID → `planIdFromPriceId` resolves correctly via legacy mapping.
- **Multiple legacy price changes**: If prices change again in the future, add more legacy env vars or switch to a comma-separated list pattern.

## Files Changed

- `src/env.ts` — Add `STRIPE_LEGACY_PRIVATE_PRICE_ID` and `STRIPE_LEGACY_COMMERCIAL_PRICE_ID`
- `src/lib/server/stripe-utils.ts` — Update `planIdFromPriceId` to check legacy price IDs
- `.env.example` — Add the two new legacy env var placeholders

## Future Consideration

If prices change frequently, consider replacing per-price env vars with a Stripe Product ID-based approach: look up the product from the price and map product → tier. This eliminates the need for legacy env vars entirely since the product stays the same across price changes. However, it requires an extra Stripe API call (or expanding the price object) and is overkill for a one-time price adjustment.
