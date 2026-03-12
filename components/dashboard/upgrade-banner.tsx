import Link from "next/link";

export function UpgradeBanner() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Upgrade to Pro</h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Unlimited projects, advanced analytics, and priority support.
          </p>
        </div>
        <Link
          href="/pricing"
          className="shrink-0 rounded-lg bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] transition-opacity hover:opacity-80"
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}
