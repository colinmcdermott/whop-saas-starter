# Checkout & Billing

## Checkout Flow

Two-step embedded checkout:

```
/pricing → click plan → /checkout?plan={key}&interval={monthly|yearly}
  → Step 1: Billing form (email, name, address)
  → Step 2: Whop embedded payment (via @whop/checkout)
  → /checkout/success?plan={key}
```

The `CheckoutForm` component (`components/checkout/checkout-form.tsx`) handles both steps.

### Key implementation details:
- Pre-fills email/name for logged-in users
- Billing address passed to Whop via `checkoutControlsRef.current?.setAddress()`
- Theme-aware: detects dark mode via `MutationObserver` on html class
- `skipRedirect: true` — handles redirect manually to show success page

## Billing Portal

`GET /api/billing/portal` redirects paid users to Whop's self-service billing portal. Free users are redirected to `/pricing`.

## Subscription Cancellation

Users cancel through Whop's billing portal. The webhook `membership_cancel_at_period_end_changed` updates `cancelAtPeriodEnd` on the User model.

### Reactivation:
- `POST /api/billing/uncancel` calls Whop's uncancel API
- `ReactivateBanner` and `ReactivateButton` components handle the UI

## Subscription Helpers

Located in `lib/subscription.ts`:

```tsx
// Typed subscription lookup
const details = await getSubscriptionDetails(userId);
// { hasSubscription: true, subscription: { plan, whopMembershipId, cancelAtPeriodEnd, status } }

// Boolean checks
const subscribed = await isUserSubscribed(userId);
const status = await getUserSubscriptionStatus(userId); // "active" | "canceling" | "free"
```

## Real-Time Access Checks

For authoritative gating (beyond JWT-based plan checks):

```tsx
import { hasWhopAccess } from "@/lib/whop";

const hasAccess = await hasWhopAccess(whopUserId, productId);
// Calls Whop API directly — use for sensitive operations
```

## Whop Checkout Docs

For Whop checkout customization, plan creation, and billing portal setup, use the `mcp__claude_ai_Whop__search_whop_docs` tool and search for "checkout", "plans", or "billing".
