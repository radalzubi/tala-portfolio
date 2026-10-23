import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `next build` writes ./out, servable by any static host (`npx serve out`).
  output: "export",
  reactStrictMode: true,
  trailingSlash: false,
  images: {
    // Image derivatives are pre-built by scripts/build_media.py; no runtime optimiser.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
