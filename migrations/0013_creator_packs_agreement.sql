-- Agreement acceptance, refund bookkeeping, and later Play sales.
-- Bank details stay on Stripe. Play tokens are not stored.

alter table creator_profiles add column if not exists agreement_version text;
alter table creator_profiles add column if not exists agreement_accepted_at timestamptz;

alter table creator_sales add column if not exists refunded_pence integer not null default 0;
alter table creator_sales add column if not exists reversed_pence integer not null default 0;
alter table creator_sales add column if not exists refunded_at timestamptz;
alter table creator_sales add column if not exists disputed_at timestamptz;
alter table creator_sales add column if not exists play_order_id text;
alter table creator_sales add column if not exists play_product_id text;

create unique index if not exists creator_sales_play_order_unique
  on creator_sales (play_order_id)
  where play_order_id is not null;
