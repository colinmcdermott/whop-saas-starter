import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 sm:px-6">
        <p className="text-sm text-[var(--muted)]">
          Built with{" "}
          <a
            href="https://nextjs.org"
            className="underline underline-offset-4 hover:text-[var(--foreground)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js
          </a>{" "}
          and{" "}
          <a
            href="https://whop.com"
            className="underline underline-offset-4 hover:text-[var(--foreground)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Whop
          </a>
        </p>

        <nav className="flex gap-6">
          <Link
            href="/pricing"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Pricing
          </Link>
          <a
            href="https://github.com"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
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
