import Link from "next/link";
import type { Session } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants";

export function DashboardHeader({ session }: { session: Session }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4 sm:px-6">
      {/* Mobile logo — offset for sidebar toggle */}
      <Link href="/" className="pl-8 text-sm font-semibold tracking-tight lg:hidden lg:pl-0">
        {APP_NAME}
      </Link>

      <div className="hidden lg:block" />

      {/* User menu */}
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-[var(--muted)] sm:block">
          {session.email}
        </span>

        <ThemeToggle />

        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-medium text-[var(--muted)]">
            {session.name?.[0]?.toUpperCase() ?? session.email?.[0]?.toUpperCase() ?? "?"}
          </div>

          <a
            href="/api/auth/logout"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Sign out
          </a>
        </div>
      </div>
    </header>
  );
}
