-- Additive notice flags so webhook / session retries do not re-send mail.
-- One purchases row per user: track each pack and the first Lab+ welcome.

alter table purchases
  add column if not exists emailed_packs TEXT[] NOT NULL DEFAULT '{}';

alter table purchases
  add column if not exists labplus_emailed_at TIMESTAMPTZ;
