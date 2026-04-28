import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { getOrCreateCurrentUser } from "@/lib/users";

/** GET /api/canvases — list the current user's canvases (newest first). */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await getOrCreateCurrentUser();

  const { data, error } = await getSupabase()
    .from("canvases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ canvases: data });
}

/** POST /api/canvases — record a newly-rendered canvas in the user's library.
 *  Body: { name?, animation, filter, duration, prompt?, source_storage_key?,
 *          output_storage_key?, thumbnail_storage_key?, status? }
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await getOrCreateCurrentUser();

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const insert = {
    user_id: userId,
    name: typeof body.name === "string" ? body.name : "Canvas",
    animation: String(body.animation || "zoom"),
    filter: String(body.filter || "none"),
    duration: Number(body.duration) || 6,
    prompt: typeof body.prompt === "string" ? body.prompt : null,
    source_storage_key: typeof body.source_storage_key === "string" ? body.source_storage_key : null,
    output_storage_key: typeof body.output_storage_key === "string" ? body.output_storage_key : null,
    thumbnail_storage_key: typeof body.thumbnail_storage_key === "string" ? body.thumbnail_storage_key : null,
    status: ["pending","rendering","done","failed"].includes(String(body.status))
      ? (body.status as string) : "done",
  };

  const { data, error } = await getSupabase()
    .from("canvases").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment quota counter on the user row (best-effort — don't block on failure).
  try {
    await getSupabase().rpc("increment_videos_used", { uid: userId });
  } catch { /* counter drift on transient failure is acceptable */ }

  return NextResponse.json({ canvas: data }, { status: 201 });
}
