import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

/** POST /api/stripe/webhook — Stripe webhook handler.
 *
 *  Events we care about (Phase A):
 *    - checkout.session.completed       → confirm subscription, set plan='pro'
 *    - customer.subscription.updated    → re-sync plan/status
 *    - customer.subscription.deleted    → revert plan to 'free' on cancel
 *
 *  Stripe signs every request with the webhook secret — we verify the
 *  signature before doing anything stateful.
 *
 *  Set STRIPE_WEBHOOK_SECRET via fly secrets, and point the webhook
 *  endpoint at https://canvasbuddy.io/api/stripe/webhook in the Stripe
 *  dashboard.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook misconfigured." }, { status: 500 });
  }

  const stripe = getStripe();
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.clerk_user_id;
        if (userId && session.mode === "subscription") {
          await supabase
            .from("users")
            .update({
              plan: "pro",
              stripe_customer_id: (session.customer as string) ?? undefined,
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = sub.metadata?.clerk_user_id;
        const isActive = sub.status === "active" || sub.status === "trialing";
        if (userId) {
          await supabase
            .from("users")
            .update({ plan: isActive ? "pro" : "free" })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = sub.metadata?.clerk_user_id;
        if (userId) {
          await supabase.from("users").update({ plan: "free" }).eq("id", userId);
        }
        break;
      }

      default:
        // Ignore — Stripe sends a lot of event types we don't care about.
        break;
    }
  } catch (err) {
    // Return 500 so Stripe retries with backoff. Logging only — don't leak
    // internals to the wider internet.
    console.error("[stripe webhook] handler failed:", err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
