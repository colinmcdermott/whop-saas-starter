"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlanKey, BillingInterval } from "@/lib/constants";
import type { PlansConfig } from "@/lib/config";

function CheckIcon({ accent }: { accent?: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${accent ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function BillingToggle({
  interval,
  onChange,
}: {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <span
        className={`text-sm font-medium transition-colors ${
          interval === "monthly" ? "text-[var(--foreground)]" : "text-[var(--muted)]"
        }`}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={interval === "yearly"}
        onClick={() => onChange(interval === "monthly" ? "yearly" : "monthly")}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-[var(--foreground)] transition-transform ${
            interval === "yearly" ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors ${
          interval === "yearly" ? "text-[var(--foreground)]" : "text-[var(--muted)]"
        }`}
      >
        Yearly
      </span>
      {interval === "yearly" && (
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          Save ~17%
        </span>
      )}
    </div>
  );
}

export function PricingCards({ plans }: { plans: PlansConfig }) {
  const [interval, setInterval] = useState<BillingInterval>("yearly");
  const planKeys = Object.keys(plans) as PlanKey[];

  return (
    <div>
      <BillingToggle interval={interval} onChange={setInterval} />

      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3">
        {planKeys.map((key) => {
          const plan = plans[key];
          const highlighted = plan.highlighted;
          const price = plan.priceMonthly;
          const yearlyTotal = plan.priceYearly;
          const monthlyEquivalent =
            yearlyTotal > 0
              ? Math.round((yearlyTotal / 12) * 100) / 100
              : 0;
          const displayPrice =
            interval === "yearly" ? monthlyEquivalent : price;
          const whopPlanId =
            interval === "yearly" ? plan.whopPlanIdYearly : plan.whopPlanId;

          // Pro first on mobile, Free last — keeps recommended plan above the fold
          const orderClass =
            key === "pro"
              ? "order-first lg:order-none"
              : key === "free"
                ? "order-last lg:order-none"
                : "";

          return (
            <div
              key={key}
              className={`relative flex flex-col rounded-xl border p-6 ${orderClass} ${
                highlighted
                  ? "border-[var(--accent)] bg-[var(--card)]"
                  : "border-[var(--border)] bg-[var(--card)]"
              }`}
              style={
                highlighted
                  ? {
                      boxShadow:
                        "0 2px 40px -12px color-mix(in srgb, var(--accent) 25%, transparent)",
                    }
                  : undefined
              }
            >
              {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-foreground)] whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-sm font-semibold">{plan.name}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">{plan.description}</p>

              <div className="mt-4">
                <span className="text-3xl font-semibold tracking-tight">
                  ${displayPrice}
                </span>
                {displayPrice > 0 && (
                  <span className="text-xs text-[var(--muted)] ml-0.5">
                    /mo
                  </span>
                )}
                {/* Fixed-height subtitle to prevent layout shift on toggle */}
                <p className="mt-0.5 h-4 text-[11px] text-[var(--muted)]">
                  {interval === "yearly" && yearlyTotal > 0
                    ? `$${yearlyTotal} billed annually`
                    : "\u00A0"}
                </p>
              </div>

              <div className="mt-5">
                {whopPlanId ? (
                  <Link
                    href={`/checkout?plan=${key}&interval=${interval}`}
                    className={`block rounded-lg py-2.5 text-center text-sm font-medium transition-all ${
                      highlighted
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90"
                        : key === "free"
                          ? "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface)]"
                          : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                    }`}
                  >
                    {key === "free" ? "Start Free" : highlighted ? "Get Started" : "Subscribe"}
                  </Link>
                ) : (
                  <span className="block w-full rounded-lg border border-[var(--border)] py-2.5 text-center text-xs text-[var(--muted)]">
                    Configure plan ID
                  </span>
                )}
              </div>

              <ul className="mt-5 flex flex-col gap-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                    <CheckIcon accent={highlighted} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
