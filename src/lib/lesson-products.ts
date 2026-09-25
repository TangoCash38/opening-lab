import { PRICE_LESSON_SCOTCH, priceToPence } from "@/data/pricing";

/** Website lesson unlock. Not a drill-pack id and not a Play SKU. */
export const LESSON_SCOTCH_PRODUCT_ID = "lesson-scotch";

export const LESSON_PRODUCT_IDS = [LESSON_SCOTCH_PRODUCT_ID] as const;

export function isLessonProductId(id: string): boolean {
  return (LESSON_PRODUCT_IDS as readonly string[]).includes(id);
}

export function lessonCheckout(
  productId: string,
): { id: string; name: string; pence: number } | null {
  if (!isLessonProductId(productId)) return null;
  const pence = priceToPence(PRICE_LESSON_SCOTCH);
  if (!pence) return null;
  return { id: LESSON_SCOTCH_PRODUCT_ID, name: "Scotch Gambit lessons", pence };
}

/** Only lesson pages may override the Stripe return path. */
export function lessonCheckoutReturnPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!/^\/lessons(?:\/[A-Za-z0-9_-]+){0,3}$/.test(value)) return "/";
  return value;
}
