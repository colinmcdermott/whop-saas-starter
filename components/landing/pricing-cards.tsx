"use client";

import { PLANS, type PlanKey } from "@/lib/constants";

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-[var(--accent)] shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export function PricingCards() {
  const planKeys = Object.keys(PLANS) as PlanKey[];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
      {planKeys.map((key) => {
        const plan = PLANS[key];
        const highlighted = plan.highlighted;
        const whopPlanId = "whopPlanId" in plan ? plan.whopPlanId : null;

        return (
          <div
            key={key}
            className={`relative flex flex-col rounded-xl border p-8 ${
              highlighted
                ? "border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10"
                : "border-[var(--border)]"
            }`}
          >
            {highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-0.5 text-xs font-medium text-[var(--accent-foreground)]">
                Most Popular
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{plan.description}</p>
            </div>

            <div className="mt-6">
              <span className="text-4xl font-bold">
                ${plan.priceMonthly}
              </span>
              {plan.priceMonthly > 0 && (
                <span className="text-sm text-[var(--muted)]">/month</span>
              )}
            </div>

            <ul className="mt-8 flex flex-col gap-3 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {key === "free" ? (
                <a
                  href="/api/auth/login?next=/dashboard"
                  className="block w-full rounded-lg border border-[var(--border)] py-2.5 text-center text-sm font-medium hover:bg-[var(--card-border)] transition-colors"
                >
                  Get Started Free
                </a>
              ) : whopPlanId ? (
                /* Whop embedded checkout — the loader script detects this data attribute
                   and attaches click-to-checkout behavior automatically */
                <div
                  data-whop-checkout-plan-id={whopPlanId}
                  data-whop-checkout-return-url={`${appUrl}/checkout/success?plan=${key}`}
                  className={`cursor-pointer rounded-lg py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                    highlighted
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "bg-[var(--foreground)] text-[var(--background)]"
                  }`}
                >
                  Subscribe
                </div>
              ) : (
                <span className="block w-full rounded-lg border border-[var(--border)] py-2.5 text-center text-sm text-[var(--muted)]">
                  Configure plan ID
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
