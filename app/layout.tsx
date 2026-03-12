import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaaS Starter",
  description: "A modern SaaS starter built with Next.js and Whop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {/* Whop embedded checkout loader — activates any element with data-whop-checkout-plan-id */}
        <Script
          src="https://js.whop.com/static/checkout/loader.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
