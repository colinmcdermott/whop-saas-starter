import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication Error - SaaS Starter",
};

const errorMessages: Record<string, string> = {
  missing_params: "The sign-in request was incomplete. Please try again.",
  expired_session: "Your sign-in session expired. Please try again.",
  invalid_state: "The sign-in session was invalid. Please try again.",
  state_mismatch: "The sign-in session didn't match. Please try again.",
  exchange_failed: "Failed to complete sign-in. Please try again.",
  access_denied: "You denied the sign-in request.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; description?: string }>;
}) {
  const { error, description } = await searchParams;
  const message =
    (error && errorMessages[error]) ??
    description ??
    "An unexpected error occurred during sign-in.";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <span className="text-2xl">!</span>
        </div>

        <h1 className="text-xl font-semibold">Authentication Error</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--card-border)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
