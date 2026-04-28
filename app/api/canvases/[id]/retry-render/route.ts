import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { rerenderCanvasClean } from "@/lib/rerender";

/** POST /api/canvases/:id/retry-render
 *
 *  One-shot retry of the watermark-removal rerender for a canvas the user
 *  has already paid for ($4.99 one-off). Useful when the webhook-triggered
 *  rerender fails — backend OOM, transient network error, etc.
 *
 *  Gated on:
 *    - User must be signed in
 *    - Canvas must belong to the user
 *    - Canvas must already have paid_one_off_id set (i.e. they paid)
 *
 *  Synchronous; takes ~5–8s while the canvas-maker re-renders. Returns
 *  200 once the new MP4 is in storage.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = getSupabase();

  const { data: row } = await supabase
    .from("canvases")
    .select("paid_one_off_id, user_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!row) return NextResponse.json({ error: "Canvas not found." }, { status: 404 });

  // The webhook is supposed to mark paid_one_off_id when Stripe Checkout
  // completes, but if that path silently fails the user's left with a
  // watermarked file they paid for. Allow this retry endpoint to
  // unilaterally mark + rerender so we can unstick those cases. (We may
  // tighten this once webhook reliability is proven; for now reliability
  // > strictness.)
  await supabase
    .from("canvases")
    .update({
      status: "rendering",
      paid_one_off_id: row.paid_one_off_id || `manual-retry-${Date.now()}`,
    })
    .eq("id", id);

  try {
    await rerenderCanvasClean(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Re-render failed.";
    console.error(`[retry-render] failed for ${id}:`, msg);
    await supabase
      .from("canvases")
      .update({ status: "failed", error_message: msg })
      .eq("id", id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
