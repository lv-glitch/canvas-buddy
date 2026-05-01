// Sentry client-side init — runs in the browser. Loaded automatically by
// @sentry/nextjs from the project root. Fail-open when DSN is unset so dev
// builds don't break.
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    // Capture all errors. Low-traffic site for now.
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Don't ship request bodies / cookies — Stripe + Clerk handle PII for us.
    sendDefaultPii: false,
  });
}
