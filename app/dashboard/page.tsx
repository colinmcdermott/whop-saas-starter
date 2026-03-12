import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { PLANS } from "@/lib/constants";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";

export const metadata: Metadata = {
  title: "Dashboard - SaaS Starter",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const planConfig = PLANS[session.plan as keyof typeof PLANS] ?? PLANS.free;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{session.name ? `, ${session.name}` : ""}
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Here&apos;s an overview of your account.
        </p>
      </div>

      {/* Plan info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current Plan" value={planConfig.name} />
        <StatCard label="Projects" value="0 / 3" />
        <StatCard label="Storage" value="0 GB" />
      </div>

      {/* Upgrade banner for free users */}
      {session.plan === "free" && <UpgradeBanner />}

      {/* Placeholder content */}
      <div className="rounded-xl border border-[var(--border)] p-8">
        <h2 className="text-lg font-semibold">Get started</h2>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          This is your dashboard. Replace this content with your actual product
          features. The authentication, subscription management, and webhook
          handling are all set up and ready to use.
        </p>

        <div className="mt-6 space-y-3">
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
    <div className="rounded-xl border border-[var(--border)] p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
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
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
          done
            ? "bg-green-500/10 text-green-600"
            : "bg-[var(--card-border)] text-[var(--muted)]"
        }`}
      >
        {done ? "✓" : number}
      </div>
      <span className={`text-sm ${done ? "line-through text-[var(--muted)]" : ""}`}>
        {title}
      </span>
    </div>
  );
}
