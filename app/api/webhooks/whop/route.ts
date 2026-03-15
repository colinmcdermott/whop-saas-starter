import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getPlanKeyFromWhopId, getConfig } from "@/lib/config";
import { verifyWebhookSignature } from "@/lib/whop";
import { DEFAULT_PLAN, PLAN_KEYS } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { paymentFailedEmail } from "@/lib/email-templates";

// ---------------------------------------------------------------------------
// Webhook payload types
// ---------------------------------------------------------------------------

interface WebhookEvent {
  type: string;
  data: WebhookData;
}

interface WebhookData {
  id?: string;
  user_id?: string;
  plan_id?: string;
  membership_id?: string;
}

/**
 * POST /api/webhooks/whop
 *
 * Handles Whop webhook events for subscription management.
 *
 * Events handled:
 * - membership_activated   → Activate subscription (upgrade user plan)
 * - membership_deactivated → Deactivate subscription (downgrade to free)
 * - payment_succeeded      → Log successful payment
 * - payment_failed         → Log failed payment
 * - refund_created         → Downgrade user on refund
 * - dispute_created        → Downgrade user on chargeback
 *
 * Setup:
 * 1. In your Whop app settings, add a webhook endpoint pointing to:
 *    https://your-domain.com/api/webhooks/whop
 * 2. Copy the webhook secret to WHOP_WEBHOOK_SECRET in your .env.local
 *    or enter it during the setup wizard
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  // Get webhook secret from config (DB or env)
  const webhookSecret = await getConfig("whop_webhook_secret");

  // Verify the webhook signature
  const isValid = await verifyWebhookSignature(
    body,
    {
      "webhook-id": request.headers.get("webhook-id"),
      "webhook-signature": request.headers.get("webhook-signature"),
      "webhook-timestamp": request.headers.get("webhook-timestamp"),
    },
    webhookSecret ?? undefined,
  );
  if (!isValid) {
    console.error("[Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event: WebhookEvent = JSON.parse(body);
  const eventType = event.type;
  console.log(`[Webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case "membership_activated": {
        await handleMembershipActivated(event.data);
        break;
      }

      case "membership_deactivated": {
        await handleMembershipDeactivated(event.data);
        break;
      }

      case "payment_succeeded": {
        console.log("[Webhook] Payment succeeded:", event.data);
        break;
      }

      case "payment_failed": {
        console.log("[Webhook] Payment failed:", event.data);
        if (event.data.user_id) {
          const user = await prisma.user.findUnique({
            where: { whopUserId: event.data.user_id },
            select: { email: true, name: true },
          });
          if (user?.email) {
            const email = paymentFailedEmail(user.name);
            sendEmail({ to: user.email, ...email }).catch((err) =>
              console.error("[Email] Payment failed email error:", err)
            );
          }
        }
        break;
      }

      case "refund_created": {
        await handleRefundOrDispute(event.data, "refund");
        break;
      }

      case "dispute_created": {
        await handleRefundOrDispute(event.data, "dispute");
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

async function handleMembershipActivated(data: WebhookData) {
  if (!data.user_id) {
    console.error("[Webhook] membership_activated missing user_id");
    return;
  }

  // If no plan_id in webhook, assume the first paid tier
  const plan = data.plan_id
    ? await getPlanKeyFromWhopId(data.plan_id)
    : (PLAN_KEYS[1] ?? DEFAULT_PLAN);

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

async function handleMembershipDeactivated(data: WebhookData) {
  if (!data.user_id) {
    console.error("[Webhook] membership_deactivated missing user_id");
    return;
  }

  await prisma.user.updateMany({
    where: { whopUserId: data.user_id },
    data: { plan: DEFAULT_PLAN, whopMembershipId: null },
  });

  console.log(`[Webhook] User ${data.user_id} downgraded to free`);
}

async function handleRefundOrDispute(data: WebhookData, reason: "refund" | "dispute") {
  if (!data.user_id) {
    console.error(`[Webhook] ${reason}_created missing user_id`);
    return;
  }

  await prisma.user.updateMany({
    where: { whopUserId: data.user_id },
    data: { plan: DEFAULT_PLAN, whopMembershipId: null },
  });

  console.log(`[Webhook] User ${data.user_id} downgraded to free (${reason})`);
}
