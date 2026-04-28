-- Canvas Buddy schema v1: users + canvases + one_time_purchases.
-- Subscriptions table comes in a later migration when Stripe is wired.
--
-- Auth model: Clerk owns identity. Each Clerk user_id is the primary key
-- in our `users` table. Server-side API routes verify the Clerk session,
-- then use the Supabase service-role key (which bypasses RLS) to read/write.
-- We don't use Supabase Auth or row-level security in this version because
-- enforcing user_id at the API layer is simpler and harder to get subtly
-- wrong than RLS-with-Clerk-jwt patterns.

create extension if not exists "pgcrypto";

create table if not exists users (
  id text primary key,                                -- clerk user id (e.g. "user_2abc...")
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'payg')),
  stripe_customer_id text,
  videos_used_this_period int not null default 0,
  ai_generations_used_this_period int not null default 0,
  period_resets_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists canvases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  name text not null default 'Untitled Canvas',
  source_storage_key text,                            -- supabase storage path for source image
  prompt text,                                         -- if AI-generated
  animation text not null,
  filter text not null default 'none',
  duration real not null default 6,
  output_storage_key text,                            -- supabase storage path for rendered MP4
  thumbnail_storage_key text,                         -- supabase storage path for thumbnail
  status text not null default 'pending' check (status in ('pending','rendering','done','failed')),
  error_message text,
  paid_one_off_id text,                               -- stripe payment_intent id, populated when user pays for clean download
  created_at timestamptz not null default now()
);

create index if not exists canvases_user_id_idx on canvases(user_id);
create index if not exists canvases_created_at_idx on canvases(created_at desc);

create table if not exists one_time_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  canvas_id uuid not null references canvases(id) on delete cascade,
  stripe_payment_intent text not null unique,
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  created_at timestamptz not null default now()
);

create index if not exists otp_user_id_idx on one_time_purchases(user_id);

-- Trigger to keep users.updated_at fresh.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();
