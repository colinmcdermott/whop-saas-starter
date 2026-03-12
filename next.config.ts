import { dirname } from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Ensures build tracing is scoped to this project
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
