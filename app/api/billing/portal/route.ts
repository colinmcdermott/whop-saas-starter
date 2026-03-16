import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getSubscriptionDetails } from "@/lib/subscription";

/**
 * GET /api/billing/portal
 *
 * Redirects the user to their Whop billing portal where they can
 * manage their subscription, update payment methods, and view
 * billing history.
 *
 * - Paid users → Whop billing portal for their membership
 * - Free users → /pricing (no active membership to manage)
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const result = await getSubscriptionDetails(session.userId);

  if (!result.hasSubscription || !result.subscription?.whopMembershipId) {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }

  // Redirect to Whop's billing portal for this membership
  return NextResponse.redirect(
    `https://whop.com/billing/manage/${result.subscription.whopMembershipId}/`
  );
}
