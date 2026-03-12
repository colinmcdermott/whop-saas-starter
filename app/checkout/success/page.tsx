import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Successful - SaaS Starter",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold">Payment Successful!</h1>
        <p className="mt-3 text-[var(--muted)]">
          {plan
            ? `You've been upgraded to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`
            : "Your payment has been processed successfully."}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          It may take a moment for your account to update.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
