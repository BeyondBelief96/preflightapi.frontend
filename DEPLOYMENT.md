# PreflightAPI Frontend — Deployment & Infrastructure Setup

This document covers everything needed to go from local development to staging and production environments on Railway, with Clerk, Stripe, and Azure APIM configured for each.

---

## Table of Contents

1. [Overview](#overview)
2. [Railway Setup](#1-railway-setup)
3. [Clerk Setup](#2-clerk-setup)
4. [Azure APIM Setup](#3-azure-apim-setup)
5. [Azure Service Principal](#4-azure-service-principal)
6. [Stripe Setup](#5-stripe-setup)
7. [Railway Environment Variables](#6-railway-environment-variables)
8. [Post-Deploy Verification](#7-post-deploy-verification)
9. [Going Live (Waitlist → Sign-Up)](#8-going-live-waitlist--sign-up)
10. [Custom Domain (Optional)](#9-custom-domain-optional)

---

## Overview

**Two environments:**

| | Staging | Production |
|---|---------|------------|
| **Branch** | `develop` | `master` |
| **Purpose** | Testing, QA | Live site |
| **Clerk** | Separate staging app | Separate production app |
| **Stripe** | Test mode (`sk_test_`) | Live mode (`sk_live_`) |
| **APIM** | Test instance | Production instance (when ready) |
| **Waitlist** | `VITE_WAITLIST_MODE=true` | `VITE_WAITLIST_MODE=true` initially |

**How deploys work:** Push to `develop` → staging auto-deploys. Merge to `master` → production auto-deploys. The existing `nixpacks.toml` handles the build (`npm install && npm run build`) and start (`node .output/server/index.mjs`). Railway sets the `PORT` env var automatically and Nitro reads it — no config needed.

---

## 1. Railway Setup

### 1a. Create the Project

1. Go to [railway.com](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
2. Connect your GitHub account and select the `preflightapi.frontend` repo
3. Railway auto-detects `nixpacks.toml` — no build config changes needed

### 1b. Create Two Environments

Railway creates a `production` environment by default.

1. Go to **Settings** → **Environments**
2. Click **New Environment** → name it `staging`
3. Configure branch triggers:
   - **Production**: Settings → Deploy → **Branch** = `master`
   - **Staging**: Settings → Deploy → **Branch** = `develop`

Each environment has its own set of env vars, deploy history, and URL.

### 1c. Note Your Railway URLs

After first deploy, Railway generates URLs like:
- Staging: `https://preflightapi-frontend-staging.up.railway.app`
- Production: `https://preflightapi-frontend-production.up.railway.app`

You'll need these for Clerk redirect URLs and Stripe webhook endpoints.

---

## 2. Clerk Setup

You need **two separate Clerk applications** — one for staging, one for production. This keeps user pools isolated and lets you enable waitlist independently.

### 2a. Create Staging Clerk App

1. Go to [clerk.com/dashboard](https://dashboard.clerk.com) → **Create application**
2. Name it `PreflightAPI - Staging`
3. Enable desired sign-in methods (email, Google, GitHub, etc.)
4. **Enable waitlist**: Settings → Restrictions → **Waitlist** → Enable
5. Configure redirect URLs (Settings → Paths):
   - Sign-in redirect: `/dashboard`
   - Sign-up redirect: `/dashboard/getting-started`
   - After sign-out: `/`
6. Add allowed origins: your Railway staging URL
7. Copy the **Publishable Key** and **Secret Key**

### 2b. Create Production Clerk App

1. Same steps as above, name it `PreflightAPI - Production`
2. **Enable waitlist** initially (you'll disable it when going live)
3. Add allowed origins: your Railway production URL (and custom domain if applicable)
4. Copy the **Publishable Key** and **Secret Key**

### 2c. Clerk Keys Summary

| Key | Where to Find |
|-----|---------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys → Publishable key (`pk_test_` or `pk_live_`) |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys → Secret key (`sk_test_` or `sk_live_`) |

---

## 3. Azure APIM Setup

You currently have a **test** APIM instance. For production you'll need a second one (or reuse the same one with care).

### 3a. Current Test Instance

Already configured:
- Gateway URL: `https://preflightapi-apim-service-test.azure-api.net`
- Products: `free-tier`, `starter-tier`, `professional-tier`
- Use this for **staging**

### 3b. Production APIM Instance (When Ready)

When you're ready to support real users:

1. **Create a new APIM instance** in Azure Portal (or use Bicep/Terraform)
   - Recommended SKU: **Standard v2** for production workloads
   - Name suggestion: `preflightapi-apim-service-prod`
2. **Replicate products** from test:
   - `free-tier` — 500 calls/month, 10 rpm
   - `starter-tier` — 25,000 calls/month, 60 rpm
   - `professional-tier` — 250,000 calls/month, 300 rpm
3. **Import your APIs** (same OpenAPI spec as test)
4. **Configure policies** (rate limiting, quota, CORS, etc.) to match test
5. Note the new gateway URL, resource group, and service name

### 3c. APIM Values Needed

| Variable | Description |
|----------|-------------|
| `VITE_APIM_GATEWAY_URL` | The public gateway URL (e.g., `https://preflightapi-apim-service-test.azure-api.net`) |
| `APIM_RESOURCE_GROUP` | Azure resource group containing the APIM instance |
| `APIM_SERVICE_NAME` | The APIM service name (not the full URL) |
| `APIM_API_VERSION` | Azure Management API version — use `2024-05-01` |

---

## 4. Azure Service Principal

The frontend's server functions use a service principal to call the Azure APIM Management API (creating users, subscriptions, patching tiers). You need one SP that has access to both APIM instances (or one per environment).

### 4a. Create the Service Principal (if not already done)

```bash
az ad sp create-for-rbac \
  --name "preflightapi-frontend-sp" \
  --role "API Management Service Contributor" \
  --scopes "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>"
```

This outputs `appId` (client ID), `password` (client secret), and `tenant`.

### 4b. Grant Access to Both APIM Instances

If using separate resource groups for test and prod:

```bash
# Grant access to production resource group
az role assignment create \
  --assignee <APP_ID> \
  --role "API Management Service Contributor" \
  --scope "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<PROD_RESOURCE_GROUP>"
```

### 4c. Azure Values Needed

| Variable | Description |
|----------|-------------|
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Service principal app (client) ID |
| `AZURE_CLIENT_SECRET` | Service principal password/secret |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |

---

## 5. Stripe Setup

Stripe has built-in test/live mode separation. You need webhook endpoints for each Railway environment.

### 5a. Stripe Price IDs

Create your subscription products in Stripe (if not already done):

1. **Test mode**: Products → Create product
   - **Private Pilot (Starter)**: $49/month recurring → copy the `price_` ID
   - **Commercial Pilot (Professional)**: $199/month recurring → copy the `price_` ID
2. **Live mode**: Repeat the same product/price creation
   - Prices will have different IDs (`price_live_...` vs `price_test_...`)

### 5b. Stripe Webhook Endpoints

After your first Railway deploy, create webhook endpoints:

1. Go to Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. **Staging** (test mode):
   - URL: `https://<staging-railway-url>/api/stripe/webhook`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`)
3. **Production** (live mode):
   - URL: `https://<production-railway-url>/api/stripe/webhook`
   - Same events as above
   - Copy the **Signing secret**

### 5c. Stripe Values Needed

| Variable | Staging (test mode) | Production (live mode) |
|----------|-------------------|----------------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test endpoint) | `whsec_...` (live endpoint) |
| `STRIPE_STARTER_PRICE_ID` | `price_...` (test) | `price_...` (live) |
| `STRIPE_PROFESSIONAL_PRICE_ID` | `price_...` (test) | `price_...` (live) |

---

## 6. Railway Environment Variables

Set these in Railway for **each environment** (Settings → Variables).

### Staging Environment

```
# Waitlist toggle
VITE_WAITLIST_MODE=true

# Clerk (staging app)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Azure APIM (test instance)
VITE_APIM_GATEWAY_URL=https://preflightapi-apim-service-test.azure-api.net
APIM_RESOURCE_GROUP=<test-resource-group>
APIM_SERVICE_NAME=preflightapi-apim-service-test
APIM_API_VERSION=2024-05-01

# Azure Service Principal
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<sp-client-id>
AZURE_CLIENT_SECRET=<sp-client-secret>
AZURE_SUBSCRIPTION_ID=<your-subscription-id>

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (staging webhook)
STRIPE_STARTER_PRICE_ID=price_... (test)
STRIPE_PROFESSIONAL_PRICE_ID=price_... (test)
```

### Production Environment

```
# Waitlist toggle (flip to false when going live)
VITE_WAITLIST_MODE=true

# Clerk (production app)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Azure APIM (production instance — use test until prod is ready)
VITE_APIM_GATEWAY_URL=https://preflightapi-apim-service-prod.azure-api.net
APIM_RESOURCE_GROUP=<prod-resource-group>
APIM_SERVICE_NAME=preflightapi-apim-service-prod
APIM_API_VERSION=2024-05-01

# Azure Service Principal (same SP, or separate one for prod)
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<sp-client-id>
AZURE_CLIENT_SECRET=<sp-client-secret>
AZURE_SUBSCRIPTION_ID=<your-subscription-id>

# Stripe (live mode)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (production webhook)
STRIPE_STARTER_PRICE_ID=price_... (live)
STRIPE_PROFESSIONAL_PRICE_ID=price_... (live)
```

---

## 7. Post-Deploy Verification

After setting env vars and triggering a deploy, verify each environment:

### Checklist

- [ ] **Site loads**: Visit the Railway URL, confirm the landing page renders
- [ ] **Waitlist mode**: Header shows "Join Waitlist" button, not "Sign In" / "Get Started"
- [ ] **Waitlist route**: `/waitlist` shows the Clerk waitlist component
- [ ] **Redirects work**: `/sign-in` and `/sign-up` both redirect to `/waitlist`
- [ ] **Clerk theme**: Waitlist component renders with dark theme
- [ ] **Stripe webhook**: Send a test webhook from Stripe Dashboard → Webhooks → Send test webhook → confirm 200 response
- [ ] **Build logs**: Check Railway deploy logs for any env var warnings

### Quick Smoke Test (After Disabling Waitlist)

- [ ] Sign up creates a Clerk user
- [ ] Dashboard loads at `/dashboard`
- [ ] API key is visible (APIM subscription created)
- [ ] Stripe checkout redirects correctly from pricing page
- [ ] Webhook syncs tier changes (upgrade via Stripe portal, verify APIM tier updates)

---

## 8. Going Live (Waitlist → Sign-Up)

When you're ready to accept real sign-ups:

### Step 1: Clerk Dashboard
- Go to each Clerk app (staging and/or production)
- Settings → Restrictions → **Disable** waitlist mode
- Switch to normal sign-up mode

### Step 2: Railway Environment Variable
- Set `VITE_WAITLIST_MODE=false` in Railway env vars
- This triggers an automatic redeploy
- After deploy: `/sign-in` and `/sign-up` work normally, header shows "Sign In" + "Get Started"

That's it — two changes, no code deploy needed beyond the automatic redeploy from the env var change.

---

## 9. Custom Domain (Optional)

### Railway
1. Settings → Networking → **Custom Domain**
2. Add your domain (e.g., `app.preflightapi.io`)
3. Add the CNAME record Railway provides to your DNS
4. Railway handles TLS automatically

### Update After Adding Domain
- **Clerk**: Add the custom domain to allowed origins in both apps
- **Stripe**: Update webhook endpoint URLs if the domain changes
- **CORS**: If your APIM gateway has CORS policies, add the new origin

---

## Quick Reference: Where Each Secret Lives

| Secret | Source |
|--------|--------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `AZURE_TENANT_ID` | Azure Portal → Azure AD → Overview |
| `AZURE_CLIENT_ID` | Azure Portal → App Registrations → your SP |
| `AZURE_CLIENT_SECRET` | Azure Portal → App Registrations → Certificates & Secrets |
| `AZURE_SUBSCRIPTION_ID` | Azure Portal → Subscriptions |
| `APIM_RESOURCE_GROUP` | Azure Portal → APIM instance → Overview |
| `APIM_SERVICE_NAME` | Azure Portal → APIM instance → Overview |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → endpoint → Signing secret |
| `STRIPE_STARTER_PRICE_ID` | Stripe Dashboard → Products → Private Pilot → Price ID |
| `STRIPE_PROFESSIONAL_PRICE_ID` | Stripe Dashboard → Products → Commercial Pilot → Price ID |
