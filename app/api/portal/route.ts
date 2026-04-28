import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, siteOrigin } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { getOrCreateCurrentUser } from "@/lib/users";

/** POST /api/portal — open the Stripe Customer Portal for the signed-in
 *  user, where they can update payment method, cancel, see invoices.
 *  Returns: { url } — frontend redirects to it.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const session = await getStripe().billingPortal.sessions.create({
    customer: userRow.stripe_customer_id,
    return_url: `${siteOrigin(req)}/app`,
  });

  return NextResponse.json({ url: session.url });
}
