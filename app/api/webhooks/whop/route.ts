import { after, NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPlanKeyFromWhopId, getConfig } from "@/lib/config";
import { verifyWebhookSignature } from "@/lib/whop";

import { sendEmail } from "@/lib/email";
import { paymentFailedEmail } from "@/lib/email-templates";
import {
  activateMembership,
  deactivateMembership,
  updateCancelAtPeriodEnd,
  getUserForNotification,
} from "@/lib/subscription";

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
  cancel_at_period_end?: boolean;
}

/**
 * POST /api/webhooks/whop
 *
 * Handles Whop webhook events for subscription management.
 *
 * Events handled:
 * - membership_activated                     → Activate subscription (upgrade user plan)
 * - membership_deactivated                   → Deactivate subscription (downgrade to free)
 * - membership_cancel_at_period_end_changed  → Track pending cancellation
 * - payment_succeeded                        → Log successful payment
 * - payment_failed                           → Log failed payment, send email
 * - refund_created                           → Downgrade user on refund
 * - dispute_created                          → Downgrade user on chargeback
 *
 * Setup:
 * 1. In your Whop app settings, add a webhook endpoint pointing to:
 *    https://your-domain.com/api/webhooks/whop
 * 2. Copy the webhook secret to WHOP_WEBHOOK_SECRET in your .env.local
 *    or enter it during the setup wizard
 */
export async function POST(request: NextRequest) {
  // Guard against oversized payloads before processing
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > 1_000_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

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

  let event: WebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    console.error("[Webhook] Invalid JSON payload");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const eventType = event.type;
  console.log(`[Webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case "membership_activated": {
        const { user_id, plan_id, id } = event.data;
        if (!user_id) {
          console.error("[Webhook] membership_activated missing user_id");
          break;
        }
        if (!plan_id) {
          console.error("[Webhook] membership_activated missing plan_id");
          break;
        }
        const plan = await getPlanKeyFromWhopId(plan_id);
        await activateMembership(user_id, plan, id ?? null);
        console.log(`[Webhook] User ${user_id} upgraded to ${plan}`);
        break;
      }

      case "membership_deactivated": {
        const { user_id } = event.data;
        if (!user_id) {
          console.error("[Webhook] membership_deactivated missing user_id");
          break;
        }
        await deactivateMembership(user_id);
        console.log(`[Webhook] User ${user_id} downgraded to free`);
        break;
      }

      case "membership_cancel_at_period_end_changed": {
        const { user_id, cancel_at_period_end } = event.data;
        if (!user_id) {
          console.error("[Webhook] membership_cancel_at_period_end_changed missing user_id");
          break;
        }
        const value = cancel_at_period_end ?? false;
        await updateCancelAtPeriodEnd(user_id, value);
        console.log(`[Webhook] User ${user_id} cancel_at_period_end → ${value}`);
        break;
      }

      case "payment_succeeded": {
        console.log("[Webhook] Payment succeeded:", event.data);
        break;
      }

      case "payment_failed": {
        console.log("[Webhook] Payment failed:", event.data);
        const failedUserId = event.data.user_id;
        if (failedUserId) {
          after(async () => {
            const user = await getUserForNotification(failedUserId);
            if (user) {
              const email = paymentFailedEmail(user.name);
              await sendEmail({ to: user.email, ...email }).catch((err) =>
                console.error("[Email] Payment failed email error:", err)
              );
            }
          });
        }
        break;
      }

      case "refund_created": {
        const { user_id } = event.data;
        if (!user_id) {
          console.error("[Webhook] refund_created missing user_id");
          break;
        }
        await deactivateMembership(user_id);
        console.log(`[Webhook] User ${user_id} downgraded to free (refund)`);
        break;
      }

      case "dispute_created": {
        const { user_id } = event.data;
        if (!user_id) {
          console.error("[Webhook] dispute_created missing user_id");
          break;
        }
        await deactivateMembership(user_id);
        console.log(`[Webhook] User ${user_id} downgraded to free (dispute)`);
        break;
      }

      default: {
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // Return 500 so Whop retries the webhook — the event was authenticated
    // but processing failed (likely a DB error). Returning 200 here would
    // silently lose payment events.
    console.error(`[Webhook] Error processing ${eventType}:`, err);
    return NextResponse.json(
      { error: "processing_failed" },
      { status: 500 },
    );
  }
}
