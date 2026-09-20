-- Mark entitlements granted via verified Google Play applyPurchase.
-- Token-save-only (Publisher API not connected) must not set this, so Stripe
-- website unlocks cannot leak into the Play wrap.
-- Additive only. Do not drop Stripe or play token columns.

alter table purchases
  add column if not exists play_billed BOOLEAN NOT NULL DEFAULT false;

-- Existing Lab+ yearly rows were Play-granted when a token is stored.
update purchases
  set play_billed = true
  where play_purchase_token is not null
    and plan = 'yearly'
    and play_billed = false;
