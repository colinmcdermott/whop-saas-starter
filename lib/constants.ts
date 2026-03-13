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
// Plan types and static metadata
// ---------------------------------------------------------------------------

export type PlanKey = "free" | "pro" | "enterprise";
export type BillingInterval = "monthly" | "yearly";

/**
 * Static plan metadata — names, descriptions, prices, features.
 * Dynamic plan IDs come from the DB/env via lib/config.ts.
 */
export const PLAN_METADATA = {
  free: {
    name: "Free",
    description: "Get started with the basics",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1 GB storage",
    ] as readonly string[],
    highlighted: false,
  },
  pro: {
    name: "Pro",
    description: "For growing teams and businesses",
    priceMonthly: 29,
    priceYearly: 290, // ~$24/mo — save ~17%
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "100 GB storage",
      "Custom integrations",
      "Team collaboration",
    ] as readonly string[],
    highlighted: true,
  },
  enterprise: {
    name: "Enterprise",
    description: "For large-scale operations",
    priceMonthly: 99,
    priceYearly: 990, // ~$82.50/mo — save ~17%
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Dedicated support",
      "Custom SLA",
      "SSO & advanced security",
      "Audit logs",
      "API access",
    ] as readonly string[],
    highlighted: false,
  },
} as const;
