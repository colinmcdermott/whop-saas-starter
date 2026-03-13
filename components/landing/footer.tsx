import Link from "next/link";
import { LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
        <p className="text-xs text-[var(--muted)]">
          Built with{" "}
          <a
            href="https://nextjs.org"
            className="text-[var(--foreground)] hover:underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js
          </a>{" "}
          and{" "}
          <a
            href="https://whop.com"
            className="text-[var(--foreground)] hover:underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Whop
          </a>
        </p>

        <nav className="flex gap-5">
          <Link
            href="/pricing"
            prefetch={false}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Pricing
          </Link>
          <a
            href={LINKS.github}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
