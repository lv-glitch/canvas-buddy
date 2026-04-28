import { getSupabase, CANVASES_BUCKET, type CanvasRow } from "./supabase";

/**
 * Re-renders an existing canvas without the watermark and swaps the storage
 * object. Called by the Stripe webhook after a successful per-canvas
 * payment.
 *
 * Why we re-render instead of pre-rendering both versions: the watermark
 * burn-in happens at FFmpeg time (drawtext filter), so the only way to get
 * a clean copy is a fresh render. Costs an extra ~3-8 seconds of
 * canvas-maker compute, but the alternative (storing two MP4s for every
 * canvas in case someone might pay later) wastes storage on the 95% that
 * never get unlocked.
 *
 * Source-of-truth for the source image is the row's thumbnail_storage_key
 * (it's the original upload, used as both the library thumbnail and the
 * regen source). If a future feature lets users edit the source post-
 * generation, we'd need to track them separately.
 */
export async function rerenderCanvasClean(canvasId: string): Promise<void> {
  const supabase = getSupabase();
  const TOOL_API = process.env.NEXT_PUBLIC_TOOL_API || "https://api.canvasbuddy.io";

  const { data: row, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("id", canvasId)
    .single();
  if (error || !row) throw new Error(`Canvas ${canvasId} not found.`);
  const canvas = row as CanvasRow;

  if (!canvas.thumbnail_storage_key) {
    throw new Error(`Canvas ${canvasId} has no source image to re-render.`);
  }

  // Fetch the source image bytes from Storage.
  const { data: sourceBlob, error: dlErr } = await supabase
    .storage.from(CANVASES_BUCKET)
    .download(canvas.thumbnail_storage_key);
  if (dlErr || !sourceBlob) {
    throw new Error(`Failed to download source: ${dlErr?.message || "unknown"}`);
  }

  // Re-render via the canvas-maker backend, this time without watermark.
  const fd = new FormData();
  fd.append("image", sourceBlob, "source.jpg");
  fd.append("animation", canvas.animation);
  fd.append("filter", canvas.filter);
  fd.append("layout", "fill");
  fd.append("duration", String(canvas.duration));
  fd.append("watermark", "false");

  const renderRes = await fetch(`${TOOL_API}/api/generate`, {
    method: "POST",
    body: fd,
  });
  if (!renderRes.ok) {
    const errText = await renderRes.text().catch(() => "");
    throw new Error(`Re-render failed (HTTP ${renderRes.status}): ${errText}`);
  }
  const cleanMp4 = await renderRes.blob();

  // Upload the new MP4, replacing the watermarked one. Same storage key,
  // upsert=true. (Browser-side signed URLs cached on the user's device
  // will still hit the new content because Storage versions on the path,
  // and the user has to refresh the page anyway to see the unlocked state.)
  const newKey = canvas.output_storage_key || `${canvas.user_id}/${canvas.id}/canvas.mp4`;
  const { error: upErr } = await supabase
    .storage.from(CANVASES_BUCKET)
    .upload(newKey, cleanMp4, { contentType: "video/mp4", upsert: true });
  if (upErr) throw new Error(`Failed to upload clean MP4: ${upErr.message}`);

  // Update the row so output points at the (potentially new) key. Even when
  // the key is unchanged, the update bumps updated_at, useful for cache busting.
  await supabase
    .from("canvases")
    .update({
      output_storage_key: newKey,
      status: "done",
    })
    .eq("id", canvasId);
}
