-- A short note when Opening Lab changes a pack during review.
-- The creator's own price stays in suggested_price_pence.

alter table creator_packs add column if not exists change_note text not null default '';
