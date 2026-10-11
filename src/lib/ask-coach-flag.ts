import { SCOTCH_PACK_ID } from "@/lib/scotch-coach";

/**
 * Scotch-only prototype switch.
 * Other packs never pass. Set VITE_ASK_THE_COACH=0 in the client build and
 * ASK_THE_COACH=0 on the server to hide it. Unset means on, so a preview
 * can be tried without extra setup.
 */
export function askTheCoachEnabled(packId: string, flag: string | undefined): boolean {
  if (packId !== SCOTCH_PACK_ID) return false;
  if (flag === "0" || flag === "false") return false;
  return true;
}

export function askTheCoachClientEnabled(packId: string): boolean {
  const flag = import.meta.env.VITE_ASK_THE_COACH;
  return askTheCoachEnabled(packId, typeof flag === "string" ? flag : undefined);
}

export function askTheCoachServerEnabled(): boolean {
  const flag = process.env.ASK_THE_COACH ?? process.env.VITE_ASK_THE_COACH;
  return askTheCoachEnabled(SCOTCH_PACK_ID, flag);
}
