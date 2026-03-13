# Whop SaaS Starter

A production-ready SaaS starter template built with **Next.js 16**, **Whop** (for auth and payments), **Prisma 7** (PostgreSQL), and **Tailwind CSS v4**.

Everything you need to launch a SaaS product — authentication, payments, subscription management, and a clean dashboard — wired up and ready to go.

## Features

- **Authentication** — Sign in with Whop (OAuth 2.1 + PKCE)
- **Payments** — Subscription billing via Whop checkout
- **Webhooks** — Automatic plan upgrades/downgrades on subscription changes
- **Dashboard** — Protected, responsive dashboard with sidebar navigation
- **Database** — PostgreSQL with Prisma ORM (type-safe queries, migrations)
- **Middleware** — Route protection for authenticated areas
- **Landing page** — Marketing page with hero, features, and pricing sections
- **Dark mode** — Automatic dark/light mode based on system preference
- **Vercel-ready** — Optimized for one-click Vercel deployment

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/colinmcdermott/whop-saas-starter.git
cd whop-saas-starter
pnpm install
```

### 2. Set up your database

You need a PostgreSQL database. Recommended providers:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (easiest with Vercel)
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)

### 3. Create a Whop app

1. Go to the [Whop Developer Dashboard](https://whop.com/dashboard/developer)
2. Click **Create App**
3. Note your **Client ID** (starts with `app_`) and **Client Secret** (starts with `apik_`)
4. Under **OAuth**, add your redirect URI:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://your-domain.com/api/auth/callback`

### 4. Create Whop plans (for paid tiers)

1. In your [Whop Dashboard](https://whop.com/dashboard), create products/plans for your paid tiers
2. Note the **Plan IDs** (start with `plan_`)
3. You'll add these as environment variables

### 5. Set up webhooks

1. In your Whop app settings, add a webhook endpoint:
   - Development: Use [ngrok](https://ngrok.com) or similar to expose `http://localhost:3000/api/webhooks/whop`
   - Production: `https://your-domain.com/api/webhooks/whop`
2. Subscribe to these events:
   - `membership_activated`
   - `membership_deactivated`
   - `payment_succeeded`
   - `payment_failed`
   - `refund_created`
   - `dispute_created`
3. Copy the **Webhook Secret**

### 6. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_WHOP_APP_ID="app_xxxxxxxxx"
WHOP_API_KEY="apik_xxxxxxxxx"
WHOP_WEBHOOK_SECRET="your_webhook_secret_here"
SESSION_SECRET="generate-a-random-32-char-string"
NEXT_PUBLIC_WHOP_FREE_PLAN_ID="plan_xxxxxxxxx"
NEXT_PUBLIC_WHOP_PRO_PLAN_ID="plan_xxxxxxxxx"
NEXT_PUBLIC_WHOP_ENTERPRISE_PLAN_ID="plan_xxxxxxxxx"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a session secret:
```bash
openssl rand -base64 32
```

### 7. Set up the database

```bash
pnpm db:push
```

### 8. Start developing

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
whop-saas-starter/
├── app/
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Landing page
│   ├── globals.css                     # Global styles + CSS variables
│   ├── (marketing)/
│   │   └── pricing/page.tsx            # Pricing page with FAQ
│   ├── (auth)/
│   │   ├── login/page.tsx              # Login page
│   │   └── auth-error/page.tsx         # OAuth error page
│   ├── dashboard/
│   │   ├── layout.tsx                  # Dashboard layout (auth-protected)
│   │   ├── page.tsx                    # Dashboard home
│   │   └── settings/page.tsx           # Account settings
│   ├── checkout/
│   │   └── success/page.tsx            # Post-checkout redirect
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts          # Initiate OAuth flow
│       │   ├── callback/route.ts       # OAuth callback handler
│       │   ├── logout/route.ts         # Clear session
│       │   └── me/route.ts             # Get current user
│       └── webhooks/
│           └── whop/route.ts           # Whop webhook handler
├── components/
│   ├── landing/                        # Marketing page components
│   ├── dashboard/                      # Dashboard components
│   └── auth/                           # Auth-related components
├── lib/
│   ├── auth.ts                         # Session management (JWT cookies)
│   ├── whop.ts                         # Whop API helpers (OAuth, webhooks)
│   ├── db.ts                           # Prisma client singleton
│   ├── constants.ts                    # Plan configuration
│   └── utils.ts                        # Utility functions
├── prisma/
│   └── schema.prisma                   # Database schema
├── proxy.ts                            # Route protection (Next.js 16 proxy)
├── .env.example                        # Environment variable template
└── README.md                           # This file
```

## How It Works

### Authentication Flow

```
User clicks "Sign in" → /api/auth/login
  → Generate PKCE code_verifier + code_challenge
  → Store in secure cookie (10 min TTL)
  → Redirect to Whop OAuth (https://api.whop.com/oauth/authorize)

User authorizes on Whop → /api/auth/callback
  → Verify state parameter (CSRF protection)
  → Exchange code for tokens (PKCE, no client secret)
  → Fetch user profile from Whop API
  → Create/update user in database
  → Set session cookie (JWT, 7 day TTL)
  → Redirect to dashboard
```

### Subscription Flow

```
User clicks plan on pricing page
  → Whop checkout opens (embedded or redirect)
  → User completes payment on Whop

Whop sends webhook → /api/webhooks/whop
  → Verify webhook signature
  → membership_activated → upgrade user plan in DB
  → membership_deactivated → downgrade to free

User visits dashboard
  → Session contains plan info
  → Features gated by plan
```

### Access Gating

Use `requireSession()` in server components to gate access:

```typescript
import { requireSession } from "@/lib/auth";

export default async function ProFeaturePage() {
  const session = await requireSession();

  if (session.plan === "free") {
    return <UpgradePrompt />;
  }

  return <ProFeatureContent />;
}
```

Or check the plan in API routes:

```typescript
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.plan === "free") return new Response("Upgrade required", { status: 403 });

  // Pro feature logic...
}
```

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/colinmcdermott/whop-saas-starter&env=DATABASE_URL,NEXT_PUBLIC_WHOP_APP_ID,WHOP_API_KEY,WHOP_WEBHOOK_SECRET,SESSION_SECRET,NEXT_PUBLIC_WHOP_FREE_PLAN_ID,NEXT_PUBLIC_WHOP_PRO_PLAN_ID,NEXT_PUBLIC_WHOP_ENTERPRISE_PLAN_ID,NEXT_PUBLIC_APP_URL)

### Manual deploy

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add all environment variables from `.env.example`
4. Deploy

### Post-deploy checklist

- [ ] Add your production domain to Whop OAuth redirect URIs
- [ ] Update `NEXT_PUBLIC_APP_URL` to your production URL
- [ ] Update webhook endpoint URL in Whop dashboard
- [ ] Test the full auth flow end-to-end
- [ ] Test a subscription purchase and webhook delivery

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_WHOP_APP_ID` | Yes | OAuth client ID (`app_...`) |
| `WHOP_API_KEY` | Yes | OAuth client secret (`apik_...`) |
| `WHOP_WEBHOOK_SECRET` | Yes | Whop webhook signing secret |
| `SESSION_SECRET` | Yes | Random string for JWT signing (32+ chars) |
| `NEXT_PUBLIC_WHOP_FREE_PLAN_ID` | Recommended | Whop plan ID for Free tier — $0 plan (`plan_...`) |
| `NEXT_PUBLIC_WHOP_PRO_PLAN_ID` | For payments | Whop plan ID for Pro tier (`plan_...`) |
| `NEXT_PUBLIC_WHOP_ENTERPRISE_PLAN_ID` | For payments | Whop plan ID for Enterprise tier (`plan_...`) |
| `NEXT_PUBLIC_APP_URL` | Recommended | Your app's public URL |

## Development Commands

```bash
pnpm dev          # Start dev server (with Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Prisma Studio (visual DB browser)
```

## Customization Guide

### Rename your app

Edit `lib/constants.ts` — change `APP_NAME`, `APP_DESCRIPTION`, and `LINKS` at the top of the file. These are used across the header, sidebar, login page, footer, and metadata. One file, one change.

### Change the plans

Edit `lib/constants.ts` to modify plan names, prices, and features. Add or remove tiers as needed. Make sure to create matching plans in your Whop dashboard and update the plan ID environment variables.

### Add new pages

Protected pages go in `app/dashboard/`. Unprotected pages go in `app/(marketing)/`. The proxy (`proxy.ts`) automatically protects all `/dashboard/*` routes.

### Change the look

Global styles and CSS variables are in `app/globals.css`. The starter uses Tailwind CSS v4 with CSS custom properties for theming. Modify the `:root` variables to change the color scheme.

### Add new webhook events

Edit `app/api/webhooks/whop/route.ts` to handle additional Whop webhook events. See the [Whop Webhook Documentation](https://docs.whop.com) for available events.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Auth & Payments**: [Whop](https://whop.com) (OAuth 2.1 + PKCE)
- **Database**: PostgreSQL with [Prisma 7](https://prisma.io)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Sessions**: JWT via [jose](https://github.com/panva/jose)
- **Hosting**: [Vercel](https://vercel.com) (recommended)

## License

MIT
