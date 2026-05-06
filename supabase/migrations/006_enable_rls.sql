-- Enable RLS on every user-data table. With RLS on and no policies
-- attached, both `anon` and `authenticated` Postgres roles are denied
-- by default — only the service role bypasses it, which is what every
-- API route in this app uses anyway. (See 001_init.sql for the auth
-- model rationale.)
--
-- Without this, anyone who scraped the project's anon key off the
-- internet could hit Supabase's PostgREST endpoint and read/write the
-- tables directly. Supabase's "table is publicly accessible" email
-- warning is exactly this.

alter table users               enable row level security;
alter table canvases            enable row level security;
alter table one_time_purchases  enable row level security;

-- No policies created — that means every non-service-role caller is
-- denied for all operations. If we ever introduce browser-direct
-- queries (e.g. via the Supabase JS client with a Clerk JWT), policies
-- would go here scoped by `auth.uid()` or a Clerk claim.

-- The storage bucket `canvases` is already private (public=false in
-- 003_storage.sql) and access is via service-role uploads + signed
-- URLs, so storage doesn't need separate RLS work here.
