-- Per-user pack and Lab+ unlocks. Better Auth user ids are TEXT, not UUID.
-- Scope every query by user_id. Never shrink packs on update.

create table if not exists purchases (
  user_id TEXT PRIMARY KEY,
  packs TEXT[] NOT NULL DEFAULT '{}',
  plan TEXT,
  expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  constraint purchases_plan_check check (plan is null or plan in ('monthly', 'yearly'))
);
