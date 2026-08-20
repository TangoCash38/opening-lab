-- Play Billing Lab+ yearly token/order for idempotency.
-- Additive only. Do not drop Stripe columns.

alter table purchases
  add column if not exists play_purchase_token TEXT;

alter table purchases
  add column if not exists play_order_id TEXT;
