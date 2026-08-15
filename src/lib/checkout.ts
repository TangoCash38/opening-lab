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
  );
  const data = (await res.json().catch(() => ({}))) as CheckoutSessionResult;
  if (!res.ok) return { ok: false };
  return data;
}
