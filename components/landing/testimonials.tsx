const testimonials = [
  {
    quote:
      "This saved us weeks of setup. Auth, payments, and subscriptions just worked out of the box.",
    name: "Alex Rivera",
    role: "Founder, Streamline",
  },
  {
    quote:
      "We went from idea to paying customers in a weekend. The Whop integration is seamless.",
    name: "Priya Sharma",
    role: "CTO, Launchpad Labs",
  },
  {
    quote:
      "Clean code, sensible defaults, and easy to extend. Exactly what a SaaS starter should be.",
    name: "Marcus Chen",
    role: "Full-Stack Developer",
  },
];

export function Testimonials() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Loved by builders
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            See what developers and founders are saying.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-[var(--foreground)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs font-semibold text-[var(--accent)]">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-[var(--muted)]">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
