import Stripe from "stripe";

/**
 * Server-side Stripe client. Lazy-initialised so missing keys don't crash
 * the boot — endpoints that need it throw at request time with a clear error.
 *
 * NEVER import from a client component; the secret key would leak into the
 * browser bundle. All Stripe operations live behind /api routes.
 */

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY missing. Set it via `fly secrets set STRIPE_SECRET_KEY=…`."
    );
  }
  _client = new Stripe(key);
  return _client;
}

/** Pricing IDs — read from env per-call so `fly secrets set` takes effect
 *  on the next request without requiring a fresh build/deploy. (Reading
 *  process.env once at module load would let Next.js inline empty strings
 *  at build time when the var isn't set yet.) */
export const STRIPE_PRICE_IDS = {
  get pro() { return process.env.STRIPE_PRICE_PRO || ""; },
  get perCanvas() { return process.env.STRIPE_PRICE_PER_CANVAS || ""; },
};

/** Origin for Checkout return URLs. Override locally with NEXT_PUBLIC_SITE_URL. */
export function siteOrigin(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv;
  // Fall back to the inbound request origin so Checkout redirects back to
  // wherever the user actually was — handles preview deploys cleanly.
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
