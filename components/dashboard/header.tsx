import Link from "next/link";
import type { Session } from "@/lib/auth";

export function DashboardHeader({ session }: { session: Session }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4 sm:px-6">
      {/* Mobile logo */}
      <Link href="/" className="text-lg font-bold lg:hidden">
        SaaS Starter
      </Link>

      <div className="hidden lg:block" />

      {/* User menu */}
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-[var(--muted)] sm:block">
          {session.email}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-medium text-[var(--accent-foreground)]">
            {session.name?.[0]?.toUpperCase() ?? session.email?.[0]?.toUpperCase() ?? "?"}
          </div>

          <a
            href="/api/auth/logout"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Sign out
          </a>
        </div>
      </div>
    </header>
  );
}
