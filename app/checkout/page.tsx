"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  WhopCheckoutEmbed,
  useCheckoutEmbedControls,
} from "@whop/checkout/react";
import { APP_NAME, type PlanKey, type BillingInterval } from "@/lib/constants";
import type { PlansConfig } from "@/lib/config";
import { COUNTRIES } from "@/lib/countries";

// ── Icons ────────────────────────────────────────────────────────────────────

function LockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[var(--foreground)] shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

// ── Shared input class ───────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

const inputErrorClass =
  "w-full rounded-lg border border-red-400 dark:border-red-500 bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-red-400";

// ── Main checkout ────────────────────────────────────────────────────────────

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutControlsRef = useCheckoutEmbedControls();
  const paymentRef = useRef<HTMLDivElement>(null);

  const planKey = searchParams.get("plan") as PlanKey | null;
  const interval =
    (searchParams.get("interval") as BillingInterval) ?? "monthly";

  // Data loading
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [emailLoaded, setEmailLoaded] = useState(false);
  const [plans, setPlans] = useState<PlansConfig | null>(null);

  // Billing form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Payment state — embed only mounts after "Continue to Payment"
  const [showPayment, setShowPayment] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Theme detection
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Fetch session user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email) {
          setSessionEmail(data.email);
          setEmail(data.email);
        }
        if (data?.name) {
          setSessionName(data.name);
          setName(data.name);
        }
      })
      .catch(() => {})
      .finally(() => setEmailLoaded(true));
  }, []);

  // Fetch plans config
  useEffect(() => {
    fetch("/api/config/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch(() => {});
  }, []);

  const plan = planKey && plans ? (plans[planKey] ?? null) : null;
  const whopPlanId = plan
    ? interval === "yearly"
      ? plan.whopPlanIdYearly
      : plan.whopPlanId
    : "";
  const isLoggedIn = !!sessionEmail;
  const price = plan
    ? interval === "yearly"
      ? plan.priceYearly
      : plan.priceMonthly
    : 0;

  // ── Invalid plan ─────────────────────────────────────────────────────────

  if (plans && (!plan || !whopPlanId)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-sm font-semibold">Invalid Plan</h1>
          <p className="mt-2 text-xs text-[var(--muted)]">
            The plan you selected doesn&apos;t exist or hasn&apos;t been
            configured.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-block rounded-lg border border-[var(--border)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function clearFieldError(field: string) {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email address";

    if (!name.trim()) errors.name = "Name is required";
    if (!address.trim()) errors.address = "Address is required";
    if (!city.trim()) errors.city = "City is required";
    if (!postalCode.trim()) errors.postalCode = "Postal code is required";
    if (!country) errors.country = "Country is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleContinueToPayment() {
    if (!validateForm()) return;
    setShowPayment(true);
    // Scroll to payment after embed renders
    setTimeout(() => {
      paymentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  }

  async function handleSubmitPayment() {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      await checkoutControlsRef.current?.setEmail(email);
      await checkoutControlsRef.current?.setAddress({
        name,
        line1: address,
        line2: apartment || undefined,
        city,
        state: state || "",
        postalCode,
        country,
      });
      await checkoutControlsRef.current?.submit();
    } catch (err) {
      console.error("Payment submission failed:", err);
      setPaymentError("Payment failed. Please try again.");
      setIsProcessing(false);
    }
  }

  function handleComplete(_planId: string, receiptId?: string) {
    router.push(
      `/checkout/success?plan=${planKey}&receipt=${receiptId ?? ""}`
    );
  }

  const dataLoading = !plan || !emailLoaded;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <Link href="/" className="text-sm font-semibold">
          {APP_NAME}
        </Link>
        <Link
          href="/pricing"
          className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          Back to Pricing
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-[960px] flex flex-col lg:flex-row lg:gap-12">
          {/* ── Left column: Form + Payment ─────────────────────────────── */}
          <div className="flex-1 max-w-lg mx-auto lg:mx-0 order-2 lg:order-1">
            {dataLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-sm text-[var(--muted)]">
                  Loading checkout...
                </p>
              </div>
            ) : (
              <div className="animate-slide-up space-y-6">
                {/* ── Contact ──────────────────────────────────────────── */}
                <div>
                  <h2 className="text-sm font-semibold mb-3">Contact</h2>
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError("email");
                      }}
                      placeholder="Email address"
                      disabled={isLoggedIn}
                      autoComplete="email"
                      className={`${formErrors.email ? inputErrorClass : inputClass} ${isLoggedIn ? "opacity-70 cursor-not-allowed" : ""}`}
                    />
                    {formErrors.email && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {formErrors.email}
                      </p>
                    )}
                    {isLoggedIn && (
                      <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                        Signed in as {sessionName ?? email}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Billing address ──────────────────────────────────── */}
                <div>
                  <h2 className="text-sm font-semibold mb-3">
                    Billing address
                  </h2>
                  <div className="space-y-3">
                    {/* Country */}
                    <div>
                      <select
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          clearFieldError("country");
                        }}
                        className={
                          formErrors.country ? inputErrorClass : inputClass
                        }
                      >
                        <option value="" disabled>
                          Select country
                        </option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.country && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.country}
                        </p>
                      )}
                    </div>

                    {/* Full name */}
                    <div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearFieldError("name");
                        }}
                        placeholder="Full name"
                        autoComplete="name"
                        className={
                          formErrors.name ? inputErrorClass : inputClass
                        }
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Address line 1 */}
                    <div>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          clearFieldError("address");
                        }}
                        placeholder="Address"
                        autoComplete="address-line1"
                        className={
                          formErrors.address ? inputErrorClass : inputClass
                        }
                      />
                      {formErrors.address && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.address}
                        </p>
                      )}
                    </div>

                    {/* Apartment (optional) */}
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="Apartment, suite, etc. (optional)"
                      autoComplete="address-line2"
                      className={inputClass}
                    />

                    {/* City / State / Postal code */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            clearFieldError("city");
                          }}
                          placeholder="City"
                          autoComplete="address-level2"
                          className={
                            formErrors.city ? inputErrorClass : inputClass
                          }
                        />
                        {formErrors.city && (
                          <p className="mt-1 text-xs text-red-500">
                            {formErrors.city}
                          </p>
                        )}
                      </div>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        autoComplete="address-level1"
                        className={inputClass}
                      />
                      <div>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => {
                            setPostalCode(e.target.value);
                            clearFieldError("postalCode");
                          }}
                          placeholder="Postal code"
                          autoComplete="postal-code"
                          className={
                            formErrors.postalCode ? inputErrorClass : inputClass
                          }
                        />
                        {formErrors.postalCode && (
                          <p className="mt-1 text-xs text-red-500">
                            {formErrors.postalCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Payment section ──────────────────────────────────── */}
                <div ref={paymentRef}>
                  <h2 className="text-sm font-semibold mb-3">Payment</h2>

                  {!showPayment ? (
                    <>
                      {/* "Continue to Payment" button — shown before embed */}
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <button
                          type="button"
                          onClick={handleContinueToPayment}
                          className="w-full rounded-lg bg-[var(--foreground)] py-3 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-80"
                        >
                          Continue to Payment
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-[var(--muted)]">
                        <LockIcon />
                        <span className="text-[11px]">
                          Secure checkout powered by Whop
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Card input embed */}
                      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
                        <WhopCheckoutEmbed
                          ref={checkoutControlsRef}
                          planId={whopPlanId}
                          hideEmail
                          hideAddressForm
                          hideSubmitButton
                          hidePrice
                          skipRedirect
                          onStateChange={(state) =>
                            setCheckoutReady(state === "ready")
                          }
                          onComplete={handleComplete}
                          onAddressValidationError={(error) => {
                            console.error(
                              "Address validation error:",
                              error
                            );
                            setPaymentError(error.error_message);
                            setIsProcessing(false);
                          }}
                          prefill={{ email }}
                          theme={theme}
                          styles={{
                            container: {
                              paddingTop: 0,
                              paddingBottom: 0,
                            },
                          }}
                          fallback={
                            <div className="flex h-32 items-center justify-center">
                              <p className="text-xs text-[var(--muted)]">
                                Loading payment form...
                              </p>
                            </div>
                          }
                        />
                      </div>

                      {/* Error display */}
                      {paymentError && (
                        <p className="mt-3 text-xs text-red-500">
                          {paymentError}
                        </p>
                      )}

                      {/* Submit payment button */}
                      <button
                        type="button"
                        onClick={handleSubmitPayment}
                        disabled={isProcessing || !checkoutReady}
                        className="mt-4 w-full rounded-lg bg-[var(--foreground)] py-3 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Processing..." : `Pay $${price}`}
                      </button>

                      {/* Security note */}
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-[var(--muted)]">
                        <LockIcon />
                        <span className="text-[11px]">
                          Secure checkout powered by Whop
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: Order summary (desktop) ───────────────────── */}
          {plan && (
            <div className="hidden lg:block lg:w-[320px] lg:shrink-0 order-3 lg:order-2">
              <div className="sticky top-10 animate-slide-up delay-100">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <h2 className="text-sm font-semibold mb-4">Order summary</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Plan</span>
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Billing</span>
                      <span className="font-medium capitalize">
                        {interval}
                      </span>
                    </div>
                    <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-semibold">
                        ${price}
                        <span className="text-xs font-normal text-[var(--muted)] ml-0.5">
                          /{interval === "yearly" ? "yr" : "mo"}
                        </span>
                      </span>
                    </div>
                    {interval === "yearly" && price > 0 && (
                      <p className="text-[11px] text-[var(--muted)] text-right">
                        ${Math.round((price / 12) * 100) / 100}/mo billed
                        yearly
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mt-5 border-t border-[var(--border)] pt-4">
                    <p className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
                      What&apos;s included
                    </p>
                    <ul className="space-y-1.5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-xs text-[var(--muted)]"
                        >
                          <CheckIcon />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Mobile order summary ─────────────────────────────────── */}
          {plan && (
            <div className="mb-6 lg:hidden order-1">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">{plan.name} Plan</h2>
                    <p className="text-xs text-[var(--muted)] capitalize">
                      {interval} billing
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">${price}</span>
                    <span className="text-xs text-[var(--muted)]">
                      /{interval === "yearly" ? "yr" : "mo"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-sm text-[var(--muted)]">
            Loading checkout...
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
