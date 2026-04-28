import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/generate-image — auth-gated proxy to canvas-maker's
 * /api/generate-image (Flux Pro 1.1 via fal.ai). Same proxy shape as
 * /api/render — Clerk auth here, X-Backend-Token added on the way out.
 *
 * Body is JSON (not multipart) because the AI generator only takes a
 * prompt + Turnstile token.
 */
const TOOL_API =
  process.env.NEXT_PUBLIC_TOOL_API || "http://localhost:3737";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.text();

  const upstream = await fetch(`${TOOL_API}/api/generate-image`, {
    method: "POST",
    headers: {
      "X-Backend-Token": process.env.BACKEND_TOKEN || "",
      "Content-Type": "application/json",
    },
    body,
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: text || `canvas-maker returned ${upstream.status}` },
      { status: upstream.status }
    );
  }

  // Stream the PNG back unchanged.
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Cache-Control": "no-store",
    },
  });
}
