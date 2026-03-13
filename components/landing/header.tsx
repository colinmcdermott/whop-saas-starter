"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Check auth state
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        setIsLoggedIn(res.ok);
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            {APP_NAME}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/pricing"
              className="rounded-md px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Pricing
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="ml-2 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/api/auth/login?next=/dashboard"
                  className="ml-2 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
                >
                  Get Started
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav — fixed overlay, no layout shift */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="fixed top-14 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)] p-4 sm:hidden animate-slide-up"
            style={{ animationDuration: "150ms" }}
          >
            <div className="mx-auto flex max-w-5xl flex-col gap-0.5">
              <Link
                href="/pricing"
                className="rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              >
                Pricing
              </Link>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="mt-1 rounded-lg bg-[var(--accent)] px-3 py-2.5 text-center text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/api/auth/login?next=/dashboard"
                    className="mt-1 rounded-lg bg-[var(--accent)] px-3 py-2.5 text-center text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
