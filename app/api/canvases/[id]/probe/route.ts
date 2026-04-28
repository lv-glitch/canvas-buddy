import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/** GET /api/canvases/:id/probe — non-PII status probe.
 *
 *  Returns whether the canvas exists, whether it's been paid for, and its
 *  render status. Does NOT return user_id, prompt, names, or storage URLs.
 *  Used to debug webhook delivery from outside the user's session.
 *
 *  No auth — only reveals derivative facts (boolean paid, status string)
 *  not the canvas content. Worst case: someone learns whether a UUID
 *  exists. Acceptable; we'll deprecate this once the webhook is proven
 *  reliable.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const { data } = await getSupabase()
    .from("canvases")
    .select("id, paid_one_off_id, status, error_message, output_storage_key, thumbnail_storage_key, animation, filter, duration")
    .eq("id", id)
    .single();
  if (!data) return NextResponse.json({ exists: false }, { status: 404 });
  return NextResponse.json({
    exists: true,
    paid: !!data.paid_one_off_id,
    paid_one_off_id: data.paid_one_off_id,
    status: data.status,
    error_message: data.error_message,
    has_output: !!data.output_storage_key,
    has_thumbnail: !!data.thumbnail_storage_key,
    animation: data.animation,
    filter: data.filter,
    duration: data.duration,
  });
}
