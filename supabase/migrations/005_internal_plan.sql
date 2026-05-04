-- Add an 'internal' plan tier for the team — unlimited renders + AI gen,
-- separate from 'pro' so paid Pro signups in PostHog/Stripe analytics
-- aren't polluted by internal usage.
--
-- Set a user to internal via:
--   update users set plan = 'internal' where email = 'name@fiftyfive.music';

alter table users
  drop constraint if exists users_plan_check;

alter table users
  add constraint users_plan_check
  check (plan in ('free', 'pro', 'payg', 'internal'));
