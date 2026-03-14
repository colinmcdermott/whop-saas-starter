import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { setConfig, getConfig } from "@/lib/config";

/** Valid integration config keys that can be set via this endpoint */
const INTEGRATION_KEYS = new Set([
  "analytics_provider",
  "analytics_id",
  "error_tracking_dsn",
  "email_provider",
  "email_api_key",
]);

/** Keys that are safe to return in full (not secrets) */
const SAFE_KEYS = new Set(["analytics_provider", "email_provider"]);

/** Mask a secret value — show only last 4 chars */
function maskSecret(value: string): string {
  if (value.length <= 4) return "****";
  return "****" + value.slice(-4);
}

/** GET /api/config/integrations — Get integration status (admin only) */
export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result: Record<string, string | null> = {};
  for (const key of INTEGRATION_KEYS) {
    const value = await getConfig(key);
    if (!value) {
      result[key] = null;
    } else if (SAFE_KEYS.has(key)) {
      result[key] = value;
    } else {
      result[key] = maskSecret(value);
    }
  }

  return NextResponse.json(result);
}

/** POST /api/config/integrations — Save integration config (admin only) */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only save allowed keys
  for (const [key, value] of Object.entries(body)) {
    if (!INTEGRATION_KEYS.has(key)) continue;
    // Skip masked values (user didn't change them)
    if (typeof value === "string" && value.startsWith("****")) continue;
    await setConfig(key, value);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ saved: true });
}
