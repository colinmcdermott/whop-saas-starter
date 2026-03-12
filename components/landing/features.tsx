const features = [
  {
    icon: "🔐",
    title: "Authentication",
    description:
      "Sign in with Whop using OAuth 2.1 + PKCE. Secure, standards-based, and ready to go.",
  },
  {
    icon: "💳",
    title: "Payments",
    description:
      "Accept payments through Whop. Subscriptions, one-time payments, and free tiers built in.",
  },
  {
    icon: "📊",
    title: "Dashboard",
    description:
      "A clean, responsive dashboard for your users. Protected routes and role-based access.",
  },
  {
    icon: "🚀",
    title: "Deploy Anywhere",
    description:
      "Optimized for Vercel. One-click deploy, automatic previews, and edge functions.",
  },
  {
    icon: "🗄️",
    title: "Database",
    description:
      "PostgreSQL with Prisma ORM. Type-safe queries, migrations, and a visual studio.",
  },
  {
    icon: "🔔",
    title: "Webhooks",
    description:
      "Subscription lifecycle handled automatically. Upgrades, downgrades, and cancellations.",
  },
];

export function Features() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to launch
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            Stop rebuilding the same infrastructure. Start building your product.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--card-border)] p-6 transition-colors hover:border-[var(--border)]"
            >
              <div className="text-2xl">{feature.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
