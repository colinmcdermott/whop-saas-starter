import { redirect } from "next/navigation";
import { isSetupComplete } from "@/lib/config";
import { getSession } from "@/lib/auth";
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

  const session = await getSession();
  const params = await searchParams;
  const initialStep = params.step ? parseInt(params.step, 10) : undefined;

  return (
    <SetupWizard
      initialStep={initialStep}
      isSignedIn={!!session}
      isAdmin={session?.isAdmin ?? false}
    />
  );
}
