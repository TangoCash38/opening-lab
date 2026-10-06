-- Orthodox Exchange times sit beside the other Square Memory lines.
-- Does not delete existing rows.

alter table square_memory_scores drop constraint square_memory_scores_line_check;

alter table square_memory_scores
  add constraint square_memory_scores_line_check
  check (line in ('ruy', 'london', 'qg', 'orthodox'));
