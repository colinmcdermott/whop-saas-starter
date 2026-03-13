import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getPlanFromWhopPlanId } from "@/lib/constants";
import { verifyWebhookSignature } from "@/lib/whop";

// ---------------------------------------------------------------------------
// Webhook payload types
// ---------------------------------------------------------------------------

interface WebhookEvent {
  type: string;
  data: WebhookMembershipData;
}

interface WebhookMembershipData {
  id?: string;
  user_id?: string;
  plan_id?: string;
}

/**
 * POST /api/webhooks/whop
 *
 * Handles Whop webhook events for subscription management.
 *
 * Events handled:
 * - membership.activated   → Activate subscription (upgrade user plan)
 * - membership.deactivated → Deactivate subscription (downgrade to free)
 * - payment.succeeded      → Log payment (optional)
 *
 * Setup:
 * 1. In your Whop app settings, add a webhook endpoint pointing to:
 *    https://your-domain.com/api/webhooks/whop
 * 2. Copy the webhook secret to WHOP_WEBHOOK_SECRET in your .env.local
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify the webhook signature
  const isValid = await verifyWebhookSignature(body, {
    "webhook-id": request.headers.get("webhook-id"),
    "webhook-signature": request.headers.get("webhook-signature"),
    "webhook-timestamp": request.headers.get("webhook-timestamp"),
  });
  if (!isValid) {
    console.error("[Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event: WebhookEvent = JSON.parse(body);
  const eventType = event.type;
  console.log(`[Webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case "membership.activated": {
        await handleMembershipActivated(event.data);
        break;
      }

      case "membership.deactivated": {
        await handleMembershipDeactivated(event.data);
        break;
      }

      case "payment.succeeded": {
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

async function handleMembershipActivated(data: WebhookMembershipData) {
  if (!data.user_id) {
    console.error("[Webhook] membership.activated missing user_id");
    return;
  }

  const plan = data.plan_id ? getPlanFromWhopPlanId(data.plan_id) : "pro";

  await prisma.user.upsert({
    where: { whopUserId: data.user_id },
    update: {
      plan,
      whopMembershipId: data.id ?? null,
    },
    create: {
      whopUserId: data.user_id,
      plan,
      whopMembershipId: data.id ?? null,
    },
  });

  console.log(`[Webhook] User ${data.user_id} upgraded to ${plan}`);
}

async function handleMembershipDeactivated(data: WebhookMembershipData) {
  if (!data.user_id) {
    console.error("[Webhook] membership.deactivated missing user_id");
    return;
  }

  await prisma.user.updateMany({
    where: { whopUserId: data.user_id },
    data: { plan: "free", whopMembershipId: null },
  });

  console.log(`[Webhook] User ${data.user_id} downgraded to free`);
}
