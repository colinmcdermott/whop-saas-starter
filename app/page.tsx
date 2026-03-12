import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { PricingCards } from "@/components/landing/pricing-cards";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />

        {/* Pricing preview */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>
          <PricingCards />
        </section>
      </main>
      <Footer />
    </div>
  );
}
