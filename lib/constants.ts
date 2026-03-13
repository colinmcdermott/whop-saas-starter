// ---------------------------------------------------------------------------
// App configuration — edit these to customize your SaaS
// ---------------------------------------------------------------------------

/** Your app's name — shown in the header, sidebar, login page, and metadata */
export const APP_NAME = "SaaS Starter";

/** Your app's description — used in metadata and the landing page */
export const APP_DESCRIPTION =
  "A modern SaaS starter built with Next.js and Whop";

/** External links — update these before launching */
export const LINKS = {
  github: "https://github.com/colinmcdermott/whop-saas-starter",
  terms: "/terms", // TODO: Add your terms of service page
  privacy: "/privacy", // TODO: Add your privacy policy page
} as const;

// ---------------------------------------------------------------------------
// Plan configuration
// ---------------------------------------------------------------------------

export type BillingInterval = "monthly" | "yearly";

/** Plan configuration for your SaaS */
export const PLANS = {
  free: {
    name: "Free",
    description: "Get started with the basics",
    priceMonthly: 0,
    priceYearly: 0,
    whopPlanId: process.env.NEXT_PUBLIC_WHOP_FREE_PLAN_ID ?? "",
    whopPlanIdYearly: process.env.NEXT_PUBLIC_WHOP_FREE_PLAN_ID ?? "",
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1 GB storage",
    ],
    highlighted: false,
  },
  pro: {
    name: "Pro",
    description: "For growing teams and businesses",
    priceMonthly: 29,
    priceYearly: 290, // ~$24/mo — save ~17%
    whopPlanId: process.env.NEXT_PUBLIC_WHOP_PRO_PLAN_ID ?? "",
    whopPlanIdYearly: process.env.NEXT_PUBLIC_WHOP_PRO_PLAN_ID_YEARLY ?? "",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "100 GB storage",
      "Custom integrations",
      "Team collaboration",
    ],
    highlighted: true,
  },
  enterprise: {
    name: "Enterprise",
    description: "For large-scale operations",
    priceMonthly: 99,
    priceYearly: 990, // ~$82.50/mo — save ~17%
    whopPlanId: process.env.NEXT_PUBLIC_WHOP_ENTERPRISE_PLAN_ID ?? "",
    whopPlanIdYearly: process.env.NEXT_PUBLIC_WHOP_ENTERPRISE_PLAN_ID_YEARLY ?? "",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Dedicated support",
      "Custom SLA",
      "SSO & advanced security",
      "Audit logs",
      "API access",
    ],
    highlighted: false,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/** Get the Whop plan ID for a given plan and billing interval */
export function getWhopPlanId(key: PlanKey, interval: BillingInterval): string {
  const plan = PLANS[key];
  return interval === "yearly" ? plan.whopPlanIdYearly : plan.whopPlanId;
}

/** Map Whop plan IDs to our plan keys */
export function getPlanFromWhopPlanId(whopPlanId: string): PlanKey {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.whopPlanId === whopPlanId || plan.whopPlanIdYearly === whopPlanId) {
      return key as PlanKey;
    }
  }
  return "free";
}
