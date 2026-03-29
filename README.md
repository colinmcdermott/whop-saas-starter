# Whop SaaS Starter

A production-ready SaaS starter template built with **Next.js 16**, **Whop** (for auth and payments), **Prisma 7** (PostgreSQL), and **Tailwind CSS v4**.

Authentication, payments, subscription management, and a clean dashboard — wired up and ready to go.

## Deploy to Vercel (Recommended)

The fastest way to get started. Click the button, follow the prompts, and you'll have a running app in minutes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcolinmcdermott%2Fwhop-saas-starter&project-name=whop-saas-starter&repository-name=whop-saas-starter&envDescription=No+env+vars+needed%21+The+in-app+setup+wizard+handles+everything.&demo-title=Whop+SaaS+Starter&demo-description=A+production-ready+SaaS+starter+with+auth%2C+payments%2C+and+a+dashboard+%E2%80%94+powered+by+Whop.&demo-url=https%3A%2F%2Fwhop-saas-starter.vercel.app&demo-image=https%3A%2F%2Fwhop-saas-starter.vercel.app%2Fscreenshot.jpg&products=%5B%7B%22type%22%3A%22integration%22%2C%22group%22%3A%22postgres%22%7D%5D)

> **What happens when you click Deploy:**
> 1. Vercel clones the repo to your GitHub account
> 2. You're prompted to add a **Postgres database** (Neon, Supabase, Prisma Postgres, or Nile)
> 3. Vercel builds and deploys — the database tables are created automatically
> 4. Visit your app — the **setup wizard** walks you through connecting Whop

No environment variables to fill in manually. The setup wizard handles everything.

---

## Setup Wizard

After deploying, visit your app URL. The **setup wizard** will appear automatically and guide you through:

1. **Connect Whop** — Enter your App ID and API Key
2. **Configure OAuth** — Copy-paste your redirect URI and webhook URL
3. **Sign in** — Test OAuth and become the admin
4. **Set up plans** — Enter your Whop plan IDs for pricing tiers

The wizard stores all config in your database — no environment variables needed.

---

## Manual Setup (Alternative)

If you prefer setting things up via environment variables (or for CI/CD), follow these steps.

### Step 1: Set up a PostgreSQL database

You need a PostgreSQL database to store user accounts, sessions, and app config.

1. Create a free database with [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Prisma Postgres](https://www.prisma.io/postgres)
2. Copy the connection string (starts with `postgresql://...`)
3. Add it as `DATABASE_URL` in your Vercel project's Environment Variables (or `.env.local` for local dev)
4. Push the database schema:
   ```bash
   pnpm db:push
   ```

> **Tip:** If you used the Deploy to Vercel button and added a Postgres integration, this is already done — `DATABASE_URL` is set automatically and the schema is pushed during build.

### Step 2: Create a Whop app

1. Go to [whop.com/dashboard/developer](https://whop.com/dashboard/developer)
2. Click **Create App**
3. You'll see your app credentials:
   - **Client ID** — looks like `app_xxxxxxxxx`
   - **API Key** — looks like `apik_xxxxxxxxx`
4. Under the **OAuth** section:
   - Set **Client mode** to **Public**
   - Add your **Redirect URI**:
     - `https://YOUR-APP.vercel.app/api/auth/callback`
     - (Replace `YOUR-APP` with your actual Vercel domain)

> **Why Public mode?** It uses PKCE (a secure code exchange) instead of a static client secret. This is the recommended approach and what this template is built for.

### Step 3: Create your plans in Whop

You need to create plans (pricing tiers) in Whop so users can subscribe.

1. Go to [whop.com/dashboard](https://whop.com/dashboard)
2. Create a **product** for each tier (e.g., Free, Starter, Pro)
3. For each product, create a **plan** with the price you want
   - For the Free tier: create a $0 plan (this lets you manage all users in Whop)
4. Copy each **Plan ID** — it looks like `plan_xxxxxxxxx`
   - Find it in the plan's settings or checkout link details
   - **Important:** Use the `plan_` ID, not the `prod_` ID

> **Where to find Plan IDs:** Go to your product → Checkout links → click Details on any pricing option. The Plan ID starts with `plan_`.

### Step 4: Add environment variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add these:

| Variable | Where to find it | Example |
|---|---|---|
| `NEXT_PUBLIC_WHOP_APP_ID` | Whop Developer Dashboard → your app | `app_xxxxxxxxx` |
| `WHOP_API_KEY` | Whop Developer Dashboard → your app | `apik_xxxxxxxxx` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | `https://your-app.vercel.app` |
| `DATABASE_URL` | Auto-set if you added Postgres during deploy | `postgresql://...` |
| `NEXT_PUBLIC_WHOP_FREE_PLAN_ID` | Whop Dashboard → your Free plan | `plan_xxxxxxxxx` |
| `NEXT_PUBLIC_WHOP_STARTER_PLAN_ID` | Whop Dashboard → your Starter monthly plan | `plan_xxxxxxxxx` |
| `NEXT_PUBLIC_WHOP_STARTER_PLAN_ID_YEARLY` | Whop Dashboard → your Starter yearly plan | `plan_xxxxxxxxx` |
| `NEXT_PUBLIC_WHOP_PRO_PLAN_ID` | Whop Dashboard → your Pro monthly plan | `plan_xxxxxxxxx` |
| `NEXT_PUBLIC_WHOP_PRO_PLAN_ID_YEARLY` | Whop Dashboard → your Pro yearly plan | `plan_xxxxxxxxx` |
| `SESSION_SECRET` | **Optional.** Auto-generated and stored in DB if not set | `a1b2c3d4...` |

> **Tip:** If you added a Postgres database during the Vercel deploy, `DATABASE_URL` is already set. Check your Environment Variables to confirm.

> **About SESSION_SECRET:** A secret key used to sign login sessions. You don't need to set this — the app automatically generates one and stores it in your database. If you prefer to manage it yourself, set any random 32+ character string.

After adding the variables, **redeploy** your app (Vercel → Deployments → click the three dots on the latest deployment → Redeploy).

### Step 5: Set up webhooks

Webhooks tell your app when someone subscribes, cancels, or gets refunded.

1. Go to [whop.com/dashboard/developer](https://whop.com/dashboard/developer)
2. Select your app → **Webhooks**
3. Click **Create Webhook**
4. Set the URL to: `https://YOUR-APP.vercel.app/api/webhooks/whop`
5. Subscribe to these events:
   - `membership_activated`
   - `membership_deactivated`
   - `payment_succeeded`
   - `payment_failed`
   - `refund_created`
   - `dispute_created`
6. Copy the **Webhook Secret** and add it as `WHOP_WEBHOOK_SECRET` in your Vercel env vars
7. **Redeploy** again after adding the webhook secret

### Step 6: Test it

1. Visit your app URL
2. Click **Sign in** — you should be redirected to Whop's login page
3. After signing in, you should land on the dashboard
4. Go to the pricing page and try subscribing to a plan
5. Check the Whop dashboard to see the subscription

**That's it! Your SaaS is live.**

---

## Local Development

If you want to run the app locally:

```bash
git clone https://github.com/whopio/whop-saas-starter.git
cd whop-saas-starter
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials (same values as Vercel).

For local webhook testing, use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Then add the ngrok URL as a webhook endpoint in Whop: `https://xxxx.ngrok.io/api/webhooks/whop`

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

- **Authentication** — Sign in with Whop (OAuth 2.1 + PKCE)
- **Payments** — Subscription billing via embedded Whop checkout
- **Webhooks** — Automatic plan upgrades/downgrades on subscription changes
- **Dashboard** — Protected, responsive dashboard with sidebar navigation
- **Database** — PostgreSQL with Prisma ORM (auto-provisioned on deploy)
- **Route protection** — Middleware protects `/dashboard/*` routes
- **Landing page** — Marketing page with hero, features, and pricing sections
- **Dark mode** — Automatic dark/light mode based on system preference
- **AI-ready** — Bundled [agent skill](/.agents/skills/whop-saas-starter/) guides Claude Code, Cursor, Copilot, and other AI agents on how to extend this template

## Project Structure

```
app/
├── (marketing)/pricing/     # Pricing page
├── (auth)/login/            # Login page
├── dashboard/               # Protected dashboard (layout enforces auth)
├── checkout/                # Embedded Whop checkout
├── checkout/success/        # Post-payment redirect
└── api/
    ├── auth/login/          # Initiate OAuth
    ├── auth/callback/       # OAuth callback
    ├── auth/logout/         # Clear session
    ├── auth/me/             # Current user (client-side)
    └── webhooks/whop/       # Whop webhook handler
components/
├── landing/                 # Marketing page components
└── dashboard/               # Dashboard components
db/
├── index.ts                 # Prisma client singleton
└── schema.prisma            # Database schema
lib/
├── auth.ts                  # Session management (JWT cookies)
├── subscription.ts          # Typed subscription/membership query helpers
├── whop.ts                  # Whop OAuth + webhook helpers
├── constants.ts             # Plan tiers (single source of truth — edit this!)
└── utils.ts                 # Utility functions
proxy.ts                     # Route protection (Next.js 16)
```

## Customization

### Rename your app

Edit `lib/constants.ts` — change `APP_NAME` and `APP_DESCRIPTION` at the top. Used across the header, sidebar, login page, footer, and metadata.

### Change the plans

Edit `PLAN_METADATA` in `lib/constants.ts` to add, remove, or modify plan tiers. The plan system is data-driven — pricing page, setup wizard, config keys, env vars, and plan gating all adapt automatically. Create matching plans in Whop and connect the IDs via the setup wizard or env vars (pattern: `NEXT_PUBLIC_WHOP_{PLAN_KEY}_PLAN_ID`).

### Add new pages

Protected pages go in `app/dashboard/`. Public pages go in `app/(marketing)/`. The proxy automatically protects `/dashboard/*` routes.

### Change the look

Edit `app/globals.css`. The starter uses Tailwind CSS v4 with CSS custom properties for theming. Modify the `:root` variables to change colors.

## Development Commands

```bash
pnpm dev          # Dev server with Turbopack
pnpm build        # Production build
pnpm lint         # ESLint
pnpm db:push      # Push schema to database
pnpm db:studio    # Visual database browser
```

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Whop](https://whop.com) (OAuth 2.1 + PKCE, payments, webhooks)
- [Prisma 7](https://prisma.io) + PostgreSQL
- [Tailwind CSS v4](https://tailwindcss.com)
- [jose](https://github.com/panva/jose) (JWT sessions)

## Contributing

Pull requests are welcome! If you have ideas, bug fixes, or improvements, feel free to open a PR.

For feedback or questions, reach out to colin@whop.com.

## License

MIT
