-- Shared Square Memory times. One best per name on each opening.
-- Neon on the live site (DATABASE_URL). Not a browser-only board.

create table if not exists square_memory_scores (
  line text not null,
  name_key text not null,
  name text not null,
  ms integer not null,
  created_at timestamptz not null default now(),
  primary key (line, name_key),
  constraint square_memory_scores_line_check check (line in ('ruy', 'london')),
  constraint square_memory_scores_ms_check check (ms > 0),
  constraint square_memory_scores_name_check check (char_length(name) between 1 and 16)
);

create index if not exists square_memory_scores_line_ms
  on square_memory_scores (line, ms);
