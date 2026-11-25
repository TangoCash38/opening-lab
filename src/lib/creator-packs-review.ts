/** Price helpers for creator packs. Packs themselves live in Postgres. */

export const SUGGESTED_PACK_PRICES = ["£1.50", "£2.50", "£5.00"] as const;

export type PackReviewStatus = "review" | "live" | "returned";

export function formatPackPrice(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^free$/i.test(trimmed)) return "Free";
  const cleaned = trimmed.replace(/^£/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0 || value > 250) return null;
  return `£${value.toFixed(2)}`;
}

export function labelToPence(raw: string): number | null {
  const formatted = formatPackPrice(raw);
  if (!formatted) return null;
  if (formatted === "Free") return 0;
  const n = Number(formatted.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function formatPenceLabel(pence: number): string {
  if (!Number.isFinite(pence) || pence <= 0) return "Free";
  return `£${(pence / 100).toFixed(2)}`;
}
