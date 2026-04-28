-- Track subscription lifecycle so the UI can show "Pro · ends Apr 28"
-- instead of just "Pro · unlimited" once a user has cancelled but not
-- yet hit the period end. Webhook handler keeps these in sync from
-- customer.subscription.updated and customer.subscription.deleted events.

alter table users
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_cancel_at_period_end boolean default false;
