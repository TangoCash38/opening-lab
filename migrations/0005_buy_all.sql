-- Allow one-time Buy all packs entitlement (plan = buy_all).
-- Additive only. Do not shrink packs or drop Lab+ values.

alter table purchases drop constraint if exists purchases_plan_check;
alter table purchases add constraint purchases_plan_check
  check (plan is null or plan in ('monthly', 'yearly', 'buy_all'));
