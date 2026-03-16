"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PLAN_METADATA, PLAN_KEYS, getPlanBillingIntervals, planConfigKey, planConfigKeyYearly } from "@/lib/constants";

interface Props {
  initialStep?: number;
  isSignedIn: boolean;
  isAdmin: boolean;
  initialConfig?: {
    whopAppId: string;
    planIds: Record<string, string>;
  };
}

const STEPS = [
  { id: 1, label: "Welcome" },
  { id: 2, label: "Business" },
  { id: 3, label: "Create App" },
  { id: 4, label: "OAuth" },
  { id: 5, label: "Webhooks" },
  { id: 6, label: "Sign In" },
  { id: 7, label: "Plans" },
  { id: 8, label: "Done" },
];

function getPersistedStep(): number | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("setup_step");
  return saved ? parseInt(saved, 10) : null;
}

export function SetupWizard({ initialStep, isSignedIn, isAdmin, initialConfig }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep ?? getPersistedStep() ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Whop config — pre-filled from server
  const [whopAppId, setWhopAppId] = useState(initialConfig?.whopAppId ?? "");
  const [whopApiKey, setWhopApiKey] = useState("");
  const [whopWebhookSecret, setWhopWebhookSecret] = useState("");

  // Plan IDs — pre-filled from server
  const [planIds, setPlanIds] = useState<Record<string, string>>(initialConfig?.planIds ?? {});
  function setPlanId(configKey: string, value: string) {
    setPlanIds((prev) => ({ ...prev, [configKey]: value }));
  }

  // If we returned from OAuth and are now signed in, auto-advance to step 7
  useEffect(() => {
    if (isSignedIn && isAdmin && step === 6) {
      setStep(7);
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
    });
    if (ok) goTo(4);
  }

  async function handleWebhookSecretSave() {
    const configs: Record<string, string> = {};
    if (whopWebhookSecret.trim()) configs.whop_webhook_secret = whopWebhookSecret.trim();
    if (Object.keys(configs).length > 0) {
      const ok = await saveConfigs(configs);
      if (!ok) return;
    }
    goTo(6);
  }

  async function handlePlansSave() {
    const configs: Record<string, string> = {};
    for (const [key, value] of Object.entries(planIds)) {
      if (value.trim()) configs[key] = value.trim();
    }
    if (Object.keys(configs).length > 0) {
      const ok = await saveConfigs(configs);
      if (!ok) return;
    }
    goTo(8);
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
      try { localStorage.removeItem("setup_step"); } catch {}
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
    try { localStorage.setItem("setup_step", String(n)); } catch {}
  }

  const progress = (step / STEPS.length) * 100;
  const showBack = step > 1 && step < 8;

  return (
    <div className="min-h-screen flex justify-center p-4 pt-8 md:pt-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
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
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}
          <div className="flex-1 md:flex-none md:w-full max-w-md h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
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
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Let&apos;s get everything set up.
              </h1>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
                This wizard will walk you through
                connecting Whop for authentication and payments.
              </p>
              <StepButton onClick={() => goTo(2)}>
                Get Started
              </StepButton>
            </>
          )}

          {/* Step 2: Do you have a Whop business? */}
          {step === 2 && (
            <>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349M3.75 9.349a3 3 0 01-2.695-1.738L2.25 4.5h19.5l1.195 3.111A3 3 0 0120.25 9.35" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                Do you have a Whop business?
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
                You&apos;ll need a Whop business to handle payments and authentication for your SaaS.
              </p>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => goTo(3)}
                  className="cursor-pointer w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left transition-colors hover:border-[var(--accent)]"
                >
                  <p className="text-sm font-medium">Yes, I have a Whop business</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    I&apos;ll create an app in the Developer Dashboard
                  </p>
                </button>
                <a
                  href="https://whop.com/new/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left transition-colors hover:border-[var(--accent)]"
                >
                  <p className="text-sm font-medium">No, I need to create one</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    Opens whop.com/new/ in a new tab — come back here when you&apos;re done
                  </p>
                </a>
              </div>

              <button
                onClick={() => goTo(3)}
                type="button"
                className="cursor-pointer mt-4 w-full py-2.5 text-center text-sm text-[var(--muted)] font-medium transition-colors hover:text-[var(--foreground)]"
              >
                I&apos;ve created my business, continue
              </button>
            </>
          )}

          {/* Step 3: Create App + App ID & API Key */}
          {step === 3 && (
            <div className="text-left">
              <h2 className="text-lg font-semibold tracking-tight text-center">
                Create a Whop app
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed text-center">
                Open the{" "}
                <a
                  href="https://whop.com/dashboard/developer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  Developer page
                </a>
                {" "}and click <span className="font-medium text-[var(--foreground)]">Create app</span>.
              </p>

              <div className="mt-6 space-y-5">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-3">Where to find your credentials</p>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">1</span>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Click <span className="font-medium text-[var(--foreground)]">Create app</span>, give it a name, then click <span className="font-medium text-[var(--foreground)]">Create</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">2</span>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        On the <span className="font-medium text-[var(--foreground)]">App details</span> tab, find the <span className="font-medium text-[var(--foreground)]">&quot;Set up your local environment&quot;</span> box in the top-right
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">3</span>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Copy the <span className="font-mono text-[var(--foreground)]">app_</span> value (App ID) and <span className="font-mono text-[var(--foreground)]">apik_</span> value (API Key) from that box
                      </p>
                    </div>
                  </div>
                </div>

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
                  hint="Found in the same box as your App ID"
                />
              </div>

              <StepButton
                onClick={handleWhopConfigSave}
                disabled={saving || !whopAppId.trim()}
              >
                {saving ? "Saving\u2026" : "Continue"}
              </StepButton>
            </div>
          )}

          {/* Step 4: Configure OAuth */}
          {step === 4 && (
            <div className="text-left">
              <h2 className="text-lg font-semibold tracking-tight text-center">
                Configure OAuth
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed text-center">
                In your app&apos;s{" "}
                <span className="font-medium text-[var(--foreground)]">OAuth</span>
                {" "}tab, configure these settings so users can sign in.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm font-medium mb-2">
                    1. Set Client mode to <span className="font-semibold">Public</span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    This is in the OAuth tab of your app. Public mode means no client secret is needed.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">2. Add this Redirect URI</p>
                  <CopyField
                    value={callbackUrl}
                    copied={copied === "callback"}
                    onCopy={() => copyText(callbackUrl, "callback")}
                  />
                  <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                    This tells Whop where to send users after they sign in.
                  </p>
                </div>
              </div>

              <StepButton onClick={() => goTo(5)}>
                I&apos;ve done this
              </StepButton>
            </div>
          )}

          {/* Step 5: Set up Webhooks */}
          {step === 5 && (
            <div className="text-left">
              <h2 className="text-lg font-semibold tracking-tight text-center">
                Set up webhooks
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed text-center">
                Webhooks keep your app in sync when users subscribe or cancel.
              </p>

              <div className="mt-6 space-y-5">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-3">How to create your webhook</p>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">1</span>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Go to the <span className="font-medium text-[var(--foreground)]">Webhooks</span> tab in your app and click <span className="font-medium text-[var(--foreground)]">&quot;+ Create webhook&quot;</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">2</span>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Paste the Endpoint URL below into the webhook form
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">3</span>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Select these events: <span className="font-medium text-[var(--foreground)]">membership_activated</span> and <span className="font-medium text-[var(--foreground)]">membership_deactivated</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">4</span>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Click <span className="font-medium text-[var(--foreground)]">Save</span>, then copy the <span className="font-medium text-[var(--foreground)]">Secret</span> (starts with <span className="font-mono text-[var(--foreground)]">ws_</span>) from the webhooks table
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Your Endpoint URL</p>
                  <CopyField
                    value={webhookUrl}
                    copied={copied === "webhook"}
                    onCopy={() => copyText(webhookUrl, "webhook")}
                  />
                </div>

                <InputField
                  label="Webhook Secret"
                  placeholder="ws_xxxxxxxxx"
                  value={whopWebhookSecret}
                  onChange={setWhopWebhookSecret}
                  hint="Shown in the Secret column after you save the webhook"
                />
              </div>

              <StepButton
                onClick={handleWebhookSecretSave}
                disabled={saving}
              >
                {saving ? "Saving\u2026" : "Continue"}
              </StepButton>
              <button
                onClick={() => goTo(6)}
                type="button"
                className="cursor-pointer mt-3 w-full py-2.5 text-center text-sm text-[var(--muted)] font-medium transition-colors hover:text-[var(--foreground)]"
              >
                Skip for now
              </button>
              <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 text-center">
                Without webhooks, plan changes from Whop won&apos;t sync to your app.
                You can set this up later in your Whop Developer Dashboard.
              </p>
            </div>
          )}

          {/* Step 6: Test OAuth / Sign In */}
          {step === 6 && (
            <>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
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
                  <StepButton onClick={() => goTo(7)}>
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
                  href="/api/auth/login?next=/setup?step=6"
                  className="cursor-pointer mt-8 block w-full rounded-lg bg-[var(--accent)] py-3 text-center text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
                >
                  Sign in with Whop
                </a>
              )}
            </>
          )}

          {/* Step 7: Configure Plans */}
          {step === 7 && (
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
              <p className="mt-1.5 text-[11px] text-[var(--muted)] text-center">
                To customize plan names, prices, or features, edit <code className="font-mono">lib/constants.ts</code>
              </p>

              <div className="mt-6 space-y-4">
                {PLAN_KEYS.map((key, index) => {
                  const meta = PLAN_METADATA[key];
                  const intervals = getPlanBillingIntervals(key);
                  const ck = planConfigKey(key);
                  const cky = planConfigKeyYearly(key);
                  const isFree = meta.priceMonthly === 0;

                  if (isFree) {
                    return (
                      <div key={key}>
                        <InputField
                          label={`${meta.name} Plan ID`}
                          placeholder="plan_xxxxxxxxx"
                          value={planIds[ck] ?? ""}
                          onChange={(v) => setPlanId(ck, v)}
                          hint="A $0 plan so free users are tracked in Whop"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={key} className={index > 0 ? "border-t border-[var(--border)] pt-4" : ""}>
                      <p className="text-xs font-medium text-[var(--muted)] mb-3">
                        {meta.name} (${meta.priceMonthly}/mo)
                      </p>
                      <div className="space-y-3">
                        {intervals.includes("monthly") && (
                          <InputField
                            label="Monthly"
                            placeholder="plan_xxxxxxxxx"
                            value={planIds[ck] ?? ""}
                            onChange={(v) => setPlanId(ck, v)}
                          />
                        )}
                        {intervals.includes("yearly") && (
                          <InputField
                            label="Yearly"
                            placeholder="plan_xxxxxxxxx"
                            value={planIds[cky] ?? ""}
                            onChange={(v) => setPlanId(cky, v)}
                            hint="Optional — leave blank if you don't offer yearly"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <StepButton onClick={handlePlansSave} disabled={saving}>
                {saving ? "Saving\u2026" : "Continue"}
              </StepButton>
              <button
                onClick={() => goTo(8)}
                type="button"
                className="cursor-pointer mt-3 w-full py-2.5 text-center text-sm text-[var(--muted)] font-medium transition-colors hover:text-[var(--foreground)]"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 8: Done */}
          {step === 8 && (
            <>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
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
                {saving ? "Finishing\u2026" : "Go to Dashboard"}
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
      className="cursor-pointer mt-8 w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
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
  const id = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:border-[var(--accent)] transition-colors"
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
        className="cursor-pointer shrink-0 rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--card)]"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
