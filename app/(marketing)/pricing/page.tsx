import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { PricingCards } from "@/components/landing/pricing-cards";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Pricing - SaaS Starter",
  description: "Simple, transparent pricing for every stage of your business.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Pricing
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Start free. Upgrade when you&apos;re ready. Cancel anytime.
            </p>
          </div>
          <PricingCards />
        </section>

        {/* FAQ */}
        <section className="border-t border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
            <h2 className="text-2xl font-bold text-center mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-8">
              {[
                {
                  q: "Can I cancel my subscription?",
                  a: "Yes, you can cancel anytime. Your access continues until the end of your billing period.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards and PayPal through our payment partner Whop.",
                },
                {
                  q: "Is there a free trial?",
                  a: "The Free plan gives you access to core features. Upgrade when you need more.",
                },
                {
                  q: "Can I change plans?",
                  a: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately.",
                },
              ].map((faq) => (
                <div key={faq.q}>
                  <h3 className="font-semibold">{faq.q}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
