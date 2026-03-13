import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { getPlansConfig } from "@/lib/config";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const plans = await getPlansConfig();
  const planConfig = plans[session.plan as keyof typeof plans] ?? plans.free;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Welcome */}
      <div className="animate-slide-up">
        <h1 className="text-lg font-semibold tracking-tight">
          Welcome back{session.name ? `, ${session.name}` : ""}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Here&apos;s an overview of your account.
        </p>
      </div>

      {/* TODO: Replace these placeholder stats with your product's metrics */}
      <div className="animate-slide-up delay-100 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        <StatCard label="Current Plan" value={planConfig.name} />
        <StatCard label="Projects" value="0 / 3" />
        <StatCard label="Storage" value="0 GB" />
      </div>

      {/* Upgrade banner for free users */}
      {session.plan === "free" && (
        <div className="animate-slide-up delay-200">
          <UpgradeBanner />
        </div>
      )}

      {/* TODO: Replace these onboarding steps with your product's setup flow */}
      <div className="animate-slide-up delay-300 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-sm font-semibold">Get started</h2>
        <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
          Replace this with your product. Auth, payments, and webhooks are ready.
        </p>

        <div className="mt-5 space-y-2.5">
          <Step number={1} title="Customize this dashboard" done={false} />
          <Step number={2} title="Set up your Whop plans" done={false} />
          <Step number={3} title="Configure webhook endpoint" done={false} />
          <Step number={4} title="Deploy to Vercel" done={false} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--card)] p-5">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Step({
  number,
  title,
  done,
}: {
  number: number;
  title: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-medium ${
          done
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-[var(--surface)] text-[var(--muted)]"
        }`}
      >
        {done ? "\u2713" : number}
      </div>
      <span className={`text-sm ${done ? "line-through text-[var(--muted)]" : ""}`}>
        {title}
      </span>
    </div>
  );
}
