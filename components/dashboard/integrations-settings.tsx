"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

interface IntegrationsData {
  analytics_provider: string | null;
  analytics_id: string | null;
  email_provider: string | null;
  email_api_key: string | null;
}

const ANALYTICS_OPTIONS = [
  { value: "", label: "None" },
  { value: "posthog", label: "PostHog" },
  { value: "google", label: "Google Analytics" },
  { value: "plausible", label: "Plausible" },
];

const EMAIL_OPTIONS = [
  { value: "", label: "None" },
  { value: "resend", label: "Resend" },
  { value: "sendgrid", label: "SendGrid" },
];

export function IntegrationsSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  const [analyticsProvider, setAnalyticsProvider] = useState("");
  const [analyticsId, setAnalyticsId] = useState("");
  const [emailProvider, setEmailProvider] = useState("");
  const [emailApiKey, setEmailApiKey] = useState("");

  useEffect(() => {
    fetch("/api/config/integrations")
      .then((res) => res.json())
      .then((data: IntegrationsData) => {
        setAnalyticsProvider(data.analytics_provider ?? "");
        setAnalyticsId(data.analytics_id ?? "");
        setEmailProvider(data.email_provider ?? "");
        setEmailApiKey(data.email_api_key ?? "");
      })
      .catch(() => toast("Failed to load integrations", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  function handleSave() {
    startTransition(async () => {
      const res = await fetch("/api/config/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analytics_provider: analyticsProvider,
          analytics_id: analyticsId,
          email_provider: emailProvider,
          email_api_key: emailApiKey,
        }),
      });

      if (res.ok) {
        toast("Integrations saved", "success");
        router.refresh();
      } else {
        toast("Failed to save integrations", "error");
      }
    });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-[var(--surface)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-medium">Analytics</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Track page views and user behavior.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={analyticsProvider}
            onChange={(e) => setAnalyticsProvider(e.target.value)}
            aria-label="Analytics provider"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {ANALYTICS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {analyticsProvider && (
            <input
              type="text"
              value={analyticsId}
              onChange={(e) => setAnalyticsId(e.target.value)}
              aria-label="Analytics ID"
              spellCheck={false}
              placeholder={
                analyticsProvider === "google"
                  ? "G-XXXXXXXXXX"
                  : analyticsProvider === "posthog"
                    ? "phc_xxxxxxxxxx"
                    : "yourdomain.com"
              }
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono placeholder:text-[var(--muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-medium">Transactional Email</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Send emails for onboarding, notifications, and receipts.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={emailProvider}
            onChange={(e) => setEmailProvider(e.target.value)}
            aria-label="Email provider"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {EMAIL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {emailProvider && (
            <input
              type="text"
              value={emailApiKey}
              onChange={(e) => setEmailApiKey(e.target.value)}
              aria-label="Email API key"
              spellCheck={false}
              placeholder={
                emailProvider === "resend"
                  ? "re_xxxxxxxxxx"
                  : "SG.xxxxxxxxxx"
              }
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono placeholder:text-[var(--muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          )}
        </div>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {isPending ? "Saving\u2026" : "Save Integrations"}
      </button>
    </div>
  );
}
