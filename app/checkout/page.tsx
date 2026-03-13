"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { APP_NAME, type PlanKey, type BillingInterval } from "@/lib/constants";
import type { PlansConfig } from "@/lib/config";

function CheckoutEmbed() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planKey = searchParams.get("plan") as PlanKey | null;
  const interval = (searchParams.get("interval") as BillingInterval) ?? "monthly";
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [emailLoaded, setEmailLoaded] = useState(false);
  const [plans, setPlans] = useState<PlansConfig | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email) setUserEmail(data.email);
      })
      .catch(() => {})
      .finally(() => setEmailLoaded(true));
  }, []);

  useEffect(() => {
    fetch("/api/config/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch(() => {});
  }, []);

  const plan = planKey && plans ? plans[planKey] ?? null : null;
  const whopPlanId = plan
    ? interval === "yearly"
      ? plan.whopPlanIdYearly
      : plan.whopPlanId
    : "";

  if (plans && (!plan || !whopPlanId)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-sm font-semibold">Invalid Plan</h1>
          <p className="mt-2 text-xs text-[var(--muted)]">
            The plan you selected doesn&apos;t exist or hasn&apos;t been
            configured.
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

  const loading = (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-[var(--border)]">
      <p className="text-sm text-[var(--muted)]">Loading checkout...</p>
    </div>
  );

  if (!plan) return loading;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <Link href="/" className="text-sm font-semibold">
          {APP_NAME}
        </Link>
        <Link
          href="/pricing"
          className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
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
                : interval === "yearly"
                  ? `$${plan.priceYearly}/yr`
                  : `$${plan.priceMonthly}/mo`}
            </p>
          </div>

          {/* Wait for email check before mounting embed so prefill works */}
          {!emailLoaded ? (
            loading
          ) : (
            <WhopCheckoutEmbed
              planId={whopPlanId}
              skipRedirect
              prefill={userEmail ? { email: userEmail } : undefined}
              disableEmail={!!userEmail}
              onComplete={(plan_id, receipt_id) => {
                router.push(
                  `/checkout/success?plan=${planKey}&receipt=${receipt_id ?? ""}`
                );
              }}
              fallback={loading}
            />
          )}
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
          <div className="text-sm text-[var(--muted)]">
            Loading checkout...
          </div>
        </div>
      }
    >
      <CheckoutEmbed />
    </Suspense>
  );
}
