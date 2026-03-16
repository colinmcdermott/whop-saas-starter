import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { prisma } from "@/lib/db";

/**
 * POST /api/billing/uncancel
 *
 * Reverses a pending cancellation for the current user's membership.
 * Calls the Whop API to uncancel, then updates the local DB.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Look up the user's membership ID
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { whopMembershipId: true, cancelAtPeriodEnd: true },
  });

  if (!user?.whopMembershipId) {
    return NextResponse.json(
      { error: "No active membership found" },
      { status: 400 },
    );
  }

  if (!user.cancelAtPeriodEnd) {
    return NextResponse.json(
      { error: "Membership is not pending cancellation" },
      { status: 400 },
    );
  }

  const apiKey = await getConfig("whop_api_key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Whop API key not configured" },
      { status: 500 },
    );
  }

  // Call Whop's uncancel API
  const res = await fetch(
    `https://api.whop.com/api/v1/memberships/${user.whopMembershipId}/uncancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const error = await res.text().catch(() => "Unknown error");
    console.error(`[Uncancel] Whop API error (${res.status}): ${error}`);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 502 },
    );
  }

  // Update local DB immediately (webhook will also fire, but this is faster)
  await prisma.user.update({
    where: { id: session.userId },
    data: { cancelAtPeriodEnd: false },
  });

  return NextResponse.json({ success: true });
}
