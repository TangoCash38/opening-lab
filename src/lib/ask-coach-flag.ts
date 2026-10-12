import { LIVE_PACK_IDS } from "@/lib/catalog";

/**
 * Every on-sale pack, on the website and in the Play app.
 * Coming-soon packs never pass. Set VITE_ASK_THE_COACH=0 in the client build
 * and ASK_THE_COACH=0 on the server to hide it. Unset means on.
 */
export function askTheCoachEnabled(packId: string, flag: string | undefined): boolean {
  if (!(LIVE_PACK_IDS as readonly string[]).includes(packId)) return false;
  if (flag === "0" || flag === "false") return false;
  return true;
}

export function askTheCoachClientEnabled(packId: string): boolean {
  const flag = import.meta.env.VITE_ASK_THE_COACH;
  return askTheCoachEnabled(packId, typeof flag === "string" ? flag : undefined);
}

/** User agent is ignored. Play and the website share this switch. */
export function askTheCoachServerEnabled(_userAgent?: string | null): boolean {
  const flag = process.env.ASK_THE_COACH ?? process.env.VITE_ASK_THE_COACH;
  if (flag === "0" || flag === "false") return false;
  return true;
}
