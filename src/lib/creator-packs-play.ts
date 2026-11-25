/**
 * Google Play products for creator packs. Not on sale in the app yet.
 *
 * Package: uk.co.openinglab
 * The current app only sells the fixed drill-pack SKUs. Creator prices vary,
 * and Play requires a product for each price before a purchase can start.
 * The website can charge any approved price. The app can only sell a pack
 * whose final price is one of the tiers below.
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

export function creatorPenceForPlaySku(sku: string): number | null {
  const tier = CREATOR_PLAY_TIERS.find((row) => row.sku === sku);
  return tier ? tier.pence : null;
}
