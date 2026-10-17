import blurbs from "@/data/line-welcome-blurbs.json";
import type { Lang } from "@/lib/i18n";

const COPY = blurbs as Record<string, Partial<Record<Lang, string>>>;

/** Two or three sentences about this line, in the active language. */
export function lineWelcomeBlurb(lineId: string, lang: Lang): string {
  const row = COPY[lineId];
  if (!row) return "";
  return row[lang] || row.en || "";
}
