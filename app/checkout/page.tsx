"use client";

import Script from "next/script";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PLANS, type PlanKey } from "@/lib/constants";
import { APP_NAME } from "@/lib/constants";

function CheckoutEmbed() {
  const searchParams = useSearchParams();
  const planKey = searchParams.get("plan") as PlanKey | null;

  const plan = planKey && planKey in PLANS ? PLANS[planKey] : null;
  const whopPlanId = plan?.whopPlanId;

  if (!plan || !whopPlanId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-sm font-semibold">Invalid Plan</h1>
          <p className="mt-2 text-xs text-[var(--muted)]">
            The plan you selected doesn&apos;t exist or hasn&apos;t been configured.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-block rounded-lg border border-[var(--border)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <Link href="/" className="text-sm font-semibold">
          {APP_NAME}
        </Link>
        <Link
          href="/pricing"
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Back to Pricing
        </Link>
      </header>

      {/* Checkout */}
      <div className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold">{plan.name} Plan</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {plan.priceMonthly === 0
                ? "Free forever"
                : `$${plan.priceMonthly}/mo`}
            </p>
          </div>

          {/* Whop embedded checkout renders here */}
          <div
            data-whop-checkout-plan-id={whopPlanId}
            data-whop-checkout-return-url={`${appUrl}/checkout/success?plan=${planKey}`}
            className="min-h-[400px] rounded-xl border border-[var(--border)] overflow-hidden"
          />

          <Script
            src="https://js.whop.com/static/checkout/loader.js"
            strategy="afterInteractive"
          />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-sm text-[var(--muted)]">Loading checkout...</div>
        </div>
      }
    >
      <CheckoutEmbed />
    </Suspense>
  );
}
