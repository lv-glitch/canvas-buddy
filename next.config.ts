import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Standalone output bundles the minimal Node server + traced deps into
  // .next/standalone, which our Dockerfile copies as the production runtime.
  // Drops the production image size by ~80%.
  output: "standalone",
};

// Wrap with Sentry — uploads source maps so production stack traces are
// readable. Both org/project and auth token only matter at build time;
// missing values just disable the upload step (runtime SDK still works).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Hide source maps from end users — they're uploaded to Sentry, not served.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Quiet output during build unless we're debugging.
  silent: !process.env.CI,
  // Note: automaticVercelMonitors moved to webpack.automaticVercelMonitors
  // in newer @sentry/nextjs; we leave it default-off (we don't use Vercel).
  // Tunnel browser → Sentry through our origin so ad-blockers don't drop events.
  tunnelRoute: "/monitoring",
});
