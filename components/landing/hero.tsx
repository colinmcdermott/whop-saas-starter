import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
      <div className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] mb-8">
        Built with Next.js + Whop
      </div>

      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
        Build your SaaS
        <br />
        <span className="text-[var(--accent)]">in minutes, not months</span>
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
        Authentication, payments, and subscriptions — all wired up and ready to
        go. Just add your product.
      </p>

      <div className="mt-10 flex items-center justify-center gap-4">
        <Link
          href="/api/auth/login?next=/dashboard"
          className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
        >
          Get Started Free
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium hover:bg-[var(--card-border)] transition-colors"
        >
          View Pricing
        </Link>
      </div>

      {/* Placeholder for a product screenshot or demo */}
      <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex h-64 items-center justify-center text-[var(--muted)] sm:h-96">
          <div className="text-center">
            <div className="text-4xl mb-3">&#9678;</div>
            <p className="text-sm">Replace this with a screenshot of your product</p>
          </div>
        </div>
      </div>
    </section>
  );
}
