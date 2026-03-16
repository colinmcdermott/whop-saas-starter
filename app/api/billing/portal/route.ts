import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  // Look up the user's membership ID from the database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { whopMembershipId: true },
  });

  if (!user?.whopMembershipId) {
    // No active membership — send to pricing
    return NextResponse.redirect(new URL("/pricing", request.url));
  }

  // Redirect to Whop's billing portal for this membership
  return NextResponse.redirect(
    `https://whop.com/billing/manage/${user.whopMembershipId}/`
  );
}
