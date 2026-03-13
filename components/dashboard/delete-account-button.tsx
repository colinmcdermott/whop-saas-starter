"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = input === "DELETE";

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account");
      }

      // Redirect to home — session is already cleared server-side
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 rounded-lg border border-red-200 dark:border-red-900/30 px-3.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        Delete Account
      </button>

      {/* Confirmation modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setInput("");
              setError(null);
            }
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg animate-scale-in">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Delete your account?
            </h3>
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              This is permanent and cannot be undone. Your account and all
              associated data will be deleted immediately.
            </p>

            <label className="mt-4 block text-xs text-[var(--muted)]">
              Type <span className="font-mono font-semibold text-[var(--foreground)]">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              spellCheck={false}
              className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-mono outline-none focus:border-red-400 dark:focus:border-red-500"
            />

            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setInput("");
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!confirmed || loading}
                className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
