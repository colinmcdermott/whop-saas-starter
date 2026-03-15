import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";

export function DashboardHeader({ session }: { session: Session }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4 sm:px-6">
      {/* Mobile logo — offset for sidebar toggle */}
      <Link href="/" className="pl-8 lg:pl-0 lg:hidden">
        <AppLogo />
      </Link>

      <div className="hidden lg:block" />

      {/* User menu */}
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-[var(--muted)] sm:block">
          {session.email}
        </span>

        <ThemeToggle />

        <div className="flex items-center gap-2.5">
          {session.profileImageUrl ? (
            <Image
              src={session.profileImageUrl}
              alt={session.name ?? session.email ?? "User"}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)]">
              <svg className="h-3.5 w-3.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
          )}

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
