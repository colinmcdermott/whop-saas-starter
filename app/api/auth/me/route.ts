import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/auth/me
 *
 * Returns the current user's session data, or 401 if not authenticated.
 * Useful for client-side auth checks.
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    userId: session.userId,
    email: session.email,
    name: session.name,
    profileImageUrl: session.profileImageUrl,
    plan: session.plan,
  });
}
