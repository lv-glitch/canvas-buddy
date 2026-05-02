import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser, QUOTAS } from "@/lib/users";

/**
 * POST /api/render — auth-gated proxy to canvas-maker's /api/generate.
 *
 * Why a proxy: two abuse vectors closed by routing renders through here:
 *
 *  1. **Quota cap**: free tier is 5 renders. The frontend already disables
 *     Generate at the cap, but a determined user could call canvas-maker
 *     directly. We refuse here based on server-determined plan + counter.
 *
 *  2. **Watermark forge**: previously the frontend told canvas-maker
 *     `watermark=false` for Pro users. A client could fake `plan=pro` and
 *     get clean renders for free. Now the watermark flag is set here
 *     based on the user's real plan from Supabase — the client has no
 *     say in it.
 *
 * Streams the MP4 bytes back unchanged so the frontend's preview swap
 * still works.
 */
const TOOL_API =
  process.env.NEXT_PUBLIC_TOOL_API || "http://localhost:3737";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Quota check — free plan is capped. payg/pro are unlimited.
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

  // Server-determined watermark: only Pro and per-canvas-paid renders are
  // clean. Free / payg-without-canvas-paid get the brand mark. The actual
  // per-canvas unlock re-render runs from the Stripe webhook, not this
  // route — so anything routed through here that's not Pro gets watermarked.
  const watermark = user.plan === "pro" ? "false" : "true";

  // Pull the multipart body, replace whatever `watermark` field the
  // client sent with our authoritative one, then forward.
  const incoming = await req.formData();
  const outgoing = new FormData();
  for (const [key, value] of incoming.entries()) {
    if (key === "watermark") continue; // drop client's claim
    outgoing.append(key, value);
  }
  outgoing.append("watermark", watermark);

  const upstream = await fetch(`${TOOL_API}/api/generate`, {
    method: "POST",
    headers: {
      "X-Backend-Token": process.env.BACKEND_TOKEN || "",
    },
    body: outgoing,
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: text || `canvas-maker returned ${upstream.status}` },
      { status: upstream.status }
    );
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "video/mp4",
      "Cache-Control": "no-store",
    },
  });
}
