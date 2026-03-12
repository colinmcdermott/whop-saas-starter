import Link from "next/link";

export function UpgradeBanner() {
  return (
    <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-6">
      <h3 className="font-semibold">Upgrade to Pro</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Get unlimited projects, advanced analytics, and priority support.
      </p>
      <Link
        href="/pricing"
        className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
      >
        View Plans
      </Link>
    </div>
  );
}
