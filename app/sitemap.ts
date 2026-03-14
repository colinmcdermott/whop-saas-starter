import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "/", priority: 1.0 },
    { path: "/pricing", priority: 0.8 },
    { path: "/docs", priority: 0.7 },
    { path: "/docs/guides/authentication", priority: 0.6 },
    { path: "/docs/guides/payments", priority: 0.6 },
    { path: "/docs/guides/customization", priority: 0.6 },
    { path: "/docs/guides/deployment", priority: 0.6 },
  ];

  return staticRoutes.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));
}
