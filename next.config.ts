import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles the minimal Node server + tracedyp deps into
  // .next/standalone, which our Dockerfile copies as the production runtime.
  // Drops the production image size by ~80%.
  output: "standalone",
};

export default nextConfig;
