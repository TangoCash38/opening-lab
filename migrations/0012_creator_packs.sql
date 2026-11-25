-- Creator packs. Separate from the drill-pack unlock list so a creator id
-- cannot land in that list.
-- Better Auth user ids are TEXT. No bank columns live here.
-- channel 'play' is reserved for later Google Play sales. Those rows
-- stay unpaid (transferred_at null) until a monthly transfer.

create table if not exists creator_profiles (
  user_id text primary key,
  display_name text not null,
  bio text not null default '',
  stripe_account_id text,
  payouts_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists creator_profiles_stripe_account
  on creator_profiles (stripe_account_id)
  where stripe_account_id is not null;

create table if not exists creator_packs (
  id text primary key,
  creator_user_id text not null,
  name text not null,
  blurb text not null default '',
  status text not null,
  suggested_price_pence integer not null,
  final_price_pence integer,
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_packs_status_check check (status in ('review', 'live', 'returned')),
  constraint creator_packs_suggested_check check (
    suggested_price_pence >= 0 and suggested_price_pence <= 25000
  ),
  constraint creator_packs_final_check check (
    final_price_pence is null
    or (final_price_pence >= 0 and final_price_pence <= 25000)
  )
);

create index if not exists creator_packs_creator_idx
  on creator_packs (creator_user_id);

create index if not exists creator_packs_status_idx
  on creator_packs (status);

create table if not exists creator_pack_lines (
  id text primary key,
  pack_id text not null references creator_packs (id) on delete cascade,
  position integer not null,
  name text not null,
  mode text not null,
  fen text not null,
  plies text[] not null,
  comments text[] not null,
  constraint creator_pack_lines_mode_check check (mode in ('drill', 'walk')),
  constraint creator_pack_lines_position_unique unique (pack_id, position)
);

create table if not exists creator_sales (
  id text primary key,
  pack_id text not null references creator_packs (id),
  buyer_user_id text not null,
  channel text not null,
  amount_pence integer not null,
  currency text not null default 'gbp',
  creator_share_pence integer not null,
  platform_share_pence integer not null,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  constraint creator_sales_channel_check check (channel in ('web', 'play')),
  constraint creator_sales_amount_check check (amount_pence >= 0),
  constraint creator_sales_share_check check (
    creator_share_pence >= 0
    and platform_share_pence >= 0
    and creator_share_pence + platform_share_pence = amount_pence
  ),
  constraint creator_sales_buyer_pack_unique unique (buyer_user_id, pack_id)
);

create unique index if not exists creator_sales_checkout_unique
  on creator_sales (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table if not exists creator_pack_unlocks (
  buyer_user_id text not null,
  pack_id text not null references creator_packs (id),
  sale_id text,
  created_at timestamptz not null default now(),
  primary key (buyer_user_id, pack_id)
);
