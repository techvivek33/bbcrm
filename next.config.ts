import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions are enabled by default in Next 15
  },
  typescript: {
    // We keep types strict; flip to true only if a build-blocking type
    // issue needs to be deferred during a demo.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
