import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe, STRIPE_PRICE_IDS, siteOrigin } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { getOrCreateCurrentUser } from "@/lib/users";

/** POST /api/checkout — start a Stripe Checkout session.
 *  Body: { tier: "pro" }
 *  Returns: { url } — frontend redirects to it.
 *
 *  The Pro subscription is the only flow wired up right now. Per-canvas
 *  one-time payments need the canvas-maker watermark + re-render path
 *  before they can ship.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { tier?: string } = {};
  try { body = await req.json(); } catch { /* ok */ }

  if (body.tier !== "pro") {
    return NextResponse.json(
      { error: "Only the 'pro' tier is supported right now." },
      { status: 400 }
    );
  }
  if (!STRIPE_PRICE_IDS.pro) {
    return NextResponse.json(
      { error: "Stripe price not configured. Set STRIPE_PRICE_PRO in env." },
      { status: 500 }
    );
  }

  await getOrCreateCurrentUser();
  const supabase = getSupabase();
  const stripe = getStripe();

  // Look up (or lazily create) the Stripe customer record for this user, so
  // the subscription is tied to a single customer across renewals.
  const { data: userRow } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .single();

  let customerId = userRow?.stripe_customer_id ?? null;
  if (!customerId) {
    const clerkUser = await currentUser();
    const email =
      userRow?.email ||
      clerkUser?.emailAddresses[0]?.emailAddress ||
      undefined;
    const customer = await stripe.customers.create({
      email,
      metadata: { clerk_user_id: userId },
    });
    customerId = customer.id;
    await supabase.from("users").update({ stripe_customer_id: customerId }).eq("id", userId);
  }

  const origin = siteOrigin(req);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: STRIPE_PRICE_IDS.pro, quantity: 1 }],
    // metadata flows to the webhook so we can match the subscription back to
    // the Clerk user without relying on the customer email.
    metadata: { clerk_user_id: userId },
    subscription_data: { metadata: { clerk_user_id: userId } },
    success_url: `${origin}/app?checkout=success`,
    cancel_url: `${origin}/app?checkout=cancelled`,
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
