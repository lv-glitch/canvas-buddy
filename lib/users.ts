import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabase, type UserRow } from "./supabase";
import { sendEmail, welcomeNewUserEmail } from "./email";

/**
 * Fetch the current user's row, creating it on first sign-in. Idempotent —
 * safe to call from every authed API route.
 *
 * Why this lives here instead of a Clerk webhook: webhooks add deploy
 * complexity (signature verification, retry handling, public endpoint) for
 * a one-time write. Lazy upsert from the API routes is simpler and the
 * volume is tiny — every authed request becomes one extra UPSERT, which
 * Postgres handles in <1ms with the primary-key index.
 */
export async function getOrCreateCurrentUser(): Promise<UserRow | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const sb = getSupabase();

  // Fast path: read.
  const { data: existing, error: readErr } = await sb
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (existing) return existing as UserRow;

  // Slow path: first sign-in — pull email from Clerk and insert.
  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    "";

  const { data: inserted, error: writeErr } = await sb
    .from("users")
    .insert({ id: userId, email, plan: "free" })
    .select()
    .single();
  if (writeErr) {
    // Race-condition fallback: if another concurrent request inserted first,
    // the unique violation re-fires the read. No welcome email here — the
    // other request fires it.
    if (writeErr.code === "23505") {
      const { data: re } = await sb
        .from("users").select("*").eq("id", userId).single();
      return re as UserRow;
    }
    throw writeErr;
  }

  // Brand-new user — fire the welcome email. Fire-and-forget; failures
  // never break signup.
  if (email) {
    console.log(`[welcome] sending to ${email} for user ${userId}`);
    const tmpl = welcomeNewUserEmail();
    void sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
  } else {
    console.log(`[welcome] skipped — no email yet for user ${userId}`);
  }
  return inserted as UserRow;
}

/** Backfill helper: patch a user's email if it was missing at first
 *  signup, and fire the welcome email then. Called by /api/me on every
 *  hit so a freshly-signed-up user picks up their welcome the moment
 *  Clerk's primary email becomes available. */
export async function backfillWelcomeEmailIfNeeded(
  user: UserRow
): Promise<UserRow> {
  if (user.email) return user;
  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    "";
  if (!email) return user;

  console.log(`[welcome] backfilling email for ${user.id} → ${email}`);
  const sb = getSupabase();
  const { data: updated } = await sb
    .from("users").update({ email }).eq("id", user.id).select().single();
  const tmpl = welcomeNewUserEmail();
  void sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
  return (updated as UserRow) || { ...user, email };
}

export const QUOTAS = {
  free:     { videos: 5, aiGenerations: 3 },
  payg:     { videos: Infinity, aiGenerations: 5 },
  pro:      { videos: Infinity, aiGenerations: Infinity },
  // Internal team accounts. Same limits as pro, but the separate tier
  // lets us filter internal users out of conversion analytics in
  // PostHog and Stripe revenue reports.
  internal: { videos: Infinity, aiGenerations: Infinity },
} as const;
