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

  // For the cancel flow we need an active subscription id. If the user
  // already scheduled the sub to cancel — via cancel_at_period_end OR a
  // specific cancel_at timestamp — Stripe will reject the cancel flow.
  // Try it first, fall back to the general portal on rejection so the
  // user can reactivate or do other things.
  async function createSession(useCancelFlow: boolean) {
    let flowData = undefined;
    if (useCancelFlow) {
      const subs = await stripe.subscriptions.list({
        customer: userRow!.stripe_customer_id!,
        status: "active",
        limit: 1,
      });
      const sub = subs.data[0];
      if (sub) {
        flowData = {
          type: "subscription_cancel" as const,
          subscription_cancel: { subscription: sub.id },
          after_completion: {
            type: "redirect" as const,
            redirect: { return_url: returnUrl },
          },
        };
      }
    }
    return stripe.billingPortal.sessions.create({
      customer: userRow!.stripe_customer_id!,
      return_url: returnUrl,
      flow_data: flowData,
    });
  }

  let session;
  try {
    session = await createSession(flow === "cancel");
  } catch (err) {
    // Most common reason: the subscription is already scheduled to
    // cancel, so Stripe refuses to re-open the cancel flow. Retry as
    // the general portal — same surface, but no flow_data, so it just
    // shows the customer's full self-serve UI.
    const msg = err instanceof Error ? err.message : "";
    if (flow === "cancel" && /already set to be canceled/i.test(msg)) {
      console.log("[portal] cancel flow rejected — falling back to general portal");
      session = await createSession(false);
    } else {
      console.error("[portal] stripe error:", msg);
      return NextResponse.json({ error: msg || "Stripe API call failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ url: session.url });
}
