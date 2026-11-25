/** How many packs one creator may submit in an hour. */
export const CREATOR_SUBMIT_LIMIT = 8;

export function submitIsLimited(recentCount: number): boolean {
  if (!Number.isFinite(recentCount)) return false;
  return recentCount >= CREATOR_SUBMIT_LIMIT;
}
