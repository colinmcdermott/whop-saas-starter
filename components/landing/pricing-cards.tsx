"use client";

import { PLANS, type PlanKey } from "@/lib/constants";

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[var(--foreground)] shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export function PricingCards() {
  const planKeys = Object.keys(PLANS) as PlanKey[];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <div className="mx-auto grid max-w-4xl gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] lg:grid-cols-3">
      {planKeys.map((key) => {
        const plan = PLANS[key];
        const highlighted = plan.highlighted;
        const whopPlanId = "whopPlanId" in plan ? plan.whopPlanId : null;

        return (
          <div
            key={key}
            className={`relative flex flex-col p-6 ${
              highlighted
                ? "bg-[var(--surface)]"
                : "bg-[var(--card)]"
            }`}
          >
            {highlighted && (
              <div className="absolute top-0 left-0 right-0 h-px bg-[var(--accent)]" />
            )}

            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{plan.name}</h3>
              {highlighted && (
                <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                  Popular
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">{plan.description}</p>

            <div className="mt-4">
              <span className="text-3xl font-semibold tracking-tight">
                ${plan.priceMonthly}
              </span>
              {plan.priceMonthly > 0 && (
                <span className="text-xs text-[var(--muted)] ml-0.5">/mo</span>
              )}
            </div>

            <div className="mt-5">
              {whopPlanId ? (
                <div
                  data-whop-checkout-plan-id={whopPlanId}
                  data-whop-checkout-return-url={`${appUrl}/checkout/success?plan=${key}`}
                  data-whop-color-scheme="system"
                  className={`cursor-pointer rounded-lg py-2 text-center text-sm font-medium transition-opacity hover:opacity-80 ${
                    key === "free"
                      ? "border border-[var(--border)] bg-[var(--card)]"
                      : "bg-[var(--foreground)] text-[var(--background)]"
                  }`}
                >
                  {key === "free" ? "Get Started" : "Subscribe"}
                </div>
              ) : (
                <span className="block w-full rounded-lg border border-[var(--border)] py-2 text-center text-xs text-[var(--muted)]">
                  Configure plan ID
                </span>
              )}
            </div>

            <ul className="mt-5 flex flex-col gap-2 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
