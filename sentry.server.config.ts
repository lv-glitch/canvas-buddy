// Sentry server-side init — runs in Node (Next.js server). Loaded
// automatically by @sentry/nextjs's instrumentation hook.
import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}
