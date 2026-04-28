import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, STRIPE_PRICE_IDS, siteOrigin } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { getOrCreateCurrentUser } from "@/lib/users";

/** POST /api/checkout/canvas — start a one-off $4.99 Checkout for the
 *  watermark-removal of a single canvas.
 *  Body: { canvasId: string }
 *  Returns: { url } — frontend redirects.
 *
 *  The webhook handler matches the resulting payment back to the canvas
 *  via session.metadata.canvas_id, re-renders without the watermark, and
 *  swaps the storage object so the next download is clean.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Debug: log what we see for STRIPE_PRICE_PER_CANVAS so we can tell
  // whether the env var is missing or just being misread.
  const directRead = process.env.STRIPE_PRICE_PER_CANVAS;
  const viaGetter = STRIPE_PRICE_IDS.perCanvas;
  console.log(
    `[checkout/canvas] env probe: ` +
    `direct=${JSON.stringify(directRead?.slice(0, 8))}…(len=${directRead?.length || 0}) ` +
    `getter=${JSON.stringify(viaGetter.slice(0, 8))}…(len=${viaGetter.length})`
  );
  if (!viaGetter) {
    return NextResponse.json(
      { error: "Per-canvas price not configured. Set STRIPE_PRICE_PER_CANVAS in env." },
      { status: 500 }
    );
  }

  let body: { canvasId?: string } = {};
  try { body = await req.json(); } catch { /* ok */ }
  if (!body.canvasId) {
    return NextResponse.json({ error: "Missing canvasId" }, { status: 400 });
  }

  await getOrCreateCurrentUser();
  const supabase = getSupabase();
  const stripe = getStripe();

  // Verify the canvas exists and is owned by this user before charging.
  const { data: canvas } = await supabase
    .from("canvases")
    .select("id, name, paid_one_off_id, output_storage_key, animation, filter, duration")
    .eq("id", body.canvasId)
    .eq("user_id", userId)
    .single();

  if (!canvas) {
    return NextResponse.json({ error: "Canvas not found." }, { status: 404 });
  }
  if (canvas.paid_one_off_id) {
    return NextResponse.json(
      { error: "This canvas is already unlocked." },
      { status: 409 }
    );
  }

  // Reuse the existing customer if we have one — keeps a single record per user.
  const { data: userRow } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .single();

  const origin = siteOrigin(req);
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: userRow?.stripe_customer_id || undefined,
      customer_email: userRow?.stripe_customer_id ? undefined : userRow?.email || undefined,
      line_items: [{ price: STRIPE_PRICE_IDS.perCanvas, quantity: 1 }],
      // The webhook keys off these to find the right canvas.
      metadata: {
        clerk_user_id: userId,
        canvas_id: canvas.id,
        canvas_name: canvas.name,
      },
      payment_intent_data: {
        metadata: {
          clerk_user_id: userId,
          canvas_id: canvas.id,
        },
      },
      success_url: `${origin}/app?unlock=success&canvas=${canvas.id}`,
      cancel_url: `${origin}/app?unlock=cancelled`,
      automatic_tax: { enabled: process.env.STRIPE_TAX_ENABLED === "true" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe API call failed.";
    console.error("[checkout/canvas] stripe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
