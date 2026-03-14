import { resolve } from "node:path";
import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Ensure Turbopack resolves the workspace root to this project
  turbopack: { root: resolve(".") },

  // Allow Whop CDN images (user profile pictures)
  images: {
    remotePatterns: [
      { hostname: "whop-cdn.com" },
      { hostname: "*.whop.com" },
      { hostname: "s3.us-east-2.amazonaws.com", pathname: "/assets.whop.com/**" },
    ],
  },

  // Security headers for all routes
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
