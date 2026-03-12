import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In - SaaS Starter",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const redirectPath = next ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">
            SaaS Starter
          </Link>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to your account
          </p>
        </div>

        <a
          href={`/api/auth/login?next=${encodeURIComponent(redirectPath)}`}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)] hover:opacity-90 transition-opacity"
        >
          <WhopLogo />
          Continue with Whop
        </a>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          By continuing, you agree to our{" "}
          <a href="#" className="underline underline-offset-4">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function WhopLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
    </svg>
  );
}
