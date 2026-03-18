// ---------------------------------------------------------------------------
// Subscription query helpers
// ---------------------------------------------------------------------------
// Centralized, typed helpers for subscription/membership DB operations.
// Mirrors the pattern from michaelshimeles/nextjs-starter-kit.
//
// Read helpers return typed results; write helpers encapsulate webhook logic.
// Auth-related queries (OAuth upsert, admin promotion, session secret) and
// SystemConfig queries stay in their respective files (auth.ts, config.ts).
// ---------------------------------------------------------------------------

import { prisma } from "@/db";
import { DEFAULT_PLAN, PLAN_KEYS, type PlanKey } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubscriptionStatus = "active" | "canceling" | "free";

export interface SubscriptionDetails {
  plan: PlanKey;
  whopMembershipId: string | null;
  cancelAtPeriodEnd: boolean;
  status: SubscriptionStatus;
}

export interface SubscriptionDetailsResult {
  hasSubscription: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Get the full subscription details for a user.
 * Returns a typed result with `hasSubscription` discriminator.
 *
 * @example
 * const result = await getSubscriptionDetails(session.userId);
 * if (result.hasSubscription) {
 *   console.log(result.subscription.plan);
 * }
 */
export async function getSubscriptionDetails(
  userId: string,
): Promise<SubscriptionDetailsResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        whopMembershipId: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!user) {
      return { hasSubscription: false, error: "User not found" };
    }

    const plan = PLAN_KEYS.includes(user.plan as PlanKey)
      ? (user.plan as PlanKey)
      : DEFAULT_PLAN;
    const isPaid = plan !== DEFAULT_PLAN;

    if (!isPaid) {
      return { hasSubscription: false };
    }

    return {
      hasSubscription: true,
      subscription: {
        plan,
        whopMembershipId: user.whopMembershipId,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        status: user.cancelAtPeriodEnd ? "canceling" : "active",
      },
    };
  } catch (error) {
    console.error("[Subscription] Failed to get details:", error);
    return { hasSubscription: false, error: "Database error" };
  }
}

/**
 * Check if a user has an active paid subscription.
 */
export async function isUserSubscribed(userId: string): Promise<boolean> {
  const result = await getSubscriptionDetails(userId);
  return result.hasSubscription && result.subscription?.status === "active";
}

/**
 * Get the subscription status for a user.
 */
export async function getUserSubscriptionStatus(
  userId: string,
): Promise<SubscriptionStatus> {
  const result = await getSubscriptionDetails(userId);
  if (!result.hasSubscription) return "free";
  return result.subscription!.status;
}

/**
 * Get a user's account creation date (for profile display).
 */
export async function getUserCreatedAt(
  userId: string,
): Promise<Date | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  return user?.createdAt ?? null;
}

// ---------------------------------------------------------------------------
// Write helpers (called from webhooks and API routes)
// ---------------------------------------------------------------------------

/**
 * Activate a membership (called on membership_activated webhook).
 * Upserts the user — creates if they don't exist yet (webhook can arrive
 * before OAuth callback).
 */
export async function activateMembership(
  whopUserId: string,
  plan: PlanKey,
  membershipId: string | null,
): Promise<void> {
  await prisma.user.upsert({
    where: { whopUserId },
    update: {
      plan,
      whopMembershipId: membershipId,
      cancelAtPeriodEnd: false,
    },
    create: {
      whopUserId,
      plan,
      whopMembershipId: membershipId,
    },
  });
}

/**
 * Deactivate a membership (called on membership_deactivated, refund, dispute).
 * Resets user to free plan and clears membership ID.
 */
export async function deactivateMembership(whopUserId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { whopUserId },
    data: {
      plan: DEFAULT_PLAN,
      whopMembershipId: null,
      cancelAtPeriodEnd: false,
    },
  });
}

/**
 * Update the cancel-at-period-end flag (called on
 * membership_cancel_at_period_end_changed webhook).
 */
export async function updateCancelAtPeriodEnd(
  whopUserId: string,
  cancelAtPeriodEnd: boolean,
): Promise<void> {
  await prisma.user.updateMany({
    where: { whopUserId },
    data: { cancelAtPeriodEnd },
  });
}

/**
 * Reverse a pending cancellation (called from /api/billing/uncancel).
 * Only updates the local DB — the caller is responsible for calling the
 * Whop API first.
 */
export async function uncancelSubscription(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { cancelAtPeriodEnd: false },
  });
}

/**
 * Get a user's email and name by Whop user ID (for sending notifications).
 */
export async function getUserForNotification(
  whopUserId: string,
): Promise<{ email: string; name: string | null } | null> {
  const user = await prisma.user.findUnique({
    where: { whopUserId },
    select: { email: true, name: true },
  });
  if (!user?.email) return null;
  return { email: user.email, name: user.name };
}
