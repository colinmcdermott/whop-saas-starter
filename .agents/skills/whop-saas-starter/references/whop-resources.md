# Whop Resources & Documentation

## Finding Whop Docs

Use the Whop MCP tool to search documentation:

```
mcp__claude_ai_Whop__search_whop_docs
```

Search for topics like "oauth", "webhooks", "plans", "checkout", "api", "billing".

## Whop Developer Dashboard

- Create and manage apps: https://whop.com/dash
- Configure OAuth, webhooks, plans, and products

## API Endpoints Used by This Template

| Endpoint | Purpose |
|----------|---------|
| `POST /oauth/token` | Exchange auth code for tokens |
| `GET /oauth/userinfo` | Get user profile (OIDC) |
| `GET /api/v1/users/{id}/access/{resource_id}` | Check user access to product |
| `POST /api/v1/memberships/{id}/uncancel` | Reverse pending cancellation |

Base URL: `https://api.whop.com`

## Webhook Events

Events sent to `POST /api/webhooks/whop`:

| Event | When |
|-------|------|
| `membership_activated` | User purchases or is granted access |
| `membership_deactivated` | Membership expires, refunded, or chargebacked |
| `membership_cancel_at_period_end_changed` | User cancels or uncancels |
| `payment_succeeded` | Payment processed |
| `payment_failed` | Payment attempt failed |

Verification: standardwebhooks format (HMAC-SHA256) with headers `webhook-id`, `webhook-signature`, `webhook-timestamp`.

## Whop MCP Server

For AI-assisted development, Whop provides an MCP server for real-time documentation access.

Setup guide: https://docs.whop.com/developer/guides/ai_and_mcp

This enables tools like Claude Code to search Whop docs, look up API references, and get current integration guidance without leaving the development environment.

## Key Concepts

- **App** — Your application registered with Whop (has an App ID)
- **Plan** — A pricing tier within your app (has a Plan ID)
- **Product** — A purchasable offering (has a Product ID)
- **Membership** — A user's active subscription to a plan
- **Experience** — The user-facing view of your app within Whop (not used in this standalone template)

## This Template vs Whop Apps

This is a **standalone** Next.js app — NOT a Whop iframe app:
- Runs on your own domain, not inside Whop
- Uses OAuth for auth, not Whop's iframe SDK
- Uses embedded checkout, not Whop's built-in checkout
- Has its own dashboard, not Whop's experience view

For building Whop iframe apps, see the `whop-dev` skill instead.
