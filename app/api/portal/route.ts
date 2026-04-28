import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, siteOrigin } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { getOrCreateCurrentUser } from "@/lib/users";

/** POST /api/portal — open the Stripe Customer Portal for the signed-in
 *  user. Body: { flow?: "cancel" | "manage" } (defaults to "manage").
 *
 *  When `flow === "cancel"`, we open Stripe's deep-linked cancel flow
 *  with after_completion=redirect, so the portal auto-returns to /app
 *  the instant the user confirms cancellation. Without this Stripe just
 *  sits on its cancel-confirmation page and the user has to click a
 *  "Return to Canvas Buddy" link manually.
 *
 *  When `flow === "manage"` we open the general portal (update payment
 *  method, see invoices, switch plan). No auto-redirect here — Stripe
 *  doesn't support it for the general portal.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { flow?: string } = {};
  try { body = await req.json(); } catch { /* ok */ }
  const flow = body.flow === "cancel" ? "cancel" : "manage";

  await getOrCreateCurrentUser();
  const supabase = getSupabase();

  const { data: userRow } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!userRow?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer on file — subscribe first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const returnUrl = `${siteOrigin(req)}/app?checkout=cancelled`;

  // For the cancel flow we need the active subscription id, fetched live
  // from Stripe (we don't store it in our DB).
  let flowData = undefined;
  if (flow === "cancel") {
    const subs = await stripe.subscriptions.list({
      customer: userRow.stripe_customer_id,
      status: "active",
      limit: 1,
    });
    const subId = subs.data[0]?.id;
    if (subId) {
      flowData = {
        type: "subscription_cancel" as const,
        subscription_cancel: { subscription: subId },
        after_completion: {
          type: "redirect" as const,
          redirect: { return_url: returnUrl },
        },
      };
    }
    // No active subscription found → fall through to general portal.
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: userRow.stripe_customer_id,
    return_url: returnUrl,
    flow_data: flowData,
  });

  return NextResponse.json({ url: session.url });
}
