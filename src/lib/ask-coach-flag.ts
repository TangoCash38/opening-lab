import { isPlayUserAgent, isPlayWrap } from "@/lib/play-app";
import { SCOTCH_PACK_ID } from "@/lib/scotch-coach";

/**
 * Scotch on the website only.
 * The Play app (user agent contains OpeningLabPlay) keeps the old trainer.
 * Other packs never pass. Set VITE_ASK_THE_COACH=0 in the client build and
 * ASK_THE_COACH=0 on the server to hide it. Unset means on.
 */
export function askTheCoachEnabled(packId: string, flag: string | undefined): boolean {
  if (packId !== SCOTCH_PACK_ID) return false;
  if (flag === "0" || flag === "false") return false;
  return true;
}

export function askTheCoachClientEnabled(packId: string): boolean {
  if (typeof window !== "undefined" && isPlayWrap()) return false;
  const flag = import.meta.env.VITE_ASK_THE_COACH;
  return askTheCoachEnabled(packId, typeof flag === "string" ? flag : undefined);
}

export function askTheCoachServerEnabled(userAgent?: string | null): boolean {
  if (isPlayUserAgent(userAgent ?? "")) return false;
  const flag = process.env.ASK_THE_COACH ?? process.env.VITE_ASK_THE_COACH;
  return askTheCoachEnabled(SCOTCH_PACK_ID, flag);
}
