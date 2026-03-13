import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSetupStatus, setConfigs, isSetupComplete } from "@/lib/config";

const ALLOWED_KEYS = new Set([
  "whop_app_id",
  "whop_api_key",
  "whop_webhook_secret",
  "whop_free_plan_id",
  "whop_pro_plan_id",
  "whop_pro_plan_id_yearly",
  "whop_enterprise_plan_id",
  "whop_enterprise_plan_id_yearly",
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
