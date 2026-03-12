import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getPlanFromWhopPlanId } from "@/lib/constants";

/**
 * POST /api/webhooks/whop
 *
 * Handles Whop webhook events for subscription management.
 *
 * Events handled:
 * - membership.went_valid   → Activate subscription (upgrade user plan)
 * - membership.went_invalid → Deactivate subscription (downgrade to free)
 * - payment.succeeded       → Log payment (optional)
 *
 * Setup:
 * 1. In your Whop app settings, add a webhook endpoint pointing to:
 *    https://your-domain.com/api/webhooks/whop
 * 2. Set the API version to v1
 * 3. Copy the webhook secret to WHOP_WEBHOOK_SECRET in your .env.local
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify the webhook signature
  const isValid = await verifySignature(body, request.headers);
  if (!isValid) {
    console.error("[Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    type: string;
    data: Record<string, unknown>;
  };

  const eventType = event.type;
  console.log(`[Webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case "membership.went_valid":
      case "membership_went_valid": {
        await handleMembershipValid(event.data);
        break;
      }

      case "membership.went_invalid":
      case "membership_went_invalid": {
        await handleMembershipInvalid(event.data);
        break;
      }

      case "payment.succeeded":
      case "payment_succeeded": {
        // Payment received — you can add logging or notifications here
        console.log("[Webhook] Payment succeeded:", event.data);
        break;
      }

      default: {
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[Webhook] Error processing ${eventType}:`, err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleMembershipValid(data: Record<string, unknown>) {
  const userId = data.user_id as string | undefined;
  const planId = data.plan_id as string | undefined;

  if (!userId) {
    console.error("[Webhook] membership.went_valid missing user_id");
    return;
  }

  const plan = planId ? getPlanFromWhopPlanId(planId) : "pro";

  // Upsert user — they may have purchased before creating an account
  await prisma.user.upsert({
    where: { whopUserId: userId },
    update: {
      plan,
      whopMembershipId: (data.id as string) ?? null,
    },
    create: {
      whopUserId: userId,
      plan,
      whopMembershipId: (data.id as string) ?? null,
    },
  });

  console.log(`[Webhook] User ${userId} upgraded to ${plan}`);
}

async function handleMembershipInvalid(data: Record<string, unknown>) {
  const userId = data.user_id as string | undefined;

  if (!userId) {
    console.error("[Webhook] membership.went_invalid missing user_id");
    return;
  }

  await prisma.user.updateMany({
    where: { whopUserId: userId },
    data: { plan: "free", whopMembershipId: null },
  });

  console.log(`[Webhook] User ${userId} downgraded to free`);
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function verifySignature(
  body: string,
  headers: Headers
): Promise<boolean> {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Webhook] WHOP_WEBHOOK_SECRET not configured");
    return false;
  }

  const msgId = headers.get("webhook-id");
  const signature = headers.get("webhook-signature");
  const timestamp = headers.get("webhook-timestamp");

  if (!msgId || !signature || !timestamp) {
    console.error("[Webhook] Missing required webhook headers");
    return false;
  }

  // Reject old webhooks (replay protection, 5 min tolerance)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (Math.abs(now - ts) > 300) {
    console.error("[Webhook] Timestamp too old or too far in the future");
    return false;
  }

  // The secret needs to be base64-encoded before use as HMAC key
  const secretBytes = Uint8Array.from(atob(btoa(secret)), (c) =>
    c.charCodeAt(0)
  );

  const toSign = `${msgId}.${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(toSign)
  );

  const expected = `v1,${base64url(new Uint8Array(sig))}`;

  // Whop may send multiple signatures separated by spaces
  return signature.split(" ").some((s) => s === expected);
}
