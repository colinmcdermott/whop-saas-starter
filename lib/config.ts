// ---------------------------------------------------------------------------
// DB-backed configuration system
// ---------------------------------------------------------------------------
// Priority: in-memory cache → env var → SystemConfig table.
// Follows the same pattern as getSecret() in auth.ts.
// ---------------------------------------------------------------------------

import { prisma } from "./db";

// In-memory cache (per-process, survives across requests within same cold start)
const cache = new Map<string, string>();

/** Map of our config keys to their env var fallbacks */
const ENV_MAP: Record<string, string> = {
  whop_app_id: "NEXT_PUBLIC_WHOP_APP_ID",
  whop_api_key: "WHOP_API_KEY",
  whop_webhook_secret: "WHOP_WEBHOOK_SECRET",
  whop_free_plan_id: "NEXT_PUBLIC_WHOP_FREE_PLAN_ID",
  whop_pro_plan_id: "NEXT_PUBLIC_WHOP_PRO_PLAN_ID",
  whop_pro_plan_id_yearly: "NEXT_PUBLIC_WHOP_PRO_PLAN_ID_YEARLY",
  whop_enterprise_plan_id: "NEXT_PUBLIC_WHOP_ENTERPRISE_PLAN_ID",
  whop_enterprise_plan_id_yearly: "NEXT_PUBLIC_WHOP_ENTERPRISE_PLAN_ID_YEARLY",
  whop_pro_product_id: "WHOP_PRO_PRODUCT_ID",
  whop_enterprise_product_id: "WHOP_ENTERPRISE_PRODUCT_ID",
  app_name: "NEXT_PUBLIC_APP_NAME",
  app_url: "NEXT_PUBLIC_APP_URL",
  accent_color: "NEXT_PUBLIC_ACCENT_COLOR",
  analytics_provider: "ANALYTICS_PROVIDER",
  analytics_id: "ANALYTICS_ID",
  error_tracking_dsn: "ERROR_TRACKING_DSN",
  email_provider: "EMAIL_PROVIDER",
  email_api_key: "EMAIL_API_KEY",
};

/** Non-sensitive keys that can be returned to the client */
const PUBLIC_KEYS = new Set([
  "whop_app_id",
  "whop_free_plan_id",
  "whop_pro_plan_id",
  "whop_pro_plan_id_yearly",
  "whop_enterprise_plan_id",
  "whop_enterprise_plan_id_yearly",
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

export async function isSetupComplete(): Promise<boolean> {
  const val = await getConfig("setup_complete");
  if (val === "true") return true;

  // Also consider setup complete if whop_app_id is configured via env var
  // (power user who set everything via env vars, no wizard needed)
  const appId = await getConfig("whop_app_id");
  return !!appId;
}

// ---------------------------------------------------------------------------
// Plan config
// ---------------------------------------------------------------------------

import { PLAN_METADATA, type PlanKey, type BillingInterval } from "./constants";

export interface PlanConfig {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  whopPlanId: string;
  whopPlanIdYearly: string;
  features: readonly string[];
  highlighted: boolean;
}

export type PlansConfig = Record<PlanKey, PlanConfig>;

/** Build full plan config by merging static metadata with dynamic plan IDs from DB/env */
export async function getPlansConfig(): Promise<PlansConfig> {
  const [freeId, proId, proYearlyId, entId, entYearlyId] = await Promise.all([
    getConfig("whop_free_plan_id"),
    getConfig("whop_pro_plan_id"),
    getConfig("whop_pro_plan_id_yearly"),
    getConfig("whop_enterprise_plan_id"),
    getConfig("whop_enterprise_plan_id_yearly"),
  ]);

  return {
    free: {
      ...PLAN_METADATA.free,
      whopPlanId: freeId ?? "",
      whopPlanIdYearly: freeId ?? "",
    },
    pro: {
      ...PLAN_METADATA.pro,
      whopPlanId: proId ?? "",
      whopPlanIdYearly: proYearlyId ?? "",
    },
    enterprise: {
      ...PLAN_METADATA.enterprise,
      whopPlanId: entId ?? "",
      whopPlanIdYearly: entYearlyId ?? "",
    },
  };
}

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
  return "free";
}

/** Clear the in-memory cache (useful after setup saves new values) */
export function clearConfigCache(): void {
  cache.clear();
}
