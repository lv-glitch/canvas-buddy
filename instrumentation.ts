// Next.js instrumentation hook — runs once per server runtime startup.
// Picks up the right Sentry config for whatever runtime this is (node /
// edge). The client config loads via sentry.client.config.ts directly.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
