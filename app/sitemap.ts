import type { MetadataRoute } from "next";
import { headers } from "next/headers";

/**
 * Resolve the base URL for sitemap/robots.
 * Priority: NEXT_PUBLIC_APP_URL → Vercel system env vars → request host header.
 */
async function getBaseUrl(): Promise<string> {
  // 1. Explicit app URL (recommended for production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Vercel system env vars (no protocol prefix)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Derive from request headers (works for any host)
  try {
    const h = await headers();
    const host = h.get("host");
    if (host) {
      const proto = host.includes("localhost") ? "http" : "https";
      return `${proto}://${host}`;
    }
  } catch {
    // headers() not available in static context
  }

  return "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();

  const staticRoutes = [
    { path: "/", priority: 1.0 },
    { path: "/pricing", priority: 0.8 },
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 },
    { path: "/docs", priority: 0.7 },
    { path: "/docs/guides/authentication", priority: 0.6 },
    { path: "/docs/guides/plan-gating", priority: 0.6 },
    { path: "/docs/guides/payments", priority: 0.6 },
    { path: "/docs/guides/customization", priority: 0.6 },
    { path: "/docs/guides/database", priority: 0.6 },
    { path: "/docs/guides/api-reference", priority: 0.6 },
    { path: "/docs/guides/deployment", priority: 0.6 },
  ];

  return staticRoutes.map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));
}
