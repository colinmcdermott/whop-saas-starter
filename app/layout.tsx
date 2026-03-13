import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { getConfig } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

/**
 * Compute a lighter variant for dark mode from a hex color.
 * Blends the color 30% toward white to keep it readable on dark backgrounds.
 */
function lightenHex(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.3);
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read accent color from DB/env (returns null if not set → CSS default used)
  let accentStyle: string | undefined;
  try {
    const accent = await getConfig("accent_color");
    if (accent && /^#[0-9a-fA-F]{6}$/.test(accent)) {
      const lightVariant = lightenHex(accent);
      accentStyle = `--accent:${accent};--accent-dark:${lightVariant}`;
    }
  } catch {
    // Config/DB not ready yet (first build) — use CSS defaults
  }

  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script to prevent flash of wrong theme */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=document.documentElement;d.classList.remove("light","dark");if(t==="dark"||t==="light"){d.classList.add(t)}else{d.classList.add(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}}catch(e){}})()`,
          }}
        />
        {accentStyle && (
          <style
            id="accent-override"
            dangerouslySetInnerHTML={{
              __html: `:root{${accentStyle}}.dark{--accent:var(--accent-dark)}`,
            }}
          />
        )}
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
