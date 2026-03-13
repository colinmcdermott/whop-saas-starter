import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setConfig, isSetupComplete } from "@/lib/config";

/**
 * POST /api/setup/complete — Mark setup as done.
 * Requires an authenticated admin session.
 */
export async function POST() {
  const setupDone = await isSetupComplete();
  if (setupDone) {
    return NextResponse.json({ already: true });
  }

  // Must be signed in (the OAuth test step ensures this)
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json(
      { error: "You must be signed in as admin to complete setup" },
      { status: 403 }
    );
  }

  await setConfig("setup_complete", "true");
  return NextResponse.json({ complete: true });
}
