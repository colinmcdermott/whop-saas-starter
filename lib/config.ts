// ---------------------------------------------------------------------------
// DB-backed configuration system
// ---------------------------------------------------------------------------
// Priority: in-memory cache → env var → SystemConfig table.
// Follows the same pattern as getSecret() in auth.ts.
// ---------------------------------------------------------------------------

import { cache as reactCache } from "react";
import { prisma } from "@/db";
import {
  PLAN_METADATA,
  PLAN_KEYS,
  DEFAULT_PLAN,
  getPlanBillingIntervals,
  planConfigKey,
  planConfigKeyYearly,
  planEnvVar,
  planEnvVarYearly,
  type PlanKey,
  type BillingInterval,
} from "./constants";

// In-memory cache (per-process, survives across requests within same cold start)
const cache = new Map<string, string>();

// ---------------------------------------------------------------------------
// Dynamic plan config key → env var mappings
// ---------------------------------------------------------------------------

const planEnvEntries: Record<string, string> = {};
for (const key of PLAN_KEYS) {
  planEnvEntries[planConfigKey(key)] = planEnvVar(key);
  if (getPlanBillingIntervals(key).includes("yearly")) {
    planEnvEntries[planConfigKeyYearly(key)] = planEnvVarYearly(key);
  }
}

/** Map of our config keys to their env var fallbacks */
const ENV_MAP: Record<string, string> = {
  whop_app_id: "NEXT_PUBLIC_WHOP_APP_ID",
  whop_api_key: "WHOP_API_KEY",
  whop_webhook_secret: "WHOP_WEBHOOK_SECRET",
  ...planEnvEntries,
  whop_pro_product_id: "WHOP_PRO_PRODUCT_ID",
  whop_enterprise_product_id: "WHOP_ENTERPRISE_PRODUCT_ID",
  app_name: "NEXT_PUBLIC_APP_NAME",
  app_url: "NEXT_PUBLIC_APP_URL",
  accent_color: "NEXT_PUBLIC_ACCENT_COLOR",
  analytics_provider: "ANALYTICS_PROVIDER",
  analytics_id: "ANALYTICS_ID",
  email_provider: "EMAIL_PROVIDER",
  email_api_key: "EMAIL_API_KEY",
};

/** Non-sensitive keys that can be returned to the client */
const PUBLIC_KEYS = new Set([
  "whop_app_id",
  ...PLAN_KEYS.flatMap((key) => {
    const keys = [planConfigKey(key)];
    if (getPlanBillingIntervals(key).includes("yearly")) {
      keys.push(planConfigKeyYearly(key));
    }
    return keys;
  }),
  "app_name",
  "app_url",
  "accent_color",
  "setup_complete",
]);

/** All valid config keys */
const VALID_KEYS = new Set([...Object.keys(ENV_MAP), "setup_complete"]);

// ---------------------------------------------------------------------------
// Core read/write
// ---------------------------------------------------------------------------

export async function getConfig(key: string): Promise<string | null> {
  // 1. In-memory cache
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  // 2. Env var fallback
  const envKey = ENV_MAP[key];
  if (envKey) {
    const envVal = process.env[envKey];
    if (envVal) {
      cache.set(key, envVal);
      return envVal;
    }
  }

  // 3. Database
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    if (row) {
      cache.set(key, row.value);
      return row.value;
    }
  } catch {
    // DB might not be ready yet (e.g. during first build)
  }

  return null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  if (!VALID_KEYS.has(key)) throw new Error(`Invalid config key: ${key}`);

  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  cache.set(key, value);
}

/** Bulk set config values */
export async function setConfigs(configs: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(configs)) {
    if (value) await setConfig(key, value);
  }
}

/** Get setup status for each config key (true = configured, false = missing) */
export async function getSetupStatus(): Promise<{
  setupComplete: boolean;
  configured: Record<string, boolean>;
  values: Record<string, string>;
}> {
  const configured: Record<string, boolean> = {};
  const values: Record<string, string> = {};

  for (const key of VALID_KEYS) {
    const val = await getConfig(key);
    configured[key] = !!val;
    // Only expose non-sensitive values
    if (val && PUBLIC_KEYS.has(key)) {
      values[key] = val;
    }
  }

  return {
    setupComplete: configured["setup_complete"] ?? false,
    configured,
    values,
  };
}

// ---------------------------------------------------------------------------
// Setup detection
// ---------------------------------------------------------------------------

export const isSetupComplete = reactCache(async (): Promise<boolean> => {
  const val = await getConfig("setup_complete");
  if (val === "true") return true;

  // Also consider setup complete if whop_app_id is configured via env var
  // (power user who set everything via env vars, no wizard needed)
  const appId = await getConfig("whop_app_id");
  return !!appId;
});

// ---------------------------------------------------------------------------
// Plan config
// ---------------------------------------------------------------------------

export interface PlanConfig {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  whopPlanId: string;
  whopPlanIdYearly: string;
  features: readonly string[];
  highlighted: boolean;
  trialDays?: number;
  billingIntervals: BillingInterval[];
}

export type PlansConfig = Record<PlanKey, PlanConfig>;

/** Build full plan config by merging static metadata with dynamic plan IDs from DB/env.
 *  Wrapped in React.cache() for per-request deduplication across the component tree. */
export const getPlansConfig = reactCache(async (): Promise<PlansConfig> => {
  const entries = await Promise.all(
    PLAN_KEYS.map(async (key) => {
      const intervals = getPlanBillingIntervals(key);
      const [monthlyId, yearlyId] = await Promise.all([
        getConfig(planConfigKey(key)),
        intervals.includes("yearly")
          ? getConfig(planConfigKeyYearly(key))
          : Promise.resolve(null),
      ]);
      return [
        key,
        {
          ...PLAN_METADATA[key],
          billingIntervals: intervals,
          whopPlanId: monthlyId ?? "",
          whopPlanIdYearly: yearlyId ?? monthlyId ?? "",
        },
      ] as const;
    })
  );
  return Object.fromEntries(entries) as unknown as PlansConfig;
});

/** Get the Whop plan ID for a given plan and billing interval */
export async function getWhopPlanIdFromConfig(
  key: PlanKey,
  interval: BillingInterval
): Promise<string> {
  const plans = await getPlansConfig();
  const plan = plans[key];
  return interval === "yearly" ? plan.whopPlanIdYearly : plan.whopPlanId;
}

/** Map a Whop plan ID back to a plan key */
export async function getPlanKeyFromWhopId(whopPlanId: string): Promise<PlanKey> {
  const plans = await getPlansConfig();
  for (const [key, plan] of Object.entries(plans)) {
    if (plan.whopPlanId === whopPlanId || plan.whopPlanIdYearly === whopPlanId) {
      return key as PlanKey;
    }
  }
  return DEFAULT_PLAN;
}

/** Clear the in-memory cache (useful after setup saves new values) */
export function clearConfigCache(): void {
  cache.clear();
}
