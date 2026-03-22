import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { getPlansConfig } from "@/lib/config";
import { DEFAULT_PLAN, type PlanKey } from "@/lib/constants";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";
import { ReactivateBanner } from "@/components/dashboard/reactivate-banner";
import {
  ActivityFeed,
  ActivityFeedSkeleton,
} from "@/components/dashboard/activity-feed";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  // requireSession() is also called in the layout — React.cache() deduplicates
  // the JWT verification, so there is no extra cost. This is the idiomatic
  // App Router pattern since layouts cannot pass props to pages.
  const session = await requireSession();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Welcome — renders immediately (session already available from layout) */}
      <div className="animate-slide-up">
        <h1 className="text-lg font-semibold tracking-tight">
          Welcome back{session.name ? `, ${session.name}` : ""}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Here&apos;s an overview of your account.
        </p>
      </div>

      {/* Stats stream in while welcome text paints immediately */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection plan={session.plan} />
      </Suspense>

      {/* Reactivate banner for users with pending cancellation */}
      {session.cancelAtPeriodEnd && session.plan !== DEFAULT_PLAN && (
        <div className="animate-slide-up delay-200">
          <ReactivateBanner />
        </div>
      )}

      {/* Upgrade banner for free users */}
      {session.plan === DEFAULT_PLAN && (
        <div className="animate-slide-up delay-200">
          <UpgradeBanner />
        </div>
      )}

      {/* Activity feed — replace placeholder data with real events from your DB */}
      <Suspense fallback={<ActivityFeedSkeleton />}>
        <div className="animate-slide-up delay-300">
          <ActivityFeed />
        </div>
      </Suspense>

      {/* Replace these onboarding steps with your product's setup flow */}
      <div className="animate-slide-up delay-400 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
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

async function StatsSection({ plan }: { plan: PlanKey }) {
  const plans = await getPlansConfig();
  const planConfig = plans[plan] ?? plans[DEFAULT_PLAN];

  return (
    <div className="animate-slide-up delay-100 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
      <StatCard label="Current Plan" value={planConfig.name} />
      <StatCard label="Projects" value="0 / 3" />
      <StatCard label="Storage" value="0 GB" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[var(--card)] p-5">
          <div className="h-3 w-20 rounded bg-[var(--surface)] animate-pulse" />
          <div className="mt-2 h-6 w-12 rounded bg-[var(--surface)] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--card)] p-5">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</p>
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
