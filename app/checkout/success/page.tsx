import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Successful",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xs text-center animate-slide-up">
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <svg
            className="h-5 w-5 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-sm font-semibold">Payment Successful</h1>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {plan
            ? `You've been upgraded to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`
            : "Your payment has been processed."}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          It may take a moment for your account to update.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-[var(--foreground)] px-5 py-2 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-80"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
