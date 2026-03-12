import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold">
          SaaS Starter
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/pricing"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/api/auth/login?next=/dashboard"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
