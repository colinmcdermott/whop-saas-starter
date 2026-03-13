"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialStep?: number;
  isSignedIn: boolean;
  isAdmin: boolean;
}

const STEPS = [
  { id: 1, label: "Welcome" },
  { id: 2, label: "Whop App" },
  { id: 3, label: "OAuth" },
  { id: 4, label: "Sign In" },
  { id: 5, label: "Plans" },
  { id: 6, label: "Done" },
];

export function SetupWizard({ initialStep, isSignedIn, isAdmin }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Whop config
  const [whopAppId, setWhopAppId] = useState("");
  const [whopApiKey, setWhopApiKey] = useState("");
  const [whopWebhookSecret, setWhopWebhookSecret] = useState("");

  // Plan IDs
  const [freePlanId, setFreePlanId] = useState("");
  const [proMonthlyId, setProMonthlyId] = useState("");
  const [proYearlyId, setProYearlyId] = useState("");
  const [entMonthlyId, setEntMonthlyId] = useState("");
  const [entYearlyId, setEntYearlyId] = useState("");

  // Load existing config if any
  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => {
        if (data.values) {
          if (data.values.whop_app_id) setWhopAppId(data.values.whop_app_id);
          if (data.values.whop_free_plan_id) setFreePlanId(data.values.whop_free_plan_id);
          if (data.values.whop_pro_plan_id) setProMonthlyId(data.values.whop_pro_plan_id);
          if (data.values.whop_pro_plan_id_yearly) setProYearlyId(data.values.whop_pro_plan_id_yearly);
          if (data.values.whop_enterprise_plan_id) setEntMonthlyId(data.values.whop_enterprise_plan_id);
          if (data.values.whop_enterprise_plan_id_yearly) setEntYearlyId(data.values.whop_enterprise_plan_id_yearly);
        }
      })
      .catch(() => {});
  }, []);

  // If we returned from OAuth and are now signed in, auto-advance to step 5
  useEffect(() => {
    if (isSignedIn && isAdmin && step === 4) {
      setStep(5);
    }
  }, [isSignedIn, isAdmin, step]);

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback`
      : "";
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/whop`
      : "";

  async function saveConfigs(configs: Record<string, string>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleWhopConfigSave() {
    if (!whopAppId.trim()) {
      setError("App ID is required");
      return;
    }
    const ok = await saveConfigs({
      whop_app_id: whopAppId.trim(),
      ...(whopApiKey.trim() && { whop_api_key: whopApiKey.trim() }),
      ...(whopWebhookSecret.trim() && { whop_webhook_secret: whopWebhookSecret.trim() }),
    });
    if (ok) goTo(3);
  }

  async function handlePlansSave() {
    const configs: Record<string, string> = {};
    if (freePlanId.trim()) configs.whop_free_plan_id = freePlanId.trim();
    if (proMonthlyId.trim()) configs.whop_pro_plan_id = proMonthlyId.trim();
    if (proYearlyId.trim()) configs.whop_pro_plan_id_yearly = proYearlyId.trim();
    if (entMonthlyId.trim()) configs.whop_enterprise_plan_id = entMonthlyId.trim();
    if (entYearlyId.trim()) configs.whop_enterprise_plan_id_yearly = entYearlyId.trim();

    if (Object.keys(configs).length > 0) {
      const ok = await saveConfigs(configs);
      if (!ok) return;
    }
    goTo(6);
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/complete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to complete setup");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function goTo(n: number) {
    setError(null);
    setStep(n);
  }

  const progress = (step / STEPS.length) * 100;
  const showBack = step > 1 && step < 6;

  return (
    <div className="min-h-screen flex justify-center p-4 pt-8 md:pt-12">
      <div className="w-full max-w-lg">
        {/* Progress bar — whop-ecom style */}
        <nav
          className="relative flex items-center justify-center"
          aria-label="Setup progress"
        >
          {showBack && (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="cursor-pointer mr-3 md:absolute md:-left-8 md:mr-0 p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] rounded-md transition-colors"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}
          <div className="flex-1 md:flex-none md:w-full max-w-md h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--foreground)] transition-all duration-300 ease-out"
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              style={{ width: `${progress}%` }}
            />
          </div>
        </nav>

        {/* Step content */}
        <div className="mt-12 text-center">
          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 text-left">
              {error}
            </div>
          )}

          {/* Step 1: Welcome */}
          {step === 1 && (
            <>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Welcome to your new SaaS
              </h1>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
                Let&apos;s get everything set up. This wizard will walk you through
                connecting Whop for authentication and payments.
              </p>
              <p className="mt-1.5 text-xs text-[var(--muted)]">
                It only takes a few minutes.
              </p>
              <StepButton onClick={() => goTo(2)}>
                Get Started
              </StepButton>
            </>
          )}

          {/* Step 2: Whop App Config */}
          {step === 2 && (
            <div className="text-left">
              <h2 className="text-lg font-semibold tracking-tight text-center">
                Connect your Whop app
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed text-center">
                Create an app at{" "}
                <a
                  href="https://whop.com/dashboard/developer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  whop.com/dashboard/developer
                </a>
                , then paste your credentials below.
              </p>

              <div className="mt-6 space-y-4">
                <InputField
                  label="App ID"
                  placeholder="app_xxxxxxxxx"
                  value={whopAppId}
                  onChange={setWhopAppId}
                  required
                />
                <InputField
                  label="API Key"
                  placeholder="apik_xxxxxxxxx"
                  value={whopApiKey}
                  onChange={setWhopApiKey}
                  hint="Optional — used for server-side API calls"
                />
                <InputField
                  label="Webhook Secret"
                  placeholder="Your webhook secret"
                  value={whopWebhookSecret}
                  onChange={setWhopWebhookSecret}
                  hint="Optional — you can add this later in step 5"
                />
              </div>

              <StepButton
                onClick={handleWhopConfigSave}
                disabled={saving || !whopAppId.trim()}
              >
                {saving ? "Saving..." : "Continue"}
              </StepButton>
            </div>
          )}

          {/* Step 3: Redirect URI */}
          {step === 3 && (
            <div className="text-left">
              <h2 className="text-lg font-semibold tracking-tight text-center">
                Configure OAuth in Whop
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed text-center">
                Go to your app in the{" "}
                <a
                  href="https://whop.com/dashboard/developer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  Whop Developer Dashboard
                </a>{" "}
                and configure these settings.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm font-medium mb-2">
                    1. Set Client mode to <span className="font-semibold">Public</span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Under the OAuth section of your app settings.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">2. Add this Redirect URI</p>
                  <CopyField
                    value={callbackUrl}
                    copied={copied === "callback"}
                    onCopy={() => copyText(callbackUrl, "callback")}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">3. Add this Webhook URL</p>
                  <CopyField
                    value={webhookUrl}
                    copied={copied === "webhook"}
                    onCopy={() => copyText(webhookUrl, "webhook")}
                  />
                  <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                    Subscribe to: membership_activated, membership_deactivated,
                    payment_succeeded, payment_failed
                  </p>
                </div>
              </div>

              <StepButton onClick={() => goTo(4)}>
                I&apos;ve done this
              </StepButton>
            </div>
          )}

          {/* Step 4: Test OAuth */}
          {step === 4 && (
            <>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                Test your connection
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
                Sign in with Whop to verify everything works.
                You&apos;ll be set as the admin of this app.
              </p>

              {isSignedIn && isAdmin ? (
                <>
                  <div className="mt-5 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                    Connected and signed in as admin!
                  </div>
                  <StepButton onClick={() => goTo(5)}>
                    Continue
                  </StepButton>
                </>
              ) : isSignedIn ? (
                <>
                  <div className="mt-5 rounded-lg bg-amber-500/10 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400">
                    Signed in — checking admin status...
                  </div>
                  <StepButton onClick={() => router.refresh()}>
                    Refresh
                  </StepButton>
                </>
              ) : (
                <a
                  href="/api/auth/login?next=/setup?step=4"
                  className="mt-8 block w-full rounded-lg bg-[var(--foreground)] py-3 text-center text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-80"
                >
                  Sign in with Whop
                </a>
              )}
            </>
          )}

          {/* Step 5: Configure Plans */}
          {step === 5 && (
            <div className="text-left">
              <h2 className="text-lg font-semibold tracking-tight text-center">
                Configure your plans
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed text-center">
                Create plans in your{" "}
                <a
                  href="https://whop.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  Whop Dashboard
                </a>{" "}
                and paste the plan IDs below.
              </p>

              <div className="mt-6 space-y-4">
                <InputField
                  label="Free Plan ID"
                  placeholder="plan_xxxxxxxxx"
                  value={freePlanId}
                  onChange={setFreePlanId}
                  hint="A $0 plan so free users are tracked in Whop"
                />
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-xs font-medium text-[var(--muted)] mb-3">Pro ($29/mo)</p>
                  <div className="space-y-3">
                    <InputField
                      label="Monthly"
                      placeholder="plan_xxxxxxxxx"
                      value={proMonthlyId}
                      onChange={setProMonthlyId}
                    />
                    <InputField
                      label="Yearly"
                      placeholder="plan_xxxxxxxxx"
                      value={proYearlyId}
                      onChange={setProYearlyId}
                      hint="Optional — leave blank if you don't offer yearly"
                    />
                  </div>
                </div>
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-xs font-medium text-[var(--muted)] mb-3">Enterprise ($99/mo)</p>
                  <div className="space-y-3">
                    <InputField
                      label="Monthly"
                      placeholder="plan_xxxxxxxxx"
                      value={entMonthlyId}
                      onChange={setEntMonthlyId}
                    />
                    <InputField
                      label="Yearly"
                      placeholder="plan_xxxxxxxxx"
                      value={entYearlyId}
                      onChange={setEntYearlyId}
                      hint="Optional — leave blank if you don't offer yearly"
                    />
                  </div>
                </div>
              </div>

              <StepButton onClick={handlePlansSave} disabled={saving}>
                {saving ? "Saving..." : "Continue"}
              </StepButton>
              <button
                onClick={() => goTo(6)}
                type="button"
                className="mt-3 w-full py-2.5 text-center text-sm text-[var(--muted)] font-medium transition-colors hover:text-[var(--foreground)]"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 6: Done */}
          {step === 6 && (
            <>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                You&apos;re all set!
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
                Your SaaS is configured and ready to go.
                You can update these settings anytime from the dashboard.
              </p>
              <StepButton onClick={handleComplete} disabled={saving}>
                {saving ? "Finishing..." : "Go to Dashboard"}
              </StepButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function StepButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-8 w-full rounded-lg bg-[var(--foreground)] py-3 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  hint,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-mono outline-none focus:border-[var(--accent)] transition-colors"
      />
      {hint && <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

function CopyField({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <code className="flex-1 text-xs font-mono truncate">{value}</code>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--card)]"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
