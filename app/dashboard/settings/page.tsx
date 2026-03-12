import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { PLANS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Settings - SaaS Starter",
};

export default async function SettingsPage() {
  const session = await requireSession();
  const planConfig = PLANS[session.plan as keyof typeof PLANS] ?? PLANS.free;

  // Fetch full user data from DB for the created date
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { createdAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-[var(--muted)]">Manage your account settings.</p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4 space-y-4">
          <Field label="Name" value={session.name ?? "—"} />
          <Field label="Email" value={session.email ?? "—"} />
          <Field
            label="Member since"
            value={user ? formatDate(user.createdAt) : "—"}
          />
        </div>
      </section>

      {/* Subscription */}
      <section className="rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold">Subscription</h2>
        <div className="mt-4 space-y-4">
          <Field label="Current plan" value={planConfig.name} />
          <Field
            label="Features"
            value={planConfig.features.slice(0, 3).join(", ")}
          />
        </div>

        <div className="mt-6 flex gap-3">
          {session.plan === "free" ? (
            <Link
              href="/pricing"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
            >
              Upgrade Plan
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--card-border)] transition-colors"
            >
              Change Plan
            </Link>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-200 dark:border-red-900/50 p-6">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Permanently delete your account and all associated data.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 opacity-50 cursor-not-allowed"
        >
          Delete Account (coming soon)
        </button>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
