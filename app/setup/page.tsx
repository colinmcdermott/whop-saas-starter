import { redirect } from "next/navigation";
import { isSetupComplete, getConfig } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { PLAN_KEYS, planConfigKey, planConfigKeyYearly } from "@/lib/constants";
import { SetupWizard } from "@/components/setup/setup-wizard";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const setupDone = await isSetupComplete();
  if (setupDone) {
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
    ]),
  ]);

  // Reconstruct plan IDs from flat array
  const initialPlanIds: Record<string, string> = {};
  let idx = 0;
  for (const key of PLAN_KEYS) {
    const monthly = planConfigValues[idx++];
    const yearly = planConfigValues[idx++];
    if (monthly) initialPlanIds[planConfigKey(key)] = monthly;
    if (yearly) initialPlanIds[planConfigKeyYearly(key)] = yearly;
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
      }}
    />
  );
}
