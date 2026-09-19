import { getBearerToken } from "@/lib/auth/client";
import { replaceUnlocks } from "@/lib/unlocks";

const CLAIMED_USER_KEY = "opening-lab:unlocks-claimed-user";

export type DeleteAccountClientResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * POST the same delete-account API used by /delete-account and Account.
 * Sends cookies (deployed / Play WebView) and the live-preview bearer if set.
 */
export async function requestAccountDeletion(): Promise<DeleteAccountClientResult> {
  const headers = new Headers({ Accept: "application/json" });
  const token = getBearerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch("/api/account/delete", {
      method: "POST",
      credentials: "same-origin",
      headers,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Could not reach Opening Lab. Check your connection and try again.",
    };
  }

  if (res.ok) return { ok: true };

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  return {
    ok: false,
    status: res.status,
    error: data.error ?? "Could not delete account",
  };
}

/** Drop the local session unlock cache. Training progress stays on the device. */
export function clearLocalUnlocksAfterAccountDelete(): void {
  replaceUnlocks({ packs: [], plan: null, expiresAt: null });
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAIMED_USER_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}
