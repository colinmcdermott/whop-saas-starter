import type { Metadata } from "next";
import Link from "next/link";
import { requireSession, hasMinimumPlan } from "@/lib/auth";
import { DEFAULT_PLAN, type PlanKey } from "@/lib/constants";
import { PlanGate } from "@/components/plan-gate";

export const metadata: Metadata = {
  title: "Projects",
};

/**
 * Example "app" page — demonstrates how to build product features
 * within the dashboard layout.
 *
 * This page shows:
 * - Plan-gated limits (free = 3 projects, starter+ = unlimited)
 * - A project list with empty state
 * - How to add your own product pages to the dashboard
 *
 * To build your own product:
 * 1. Replace this page with your feature (editor, chat, dashboard, etc.)
 * 2. Add a database model for your data (see db/schema.prisma)
 * 3. Wire up API routes for CRUD operations (see app/api/)
 * 4. The sidebar nav item is already added in components/dashboard/sidebar.tsx
 */

const FREE_PROJECT_LIMIT = 3;

// Placeholder projects — replace with real data from your database
const DEMO_PROJECTS = [
  { id: "1", name: "Marketing Site", description: "Landing page and blog", updatedAt: daysAgo(1) },
  { id: "2", name: "API Service", description: "REST API for mobile app", updatedAt: daysAgo(3) },
  { id: "3", name: "Analytics Dashboard", description: "Internal metrics viewer", updatedAt: daysAgo(7) },
];

export default async function ProjectsPage() {
  const session = await requireSession();
  const isPaid = hasMinimumPlan(session.plan, "starter" as PlanKey);
  const limit = isPaid ? Infinity : FREE_PROJECT_LIMIT;
  const projects = DEMO_PROJECTS; // Replace with: await prisma.project.findMany({ where: { userId: session.userId } })
  const canCreate = projects.length < limit;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {isPaid
              ? "Manage your projects."
              : `${projects.length} of ${FREE_PROJECT_LIMIT} projects used.`}
          </p>
        </div>
        <button
          type="button"
          disabled={!canCreate}
          className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          New Project
        </button>
      </div>

      {/* Upgrade nudge for free users at limit */}
      {!isPaid && !canCreate && (
        <div className="animate-slide-up delay-100 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Project limit reached</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Upgrade to Starter for unlimited projects and advanced features.
              </p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Project list */}
      <div className="animate-slide-up delay-100 rounded-xl border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)]">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-[var(--surface)]"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-medium truncate">{project.name}</h3>
              <p className="mt-0.5 text-xs text-[var(--muted)] truncate">{project.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-[var(--muted)] hidden sm:block">
                {formatRelative(project.updatedAt)}
              </span>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface)]"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pro-only feature example */}
      <PlanGate
        plan={session.plan}
        minimum="pro"
        fallback={
          hasMinimumPlan(session.plan, "starter" as PlanKey) ? (
            <div className="animate-slide-up delay-200 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-[var(--muted)]">Team Collaboration</h3>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Upgrade to Pro to invite team members and collaborate on projects.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface)]"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          ) : null
        }
      >
        <div className="animate-slide-up delay-200 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold">Team Members</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Invite your team to collaborate on projects.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface)]"
          >
            Invite Member
          </button>
        </div>
      </PlanGate>

      {/* Developer hint */}
      <div className="animate-slide-up delay-300 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          <span className="font-medium text-[var(--foreground)]">Developer note:</span>{" "}
          This is an example page showing how to add product features to the dashboard.
          Replace the demo data with your own database queries, add API routes for mutations,
          and customize the UI for your product. See{" "}
          <Link href="/docs" className="underline underline-offset-2 hover:text-[var(--foreground)]">
            the docs
          </Link>{" "}
          for more patterns.
        </p>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
