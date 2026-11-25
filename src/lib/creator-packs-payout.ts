/** Flat creator share. Every website sale uses this rate. */

export const CREATOR_SHARE_PERCENT = 70;

export function creatorSharePence(salesPence: number): number {
  if (!Number.isFinite(salesPence) || salesPence <= 0) return 0;
  return Math.round((salesPence * CREATOR_SHARE_PERCENT) / 100);
}

export function splitSalePence(amountPence: number): {
  creatorPence: number;
  platformPence: number;
} {
  const amount = Number.isFinite(amountPence) && amountPence > 0 ? Math.round(amountPence) : 0;
  const creatorPence = Math.min(amount, creatorSharePence(amount));
  return { creatorPence, platformPence: amount - creatorPence };
}

export function formatSharePounds(pence: number): string {
  const safe = Number.isFinite(pence) && pence > 0 ? pence : 0;
  return `£${(safe / 100).toFixed(2)}`;
}
