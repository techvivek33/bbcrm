import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow larger spreadsheet uploads through the bulk-import server action.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  typescript: {
    // We keep types strict; flip to true only if a build-blocking type
    // issue needs to be deferred during a demo.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
