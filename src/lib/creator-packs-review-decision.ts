import { labelToPence } from "./creator-packs-review.ts";
import { firstPurchaseLink } from "./creator-packs-text.ts";

const MIN_REASON = 12;

export function reviewDecision(input: {
  action: string;
  finalPrice: string;
  suggestedPence: number;
  note: string;
}):
  | { ok: true; status: "live"; finalPence: number }
  | { ok: true; status: "returned"; note: string }
  | { ok: false; error: string } {
  if (input.action === "return") {
    const note = input.note.trim();
    if (note.length < MIN_REASON) {
      return { ok: false, error: "Write a short reason so the creator knows what to change." };
    }
    if (note.length > 500) {
      return { ok: false, error: "Keep the reason under 500 characters." };
    }
    const blocked = firstPurchaseLink([note]);
    if (blocked) return { ok: false, error: blocked };
    return { ok: true, status: "returned", note };
  }
  if (input.action !== "approve") {
    return { ok: false, error: "Choose approve or send back." };
  }
  const raw = input.finalPrice.trim();
  const pence = raw ? labelToPence(raw) : input.suggestedPence;
  if (pence === null || pence < 0) {
    return {
      ok: false,
      error: "Enter a price such as 2.50, or leave the field blank to keep the suggestion.",
    };
  }
  return { ok: true, status: "live", finalPence: pence };
}
