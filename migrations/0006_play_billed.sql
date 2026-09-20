-- Mark entitlements granted via verified Google Play applyPurchase (Path B).
-- Token-save-only (Publisher API not connected) must not set this, so Stripe
-- website unlocks cannot leak into the Play wrap.
-- Additive only. Do not drop Stripe or play token columns.
-- No Lab+ backfill — Path B grants are packs / buy_all only.

alter table purchases
  add column if not exists play_billed BOOLEAN NOT NULL DEFAULT false;
