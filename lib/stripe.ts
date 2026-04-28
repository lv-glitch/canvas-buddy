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

/** Pricing IDs — set these from your Stripe dashboard once products exist. */
export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO || "",
  // One-time per-canvas watermark-removal price (Phase B — needs watermark
  // rendering work in canvas-maker before we can take money for it).
  perCanvas: process.env.STRIPE_PRICE_PER_CANVAS || "",
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
