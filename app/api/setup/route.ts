import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSetupStatus, setConfigs, isSetupComplete } from "@/lib/config";
import { PLAN_KEYS, getPlanBillingIntervals, planConfigKey, planConfigKeyYearly } from "@/lib/constants";

const ALLOWED_KEYS = new Set([
  "whop_app_id",
  "whop_api_key",
  "whop_webhook_secret",
  ...PLAN_KEYS.flatMap((key) => {
    const keys = [planConfigKey(key)];
    if (getPlanBillingIntervals(key).includes("yearly")) {
      keys.push(planConfigKeyYearly(key));
    }
    return keys;
  }),
  "accent_color",
]);

/**
 * GET /api/setup — Returns current setup status.
 * Open before setup is complete; admin-only after.
 */
export async function GET() {
  const setupDone = await isSetupComplete();

  if (setupDone) {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const status = await getSetupStatus();
  return NextResponse.json(status);
}

/**
 * POST /api/setup — Save config values.
 * Body: { configs: Record<string, string> }
 * Open before setup is complete; admin-only after.
 */
export async function POST(request: Request) {
  const setupDone = await isSetupComplete();

  if (setupDone) {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: { configs?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.configs || typeof body.configs !== "object") {
    return NextResponse.json(
      { error: 'Expected { configs: Record<string, string> }' },
      { status: 400 }
    );
  }

  // Filter to only allowed keys
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.configs)) {
    if (ALLOWED_KEYS.has(key) && typeof value === "string") {
      filtered[key] = value;
    }
  }

  await setConfigs(filtered);
  return NextResponse.json({ saved: true });
}
