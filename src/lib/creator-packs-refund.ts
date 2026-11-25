import { creatorSharePence } from "./creator-packs-payout.ts";

/**
 * How much of a destination-charge transfer to reverse after a refund.
 * The creator's share of the refunded amount, minus anything already reversed.
 * A full refund also ends the buyer's unlock.
 */
export function reversalForRefund(input: {
  saleAmountPence: number;
  creatorSharePence: number;
  alreadyReversedPence: number;
  amountRefundedPence: number;
}): { reversalPence: number; fullyRefunded: boolean } {
  const sale = Math.max(0, Math.round(input.saleAmountPence));
  const refunded = Math.min(sale, Math.max(0, Math.round(input.amountRefundedPence)));
  const creatorCap = Math.min(sale, Math.max(0, Math.round(input.creatorSharePence)));
  const target = Math.min(creatorCap, creatorSharePence(refunded));
  const already = Math.max(0, Math.round(input.alreadyReversedPence));
  return {
    reversalPence: Math.max(0, target - already),
    fullyRefunded: sale > 0 && refunded >= sale,
  };
}
