import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { rerenderCanvasCleanWithRetry } from "@/lib/rerender";
import { sendEmail, welcomeToProEmail, watermarkRemovedEmail } from "@/lib/email";

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
        const canvasId = session.metadata?.canvas_id;
        // Log the entry so we can see what mode + metadata Stripe sent.
        // Critical for diagnosing "webhook delivered but DB unchanged" cases.
        console.log(
          `[webhook] checkout.session.completed: ` +
          `mode=${session.mode} ` +
          `userId=${userId || "(missing)"} ` +
          `canvasId=${canvasId || "(missing)"} ` +
          `customer=${session.customer || "(none)"}`
        );

        if (userId && session.mode === "subscription") {
          // Pro subscription completed → upgrade plan.
          await supabase
            .from("users")
            .update({
              plan: "pro",
              stripe_customer_id: (session.customer as string) ?? undefined,
            })
            .eq("id", userId);
          // Welcome email — fire-and-forget; failures must not break the webhook.
          const { data: u } = await supabase.from("users").select("email").eq("id", userId).single();
          if (u?.email) {
            const tmpl = welcomeToProEmail();
            void sendEmail({ to: u.email, subject: tmpl.subject, html: tmpl.html });
          }
        }

        if (userId && canvasId && session.mode === "payment") {
          // Per-canvas $4.99 unlock — record the payment, then re-render the
          // canvas without the watermark and swap the storage object. We do
          // this synchronously inside the webhook so that by the time the
          // user lands back on /app the clean copy is ready. ~5-8 seconds
          // of webhook processing is well within Stripe's 30s timeout.
          const paymentId =
            (session.payment_intent as string) || session.id;
          await supabase
            .from("canvases")
            .update({
              paid_one_off_id: paymentId,
              status: "rendering",
            })
            .eq("id", canvasId)
            .eq("user_id", userId);
          try {
            await rerenderCanvasCleanWithRetry(canvasId);
            // Confirmation email — fetch user email + canvas name for personalisation.
            const [{ data: u }, { data: c }] = await Promise.all([
              supabase.from("users").select("email").eq("id", userId).single(),
              supabase.from("canvases").select("name").eq("id", canvasId).single(),
            ]);
            if (u?.email) {
              const tmpl = watermarkRemovedEmail(c?.name || "Your canvas");
              void sendEmail({ to: u.email, subject: tmpl.subject, html: tmpl.html });
            }
          } catch (err) {
            // If the re-render fails, leave paid_one_off_id set (the user
            // paid) but mark the row failed so we can retry/refund. They
            // got watermark-free in the DB sense; the file's still bad.
            console.error(`[webhook] rerender failed for ${canvasId}:`, err);
            await supabase
              .from("canvases")
              .update({
                status: "failed",
                error_message:
                  err instanceof Error ? err.message : "Re-render failed",
              })
              .eq("id", canvasId);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = sub.metadata?.clerk_user_id;
        const isActive = sub.status === "active" || sub.status === "trialing";
        // current_period_end is on the subscription's first item per Stripe's
        // 2024 API change; some libraries still expose it on the root.
        // Try both to be resilient.
        const periodEndUnix =
          (sub as unknown as { current_period_end?: number }).current_period_end ??
          sub.items?.data?.[0]?.current_period_end ??
          null;
        if (userId) {
          await supabase
            .from("users")
            .update({
              plan: isActive ? "pro" : "free",
              subscription_current_period_end: periodEndUnix
                ? new Date(periodEndUnix * 1000).toISOString()
                : null,
              subscription_cancel_at_period_end: !!sub.cancel_at_period_end,
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = sub.metadata?.clerk_user_id;
        if (userId) {
          // Subscription is fully gone — clear lifecycle fields too.
          await supabase
            .from("users")
            .update({
              plan: "free",
              subscription_current_period_end: null,
              subscription_cancel_at_period_end: false,
            })
            .eq("id", userId);
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
