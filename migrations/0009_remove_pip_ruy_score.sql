-- Remove the one fake Pip time from the Ruy Lopez board.
-- 20.5 seconds is 20574 ms. No other name, line, or time is touched.

delete from square_memory_scores
where line = 'ruy'
  and name_key = 'pip'
  and name = 'Pip'
  and ms = 20574;
