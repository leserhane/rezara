import type { NextConfig } from "next";

/**
 * Static export: this site is committed as pre-built HTML to the repo root
 * and served by GitHub Pages (no server, no ISR, no API routes) — same
 * deployment pattern already used for /frontend -> /dashboard in this repo.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
