import { redirect } from "next/navigation";
import { getConfig } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { PLAN_KEYS, planConfigKey, planConfigKeyYearly, planNameConfigKey } from "@/lib/constants";
import { SetupWizard } from "@/components/setup/setup-wizard";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  // Only redirect away from setup when it's explicitly marked complete.
  // Don't use isSetupComplete() here — it returns true as soon as whop_app_id
  // exists, which would kick users out mid-wizard (e.g. after the OAuth step).
  const setupComplete = await getConfig("setup_complete");
  if (setupComplete === "true") {
    redirect("/");
  }

  // Fetch session, search params, and existing config in parallel
  const [session, params, whopAppId, ...planConfigValues] = await Promise.all([
    getSession(),
    searchParams,
    getConfig("whop_app_id"),
    ...PLAN_KEYS.flatMap((key) => [
      getConfig(planConfigKey(key)),
      getConfig(planConfigKeyYearly(key)),
      getConfig(planNameConfigKey(key)),
    ]),
  ]);

  // Reconstruct plan IDs and names from flat array
  const initialPlanIds: Record<string, string> = {};
  const initialPlanNames: Record<string, string> = {};
  let idx = 0;
  for (const key of PLAN_KEYS) {
    const monthly = planConfigValues[idx++];
    const yearly = planConfigValues[idx++];
    const name = planConfigValues[idx++];
    if (monthly) initialPlanIds[planConfigKey(key)] = monthly;
    if (yearly) initialPlanIds[planConfigKeyYearly(key)] = yearly;
    if (name) initialPlanNames[planNameConfigKey(key)] = name;
  }

  const initialStep = params.step ? parseInt(params.step, 10) : undefined;

  return (
    <SetupWizard
      initialStep={initialStep}
      isSignedIn={!!session}
      isAdmin={session?.isAdmin ?? false}
      initialConfig={{
        whopAppId: whopAppId ?? "",
        planIds: initialPlanIds,
        planNames: initialPlanNames,
      }}
    />
  );
}
