export type CheckoutKind = "monthly" | "yearly" | "pack";

export type CheckoutSessionResult = {
  ok: boolean;
  kind?: CheckoutKind;
  packId?: string;
  plan?: "monthly" | "yearly" | null;
};

export async function fetchPaymentsEnabled(): Promise<boolean> {
  const res = await fetch("/api/payments");
  if (!res.ok) throw new Error("Could not check payments");
  const data = (await res.json()) as { enabled?: boolean };
  return data.enabled === true;
}

export async function startCheckout(
  kind: CheckoutKind,
  packId?: string,
): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, packId }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Could not start checkout");
  }
  return data.url;
}

export async function confirmCheckoutSession(
  sessionId: string,
): Promise<CheckoutSessionResult> {
  const res = await fetch(
    `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
    { credentials: "same-origin" },
  );
  const data = (await res.json().catch(() => ({}))) as CheckoutSessionResult;
  if (!res.ok) return { ok: false };
  return data;
}

const PENDING_KEY = "opening-lab:pending-checkout";

export type PendingCheckout = { kind: CheckoutKind; packId?: string };

export function savePendingCheckout(pending: PendingCheckout) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* ignore */
  }
}

export function readPendingCheckout(): PendingCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { kind?: unknown; packId?: unknown };
    if (parsed.kind !== "monthly" && parsed.kind !== "yearly" && parsed.kind !== "pack") {
      return null;
    }
    return {
      kind: parsed.kind,
      packId: typeof parsed.packId === "string" ? parsed.packId : undefined,
    };
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}
