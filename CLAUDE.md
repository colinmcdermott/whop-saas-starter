# CLAUDE.md - Whop SaaS Starter

## Overview

A production-ready Next.js SaaS starter template using Whop for authentication (OAuth 2.1 + PKCE) and subscription payments. This is a **standalone** Next.js app — NOT a Whop app (no iframe, no Whop proxy).

## Quick Reference

```bash
pnpm dev          # Dev server with Turbopack
pnpm build        # Production build (ALWAYS run before commits)
pnpm lint         # ESLint
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
```

## Architecture

### Setup & Configuration
- Zero-config deploy: only `DATABASE_URL` needed (auto-set by Vercel Postgres)
- In-app setup wizard (`/setup`) guides through Whop config on first visit
- All config stored in `SystemConfig` DB table via `lib/config.ts`
- Env vars work as fallback for power users (checked before DB)
- First user to sign in via OAuth becomes admin (`isAdmin` on User model)

### Config System (`lib/config.ts`)
- `getConfig(key)` / `setConfig(key, value)` — DB-backed with env var fallback and in-memory cache
- `getPlansConfig()` — merges static plan metadata from `constants.ts` with dynamic plan IDs from DB/env
- `isSetupComplete()` — checks if app is configured (setup_complete flag or whop_app_id exists)
- All config keys: whop_app_id, whop_api_key, whop_webhook_secret, plan IDs, product IDs, accent_color, analytics_*, error_tracking_dsn, email_*, setup_complete

### Auth Flow
- OAuth 2.1 + PKCE — Public client mode (no client_secret needed)
- PKCE state stored in httpOnly cookie (not in URL state param like whop-ecom)
- Session = JWT in httpOnly cookie, 7-day TTL, signed with SESSION_SECRET (auto-generated)
- JWT carries identity; **plan is always read fresh from DB** (kept current by Whop webhooks)
- Session includes `isAdmin` flag for admin-only features and `profileImageUrl` for avatar display
- Proxy (`proxy.ts`) checks cookie existence on `/dashboard/*`; full JWT verification in `getSession()`

### Payments
- Whop embedded checkout via `@whop/checkout` React component (`WhopCheckoutEmbed`)
- Two-step checkout: native billing form (email, name, address) → Whop embedded payment
- Pricing buttons link to `/checkout?plan={key}&interval={monthly|yearly}`
- Billing intervals: monthly/yearly toggle on pricing page; each paid tier has two Whop plan IDs
- Checkout pre-fills email for logged-in users
- Plans fetched from `/api/config/plans` for client components
- Webhooks (`membership_activated` / `membership_deactivated`) update user plan in DB

### Key Endpoints
- `GET /api/auth/login?next=/dashboard` — initiate OAuth
- `GET /api/auth/callback` — OAuth callback, creates session, first-user-is-admin
- `GET /api/auth/logout` — clear session
- `GET /api/auth/me` — current user (for client-side checks)
- `POST /api/auth/delete-account` — delete user account (requires confirmation)
- `POST /api/webhooks/whop` — Whop webhook handler
- `GET/POST /api/setup` — read/write config during setup (open pre-setup, admin-only after)
- `POST /api/setup/complete` — mark setup as done (admin-only)
- `GET /api/config/plans` — plan config for client components
- `GET/POST /api/config/accent` — read/save accent color (admin-only POST)
- `GET/POST /api/config/integrations` — read/save integration settings (admin-only)
- `GET /api/search` — Fumadocs full-text search

## Tech Stack
- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS v4**
- **Prisma 7** + PostgreSQL (pg driver adapter via `@prisma/adapter-pg`)
- **jose** for JWT signing/verification
- **@whop/checkout** for embedded checkout; direct fetch to `https://api.whop.com` for auth/API
- **Fumadocs** + MDX for documentation site at `/docs`

## Important Patterns
- `getSession()` — get current session or null; plan is always fresh from DB (never stale JWT). Deduped per-request via `React.cache()`.
- `requireSession()` — get session or redirect to `/login` (protected pages)
- `requirePlan("pro")` — get session or redirect to `/pricing` if plan insufficient. Hierarchy: enterprise > pro > free.
- `hasMinimumPlan(userPlan, minimumPlan)` — pure function for plan level comparison in API routes
- `<PlanGate plan={session.plan} minimum="pro">` — client component for conditional rendering (pass plan from server parent)
- `checkWhopAccess(whopUserId, productId, apiKey)` / `hasWhopAccess(whopUserId, productId)` — real-time Whop API access checks (for authoritative gating)
- `getConfig(key)` — read config value (cache → env → DB)
- `getPlansConfig()` — server-side plan config (use in server components, pass to client as props)
- `sendEmail({ to, subject, html })` — sends via configured provider (Resend/SendGrid), returns `{ success, error? }`
- Static plan metadata in `lib/constants.ts`; dynamic plan IDs via `lib/config.ts`
- Client components get plan config as props from server parents, or fetch `/api/config/plans`
- Admin-configurable accent color applied via CSS custom properties (`--accent`, `--accent-foreground`)
- Admin-configurable integrations (analytics, error tracking, email) via Settings → Integrations

## Whop API Endpoints Used
- `https://api.whop.com/oauth/authorize` — OAuth authorization
- `https://api.whop.com/oauth/token` — token exchange
- `https://api.whop.com/oauth/userinfo` — user profile (OIDC)
- `https://api.whop.com/api/v1/users/{id}/access/{resource_id}` — check user access to product/experience

## Webhook Verification
- Whop uses standardwebhooks format (HMAC-SHA256)
- Headers: `webhook-id`, `webhook-signature`, `webhook-timestamp`
- Secret is used raw as HMAC key (no base64 decoding needed)

## File Structure
```
app/                        # Pages and API routes
├── (auth)/                 # Login, auth error (unprotected)
├── (marketing)/            # Pricing (unprotected)
├── setup/                  # Setup wizard (shown on first visit)
├── dashboard/              # Protected area (layout calls requireSession)
├── checkout/               # Embedded Whop checkout (two-step billing form)
├── checkout/success/       # Post-payment redirect
├── docs/                   # Documentation site (Fumadocs)
├── not-found.tsx           # Global 404 page
├── error.tsx               # Global error boundary
└── api/
    ├── auth/               # login, callback, logout, me, delete-account
    ├── setup/              # Config read/write + completion
    ├── config/             # plans, accent color, integrations
    ├── search/             # Fumadocs full-text search
    └── webhooks/whop/      # Whop webhook handler
components/
├── landing/                # Hero, features, pricing cards, header, footer
├── dashboard/              # Sidebar, header, upgrade banner, delete account, integrations
├── checkout/               # Two-step checkout form
└── setup/                  # Setup wizard
content/docs/               # Documentation MDX files
lib/
├── auth.ts                 # JWT session + plan gating (requirePlan, hasMinimumPlan)
├── config.ts               # DB-backed config system (getConfig, getPlansConfig)
├── whop.ts                 # Whop OAuth, webhook, access check helpers
├── db.ts                   # Prisma client singleton
├── constants.ts            # Static plan metadata, APP_NAME, types
├── analytics.ts            # Analytics script generation (PostHog, GA, Plausible)
├── email.ts                # Email sending (Resend, SendGrid)
├── source.ts               # Fumadocs content source loader
└── utils.ts                # cn(), formatDate()
proxy.ts                   # Protects /dashboard/* routes (Next.js 16 proxy)
source.config.ts            # Fumadocs MDX content config
mdx-components.tsx          # MDX component overrides
prisma/schema.prisma        # User (with isAdmin) + SystemConfig models
prisma.config.ts            # Prisma 7 configuration
```

## Pre-Commit Checklist
1. Run `pnpm build` — must pass cleanly
2. Check for TypeScript errors
3. No hardcoded secrets or API keys
