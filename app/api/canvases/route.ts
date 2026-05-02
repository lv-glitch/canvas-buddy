import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase, signedCanvasUrl, CANVASES_BUCKET } from "@/lib/supabase";
import { getOrCreateCurrentUser, QUOTAS } from "@/lib/users";

/** GET /api/canvases — list the current user's canvases (newest first), with
 *  short-lived signed URLs for the MP4 and thumbnail. */
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

  // Resolve storage keys → signed URLs for the browser. Failures degrade to
  // null (UI shows the placeholder) rather than 500'ing the whole list.
  const rows = await Promise.all(
    (data ?? []).map(async (r) => ({
      ...r,
      videoURL: await signedCanvasUrl(r.output_storage_key),
      thumbnailURL: await signedCanvasUrl(r.thumbnail_storage_key),
    }))
  );

  return NextResponse.json({ canvases: rows });
}

/** POST /api/canvases — accepts multipart/form-data with `video` (mp4) and
 *  optional `thumbnail` (image), uploads them to Supabase Storage, then
 *  inserts the metadata row. Returns the row with signed URLs ready to use.
 *
 *  Falls back to JSON-only behaviour (metadata, no upload) when the request
 *  is application/json — useful for legacy callers and for failure cases
 *  where the user still wants to record the attempt.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Defense-in-depth quota cap. The render proxy /api/render also blocks
  // over-quota users before doing the expensive render, but a determined
  // caller could try to save directly here without going through render.
  // Refuse so the library can never grow past the plan's videos limit.
  const limit = QUOTAS[user.plan];
  if (limit.videos !== Infinity && user.videos_used_this_period >= limit.videos) {
    return NextResponse.json(
      {
        error: "You've used all 5 free renders. Pay $4.99 per canvas or upgrade to Pro for unlimited.",
        code: "quota_exceeded",
      },
      { status: 402 }
    );
  }

  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  let metadata: Record<string, unknown> = {};
  let videoFile: File | null = null;
  let thumbnailFile: File | null = null;

  if (isMultipart) {
    const form = await req.formData();
    const meta = form.get("metadata");
    if (typeof meta === "string") {
      try { metadata = JSON.parse(meta); } catch { /* keep empty */ }
    }
    const v = form.get("video");
    const t = form.get("thumbnail");
    if (v instanceof File) videoFile = v;
    if (t instanceof File) thumbnailFile = t;
  } else {
    try { metadata = await req.json(); } catch { /* empty body is fine */ }
  }

  // First insert with empty storage keys so we have an id to scope the upload
  // path. (`<userId>/<canvasId>/...` keeps things tidy and lets us later
  // delete-by-prefix when removing a row.)
  const insert = {
    user_id: userId,
    name: typeof metadata.name === "string" ? metadata.name : "Canvas",
    animation: String(metadata.animation || "zoom"),
    filter: String(metadata.filter || "none"),
    duration: Number(metadata.duration) || 6,
    prompt: typeof metadata.prompt === "string" ? metadata.prompt : null,
    status: ["pending", "rendering", "done", "failed"].includes(String(metadata.status))
      ? (metadata.status as string) : "done",
  };

  const supabase = getSupabase();
  const { data: row, error: insertErr } = await supabase
    .from("canvases").insert(insert).select().single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Upload files (if provided) into storage scoped under the new row id.
  let videoKey: string | null = null;
  let thumbKey: string | null = null;

  if (videoFile) {
    const key = `${userId}/${row.id}/canvas.mp4`;
    const { error } = await supabase.storage
      .from(CANVASES_BUCKET)
      .upload(key, videoFile, { contentType: videoFile.type || "video/mp4", upsert: true });
    if (!error) videoKey = key;
  }
  if (thumbnailFile) {
    const ext = thumbnailFile.type === "image/png" ? "png" : "jpg";
    const key = `${userId}/${row.id}/thumb.${ext}`;
    const { error } = await supabase.storage
      .from(CANVASES_BUCKET)
      .upload(key, thumbnailFile, {
        contentType: thumbnailFile.type || "image/jpeg",
        upsert: true,
      });
    if (!error) thumbKey = key;
  }

  // Patch the row with whatever uploads succeeded.
  if (videoKey || thumbKey) {
    await supabase.from("canvases").update({
      output_storage_key: videoKey,
      thumbnail_storage_key: thumbKey,
    }).eq("id", row.id);
  }

  // Increment the quota counter (best-effort).
  try {
    await supabase.rpc("increment_videos_used", { uid: userId });
  } catch { /* counter drift on transient failure is acceptable */ }

  return NextResponse.json(
    {
      canvas: {
        ...row,
        output_storage_key: videoKey,
        thumbnail_storage_key: thumbKey,
        videoURL: await signedCanvasUrl(videoKey),
        thumbnailURL: await signedCanvasUrl(thumbKey),
      },
    },
    { status: 201 }
  );
}
