import Link from "next/link";

export function CTA() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center sm:px-16">
          {/* Subtle accent glow */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-[var(--accent)]/[0.04] blur-[100px]" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Ready to start building?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted)] leading-relaxed">
            Get auth, payments, and subscriptions out of the box. Launch your
            SaaS in minutes, not months.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pricing"
              prefetch={false}
              className="group w-full rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80 sm:w-auto"
            >
              Get Started
              <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
            <Link
              href="/docs"
              prefetch={false}
              className="w-full rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hover:border-[var(--muted)]/40 sm:w-auto"
            >
              View Docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
