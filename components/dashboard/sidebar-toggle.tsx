"use client";

/**
 * Dispatches a custom event to open the sidebar.
 * The Sidebar component listens for this event.
 */
export function SidebarToggle() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] active:bg-[var(--surface)] transition-colors"
      aria-label="Open sidebar"
    >
      <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 15 15" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeWidth={1.25} d="M2 4.5h11M2 7.5h11M2 10.5h11" />
      </svg>
    </button>
  );
}
