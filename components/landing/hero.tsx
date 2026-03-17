import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[var(--accent)]/[0.04] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] mb-8">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Built with Next.js + Whop
        </div>

        <h1 className="animate-slide-up text-3xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl leading-[1.1]">
          Build your SaaS{" "}
          <span className="text-[var(--muted)]">
            in minutes, not months
          </span>
        </h1>

        <p className="animate-slide-up delay-100 mx-auto mt-5 max-w-lg text-base text-[var(--muted)] leading-relaxed">
          Authentication, payments, and subscriptions -all wired up. Just add your product.
        </p>

        <div className="animate-slide-up delay-200 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/pricing"
            className="group w-full rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80 sm:w-auto"
          >
            Start Building
            <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </Link>
          <Link
            href="/docs"
            prefetch={false}
            className="w-full rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hover:border-[var(--muted)]/40 sm:w-auto"
          >
            View Docs
          </Link>
        </div>

        {/* TODO: Replace this placeholder with a screenshot or demo of your product */}
        <div className="animate-scale-in delay-400 mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl shadow-black/[0.03] dark:shadow-none">
          <div className="border-b border-[var(--border)] px-4 py-2.5 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--border)]" />
          </div>
          <div className="flex h-48 items-center justify-center sm:h-72">
            <div className="text-center px-6">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface)]">
                <svg className="h-5 w-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </div>
              <p className="text-xs text-[var(--muted)]">Replace with a screenshot of your product</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
