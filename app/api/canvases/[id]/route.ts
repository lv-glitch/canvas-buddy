import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase, CANVASES_BUCKET } from "@/lib/supabase";

/** PATCH /api/canvases/:id — update editable fields on a canvas. Only `name`
 *  is exposed for now; rendering parameters (animation/filter/duration) are
 *  immutable post-render — to change those, generate a new canvas.
 *  Body: { name: string }
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: { name?: unknown } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name required." }, { status: 400 });
  if (name.length > 80) {
    return NextResponse.json({ error: "Name too long (max 80 chars)." }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("canvases")
    .update({ name })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, name")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Canvas not found." },
      { status: 404 }
    );
  }
  return NextResponse.json({ canvas: data });
}

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
