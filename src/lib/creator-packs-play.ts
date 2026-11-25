/**
 * Google Play products for creator packs. Not on sale in the app yet.
 *
 * Package: uk.co.openinglab
 * The current app only sells the fixed drill-pack SKUs. Creator prices vary,
 * and Play requires a product for each price before a purchase can start.
 * The website charges the price the creator set, after review.
 * The app can only charge a fixed Play price, so a sale there uses the
 * nearest tier. Say that on the price step.
 *
 * Later, in Play Console, create one one-time product per tier, priced in
 * GBP at that amount. Product ids use [a-z0-9._] only.
 * The app should call buy with that product id, then POST
 * /api/creator-packs/play with the pack id, product id, and purchase token.
 * The server verifies the token with Google before it records a channel
 * 'play' sale. Nothing is recorded if verification is missing.
 * Those sales stay unpaid (transferred_at null) for the monthly report.
 */

export const CREATOR_PLAY_PACKAGE = "uk.co.openinglab";

export const CREATOR_PLAY_TIERS = [
  { pence: 150, sku: "creator_pack_150", label: "£1.50" },
  { pence: 199, sku: "creator_pack_199", label: "£1.99" },
  { pence: 250, sku: "creator_pack_250", label: "£2.50" },
  { pence: 300, sku: "creator_pack_300", label: "£3.00" },
  { pence: 500, sku: "creator_pack_500", label: "£5.00" },
  { pence: 1000, sku: "creator_pack_1000", label: "£10.00" },
] as const;

export function playSkuForCreatorPence(pence: number): string | null {
  const tier = CREATOR_PLAY_TIERS.find((row) => row.pence === pence);
  return tier ? tier.sku : null;
}

export function nearestPlayTier(pence: number): ((typeof CREATOR_PLAY_TIERS)[number] & { exact: boolean }) | null {
  if (!Number.isFinite(pence) || pence <= 0) return null;
  let best: (typeof CREATOR_PLAY_TIERS)[number] = CREATOR_PLAY_TIERS[0];
  let bestDiff = Math.abs(pence - best.pence);
  for (const tier of CREATOR_PLAY_TIERS) {
    const diff = Math.abs(pence - tier.pence);
    if (diff < bestDiff || (diff === bestDiff && tier.pence < best.pence)) {
      best = tier;
      bestDiff = diff;
    }
  }
  return { ...best, exact: bestDiff === 0 };
}

export function creatorPenceForPlaySku(sku: string): number | null {
  const tier = CREATOR_PLAY_TIERS.find((row) => row.sku === sku);
  return tier ? tier.pence : null;
}
