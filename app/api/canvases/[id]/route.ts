import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase, CANVASES_BUCKET } from "@/lib/supabase";

/** DELETE /api/canvases/:id — remove from the user's library, plus the
 *  associated objects in the canvases storage bucket. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = getSupabase();

  // Look up storage keys before deleting the row so we can clean up storage too.
  // Scoped by user_id so a guessed UUID for someone else's canvas finds nothing.
  const { data: row } = await supabase
    .from("canvases")
    .select("output_storage_key, thumbnail_storage_key")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort storage cleanup. Storage failures don't unfail the DB delete —
  // an orphaned object is cheaper than a zombie row.
  const keys = [row?.output_storage_key, row?.thumbnail_storage_key].filter(
    (k): k is string => !!k
  );
  if (keys.length) {
    try { await supabase.storage.from(CANVASES_BUCKET).remove(keys); }
    catch { /* ignore */ }
  }

  return NextResponse.json({ ok: true });
}
