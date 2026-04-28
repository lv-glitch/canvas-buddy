import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser, QUOTAS } from "@/lib/users";

/** GET /api/me — return the current user with computed quota state.
 *  Used by the app's TopNav to show "X of Y videos remaining". */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const limit = QUOTAS[user.plan];
  const videosRemaining = limit.videos === Infinity ? -1
    : Math.max(0, limit.videos - user.videos_used_this_period);
  const aiRemaining = limit.aiGenerations === Infinity ? -1
    : Math.max(0, limit.aiGenerations - user.ai_generations_used_this_period);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      videosUsed: user.videos_used_this_period,
      aiGenerationsUsed: user.ai_generations_used_this_period,
      periodResetsAt: user.period_resets_at,
    },
    quota: {
      videosLimit: limit.videos === Infinity ? null : limit.videos,
      videosRemaining,
      aiGenerationsLimit: limit.aiGenerations === Infinity ? null : limit.aiGenerations,
      aiGenerationsRemaining: aiRemaining,
    },
  });
}
