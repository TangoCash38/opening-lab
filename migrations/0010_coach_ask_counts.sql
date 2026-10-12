-- Daily Ask the coach counters. The bucket is a hash, not an IP, user id, or question.
create table if not exists coach_ask_counts (
  bucket text primary key,
  day text not null,
  tier text not null,
  n integer not null
);
