"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * FAQ items — edit these to match your product.
 *
 * These defaults cover common questions about the SaaS starter template.
 * Replace them with questions your customers actually ask.
 */
const faqs = [
  {
    question: "What do I need to get started?",
    answer:
      "Just a Whop account and a database. Run the CLI, follow the setup wizard, and you'll have a fully working SaaS with auth, payments, and a dashboard in minutes. Deploy to Vercel for the fastest path to production.",
  },
  {
    question: "How does authentication work?",
    answer:
      "Users sign in via Whop using OAuth 2.1 with PKCE — no passwords to manage, no auth library to configure. Sessions are stored as signed JWTs in httpOnly cookies with a 7-day TTL.",
  },
  {
    question: "How are payments handled?",
    answer:
      "Payments are processed through Whop. You define your plans in the Whop dashboard, connect them via the setup wizard, and the starter handles checkout, webhooks, plan gating, and billing portal access automatically.",
  },
  {
    question: "Can I customize the plans and pricing?",
    answer:
      "Yes. Plans are data-driven — edit the definePlans() call in one file and everything adapts: pricing page, plan gating, checkout, webhooks, and the dashboard. Add, remove, or reorder tiers without touching any other code.",
  },
  {
    question: "What database can I use?",
    answer:
      "Any PostgreSQL provider — Neon, Supabase, Prisma Postgres, or your own. The CLI can auto-provision a database for you, or you can bring your own connection string.",
  },
  {
    question: "Is this a Whop app or a standalone site?",
    answer:
      "It's a standalone Next.js app on your own domain. It uses Whop for auth and payments but runs independently — no iframes, no Whop proxy. You own the full stack and can deploy it anywhere.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section>
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Everything you need to know to get started.
          </p>
        </div>

        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[var(--foreground)]"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-medium">{faq.question}</span>
                <svg
                  className={cn(
                    "h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200",
                    openIndex === i && "rotate-45"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200",
                  openIndex === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-sm text-[var(--muted)] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
