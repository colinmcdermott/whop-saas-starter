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

### Auth Flow
- OAuth 2.1 + PKCE — no client_secret needed
- PKCE state stored in httpOnly cookie (not in URL state param like whop-ecom)
- Session = JWT in httpOnly cookie, 7-day TTL, signed with SESSION_SECRET
- Proxy (`proxy.ts`) checks cookie existence on `/dashboard/*`; full JWT verification in `requireSession()`

### Payments
- Whop embedded checkout via loader script (`https://js.whop.com/static/checkout/loader.js`)
- Pricing buttons use `data-whop-checkout-plan-id` + `data-whop-checkout-return-url` attributes
- Loader script auto-attaches checkout behavior to elements with these data attributes
- Webhooks (`membership.went_valid` / `membership.went_invalid`) update user plan in DB
- Docs: https://docs.whop.com/payments/checkout-embed

### Key Endpoints
- `GET /api/auth/login?next=/dashboard` — initiate OAuth
- `GET /api/auth/callback` — OAuth callback, creates session
- `GET /api/auth/logout` — clear session
- `GET /api/auth/me` — current user (for client-side checks)
- `POST /api/webhooks/whop` — Whop webhook handler

## Tech Stack
- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS v4**
- **Prisma 7** + PostgreSQL (pg driver adapter via `@prisma/adapter-pg`)
- **jose** for JWT signing/verification
- **No @whop/sdk** — direct fetch to `https://api.whop.com`

## Important Patterns
- `getSession()` — get current session or null (server components, API routes)
- `requireSession()` — get session or redirect to `/login` (protected pages)
- Plan gating: check `session.plan` ("free" | "pro" | "enterprise")
- Plans configured in `lib/constants.ts` — map Whop plan IDs to local tiers

## Whop API Endpoints Used
- `https://api.whop.com/oauth/authorize` — OAuth authorization
- `https://api.whop.com/oauth/token` — token exchange
- `https://api.whop.com/api/v5/me` — user profile

## Webhook Verification
- Whop uses standardwebhooks format (HMAC-SHA256)
- Headers: `webhook-id`, `webhook-signature`, `webhook-timestamp`
- Secret must be base64-encoded before HMAC; API version must be **v1**

## File Structure
```
app/                        # Pages and API routes
├── (auth)/                 # Login, auth error (unprotected)
├── (marketing)/            # Pricing (unprotected)
├── dashboard/              # Protected area (layout calls requireSession)
├── checkout/success/       # Post-payment redirect
├── not-found.tsx           # Global 404 page
├── error.tsx               # Global error boundary
└── api/auth/, api/webhooks/
components/
├── landing/                # Hero, features, pricing cards, header, footer
└── dashboard/              # Sidebar, header, upgrade banner
lib/
├── auth.ts                 # JWT session management
├── whop.ts                 # Whop OAuth + webhook helpers
├── db.ts                   # Prisma client singleton
├── constants.ts            # Plan configuration
└── utils.ts                # cn(), formatDate()
proxy.ts                   # Protects /dashboard/* routes (Next.js 16 proxy)
prisma/schema.prisma        # User model with plan field
prisma.config.ts            # Prisma 7 configuration
```

## Pre-Commit Checklist
1. Run `pnpm build` — must pass cleanly
2. Check for TypeScript errors
3. No hardcoded secrets or API keys
