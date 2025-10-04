import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't fail the production build on lint/TS errors
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Optional: silence <img> optimization warnings,
  // and/or allow external domains if you use remote images
  images: {
    unoptimized: true,
    // domains: ["replicate.delivery", "replicate.com"],
  },
};

export default nextConfig;
