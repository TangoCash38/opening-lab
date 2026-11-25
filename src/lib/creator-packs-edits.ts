import { formatPenceLabel } from "./creator-packs-review.ts";

export type PackEditSnapshot = {
  name: string;
  blurb: string;
  pricePence: number;
  lines: { name: string; comments: string[] }[];
};

function commentsDiffer(before: string[], after: string[]): boolean {
  if (before.length !== after.length) return true;
  return before.some((comment, index) => comment !== after[index]);
}

/** Short note for the creator when Opening Lab changes a pack in review. */
export function describePackEdits(before: PackEditSnapshot, after: PackEditSnapshot): string {
  const content: string[] = [];
  if (before.name !== after.name) content.push("the title");
  if (before.blurb !== after.blurb) content.push("the description");
  const lines = before.lines.length === after.lines.length ? before.lines : [];
  if (lines.some((line, index) => line.name !== after.lines[index]?.name)) content.push("a line name");
  if (lines.some((line, index) => commentsDiffer(line.comments, after.lines[index]?.comments ?? []))) {
    content.push("a comment");
  }
  const priceChanged = before.pricePence !== after.pricePence;
  if (!priceChanged && content.length === 0) return "";
  const parts: string[] = [];
  if (priceChanged) {
    parts.push(
      `adjusted the price from ${formatPenceLabel(before.pricePence)} to ${formatPenceLabel(after.pricePence)}`,
    );
  }
  if (content.length > 0) parts.push(`edited ${content.join(" and ")}`);
  if (parts.length === 1) return `Opening Lab ${parts[0]}.`;
  return `Opening Lab ${parts[0]}, and ${parts[1]}.`;
}
