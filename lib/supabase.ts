import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client. Uses the service-role key, which bypasses
 * row-level security. SAFE because:
 *   1. This module is server-only (never bundled to the client — would leak
 *      the service key). Verified by the lib/supabase.ts importing only from
 *      server components, route handlers, and server actions.
 *   2. Every API route that uses it already gates on Clerk's `auth()` and
 *      enforces user_id scoping in the query.
 *
 * Do NOT use this in a client component. If you need to call Supabase from
 * the browser, write an API route that wraps the operation.
 */

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }

  _client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

/** Row shape of the canvases table — keep in sync with supabase/migrations/001_init.sql */
export interface CanvasRow {
  id: string;
  user_id: string;
  name: string;
  source_storage_key: string | null;
  prompt: string | null;
  animation: string;
  filter: string;
  duration: number;
  output_storage_key: string | null;
  thumbnail_storage_key: string | null;
  status: "pending" | "rendering" | "done" | "failed";
  error_message: string | null;
  paid_one_off_id: string | null;
  created_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  plan: "free" | "pro" | "payg";
  stripe_customer_id: string | null;
  videos_used_this_period: number;
  ai_generations_used_this_period: number;
  period_resets_at: string;
  created_at: string;
  updated_at: string;
}
