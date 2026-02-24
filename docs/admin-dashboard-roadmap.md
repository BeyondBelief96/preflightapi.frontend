# Admin Dashboard - Future Enhancements

This document tracks planned enhancements for the admin dashboard at `/dashboard/admin/`.

## Current Capabilities (Implemented)

### System Overview (`/dashboard/admin`)
- Real-time stats: calls today/week/month, active users, error rate, avg latency
- 30-day daily trend chart (calls + errors)
- Top 15 endpoints table
- Revenue summary: MRR, paid customers by tier, 30-day churn

### User Management (`/dashboard/admin/users`)
- Paginated user list with search (Clerk + APIM + Stripe cross-referenced)
- User detail page with profile, Stripe, and APIM subscription cards
- Admin actions: manual tier change, cancel subscription, quota reset
- Per-user analytics (daily trend, endpoint breakdown, errors)
- Expanded invoice history with payment failure details

### Abuse Detection (`/dashboard/admin/abuse`)
- High error rate users (>20% error rate, 50+ calls in 7d)
- Rate limit abusers (top 20 by 429 count in 7d)
- Traffic spikes (max hourly > 3x avg hourly in 7d)
- Suspicious IPs (>500 calls or >3 distinct subscriptions in 24h)
- Quota exceeders (>5000 calls in 30d)

---

## Planned Enhancements

### Medium Effort

#### 1. APIM Key Management
**Priority:** High
**Description:** Allow admins to view, regenerate, or revoke user API keys directly from the user detail page.
**Implementation:**
- Add `adminRegenerateKey` server function calling `apimFetch POST /subscriptions/{id}/regeneratePrimaryKey`
- Add `adminRevokeKey` server function calling `apimFetch PATCH /subscriptions/{id}` with `state: 'suspended'`
- UI: Add key management section to user detail (show masked keys, regenerate/revoke buttons with confirmation)

#### 2. Impersonation Mode
**Priority:** Medium
**Description:** Allow admins to view the dashboard as a specific user sees it, for debugging user-reported issues.
**Implementation:**
- Add `adminImpersonate` server function that returns a temporary session token scoped to the target user
- Use Clerk's `impersonation` feature or create a read-only overlay
- Add "View as User" button on user detail page
- Include visual indicator (banner) when in impersonation mode

#### 3. System Health Dashboard
**Priority:** Medium
**Description:** Monitor APIM gateway health, response time percentiles, and upstream API availability.
**Implementation:**
- Add KQL queries for p50/p95/p99 latency, error rate by backend service
- Add health check endpoint monitoring (ping each upstream API)
- UI: New `/dashboard/admin/health` route with latency percentile charts and service status indicators

#### 4. Webhook Event Log
**Priority:** Medium
**Description:** View recent Stripe and Clerk webhook events with payload details and processing status.
**Implementation:**
- Log webhook events to a database table (event type, payload hash, status, timestamp)
- Add `getWebhookEvents` server function with pagination
- UI: New section on overview or dedicated route showing recent events, retries, and failures

#### 5. Bulk User Operations
**Priority:** Low
**Description:** Perform actions on multiple users at once (e.g., tier change, quota reset).
**Implementation:**
- Add checkbox selection to user table
- Add bulk action dropdown (Change Tier, Reset Quota, Export CSV)
- Add `adminBulkChangeTier` and `adminBulkResetQuota` server functions
- Add progress indicator for bulk operations

### Larger Effort

#### 6. Audit Log
**Priority:** High
**Description:** Track all admin actions (tier changes, cancellations, quota resets) with who, what, when.
**Implementation:**
- Create audit log storage (database table or Azure Table Storage)
- Wrap all admin mutation functions with audit logging middleware
- UI: New `/dashboard/admin/audit` route with filterable log table
- Fields: timestamp, adminEmail, action, targetUserId, details, result

#### 7. Automated Alerts
**Priority:** Medium
**Description:** Configure alerts for abuse patterns, revenue thresholds, or system health issues.
**Implementation:**
- Define alert rules (e.g., "notify when error rate > 10% for 1 hour")
- Add alert evaluation cron job or Azure Function
- Notification channels: email (Resend), Slack webhook
- UI: Alert configuration page, alert history/acknowledgment

#### 8. Revenue Analytics Dashboard
**Priority:** Medium
**Description:** Detailed revenue analytics with trends, cohort analysis, and forecasting.
**Implementation:**
- Historical MRR tracking (store monthly snapshots)
- Cohort retention analysis (by signup month)
- Upgrade/downgrade flow visualization
- Revenue per endpoint analysis (correlate usage with tier)
- UI: Dedicated `/dashboard/admin/revenue` route with charts

#### 9. Custom Rate Limit Overrides
**Priority:** Low
**Description:** Set per-user rate limit overrides for special cases (enterprise deals, partnerships).
**Implementation:**
- Store overrides in APIM subscription metadata or custom database table
- Modify APIM rate limit policy to check for overrides
- UI: Add rate limit override section to user detail page
- Include expiration date for temporary overrides

#### 10. Geographic Access Controls
**Priority:** Low
**Description:** Block or flag requests from specific countries or IP ranges.
**Implementation:**
- Add APIM policy for geo-based filtering
- Admin UI to manage blocked countries/IP ranges
- Integrate with abuse detection (auto-flag high-risk geos)

---

## Technical Notes

- All admin server functions live in `src/lib/server/admin.ts`
- Admin auth helpers in `src/lib/server/admin-auth.ts`
- Admin access controlled by `ADMIN_EMAILS` env var (comma-separated)
- KQL queries reuse extracted helpers from `src/lib/server/apim.ts` (`_query*` functions)
- Query keys defined in `src/lib/server/apim-queries.ts` under `adminKeys`
- All admin routes use `noIndex: true` for SEO
- Admin gate is in the layout route `src/routes/dashboard/admin.tsx` (`beforeLoad`)
