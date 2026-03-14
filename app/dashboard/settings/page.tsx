import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getPlansConfig, getConfig } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { DeleteAccountButton } from "@/components/dashboard/delete-account-button";
import { AccentColorPicker } from "@/components/dashboard/accent-color-picker";
import { IntegrationsSettings } from "@/components/dashboard/integrations-settings";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await requireSession();
  const plans = await getPlansConfig();
  const planConfig = plans[session.plan as keyof typeof plans] ?? plans.free;

  const [user, accentColor] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { createdAt: true },
    }),
    getConfig("accent_color"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">Manage your account.</p>
      </div>

      {/* Profile */}
      <section className="animate-slide-up delay-100 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="mt-4 space-y-3">
          <Field label="Name" value={session.name ?? "\u2014"} />
          <Field label="Email" value={session.email ?? "\u2014"} />
          <Field
            label="Member since"
            value={user ? formatDate(user.createdAt) : "\u2014"}
          />
        </div>
      </section>

      {/* Subscription */}
      <section className="animate-slide-up delay-200 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold">Subscription</h2>
        <div className="mt-4 space-y-3">
          <Field label="Current plan" value={planConfig.name} />
          <Field
            label="Features"
            value={planConfig.features.slice(0, 3).join(", ")}
          />
        </div>

        <div className="mt-5">
          {session.plan === "free" ? (
            <Link
              href="/pricing"
              className="rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
            >
              Upgrade Plan
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="rounded-lg border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface)]"
            >
              Change Plan
            </Link>
          )}
        </div>
      </section>

      {/* Branding (admin only) */}
      {session.isAdmin && (
        <section className="animate-slide-up delay-300 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold">Branding</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Customize the accent color used across your app.
          </p>
          <div className="mt-4">
            <AccentColorPicker currentColor={accentColor} />
          </div>
        </section>
      )}

      {/* Integrations (admin only) */}
      {session.isAdmin && (
        <section className="animate-slide-up delay-400 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold">Integrations</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Connect analytics, error tracking, and email services.
          </p>
          <div className="mt-4">
            <IntegrationsSettings />
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section className="animate-slide-up delay-500 rounded-xl border border-red-200 dark:border-red-900/30 bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Permanently delete your account and all associated data.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
