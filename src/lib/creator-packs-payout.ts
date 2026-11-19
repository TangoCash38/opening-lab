import { useEffect, useState } from "react";

/** Mock payout flags. Stored on this device only. No Stripe request is made. */
export const CREATOR_PACKS_PAYOUT_KEY = "opening-lab.creator-packs.payouts";

export type PayoutFile = {
  version: 1;
  youReady: boolean;
  paidIds: string[];
};

export type MonthlyPayout = {
  id: string;
  creatorName: string;
  salesLabel: string;
  shareLabel: string;
};

export const MONTHLY_PAYOUTS: readonly MonthlyPayout[] = [
  { id: "you", creatorName: "You", salesLabel: "4 sales, £10.00", shareLabel: "£7.00" },
  { id: "demo-coach", creatorName: "Demo Coach", salesLabel: "6 sales, £20.00", shareLabel: "£14.00" },
  { id: "demo-author", creatorName: "Demo Author", salesLabel: "2 sales, £6.00", shareLabel: "£4.20" },
];

const EMPTY: PayoutFile = { version: 1, youReady: false, paidIds: [] };

export function payoutReadyFor(creatorName: string, youReady: boolean): boolean {
  if (creatorName === "You") return youReady;
  return creatorName === "Demo Coach";
}

export function loadPayoutFile(): PayoutFile {
  if (typeof window === "undefined") return { ...EMPTY, paidIds: [] };
  try {
    const raw = window.localStorage.getItem(CREATOR_PACKS_PAYOUT_KEY);
    if (!raw) return { ...EMPTY, paidIds: [] };
    const parsed = JSON.parse(raw) as Partial<PayoutFile>;
    if (parsed.version !== 1) return { ...EMPTY, paidIds: [] };
    const paidIds = Array.isArray(parsed.paidIds) ? parsed.paidIds.filter((id) => typeof id === "string") : [];
    return { version: 1, youReady: parsed.youReady === true, paidIds };
  } catch {
    return { ...EMPTY, paidIds: [] };
  }
}

export function savePayoutFile(file: PayoutFile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CREATOR_PACKS_PAYOUT_KEY, JSON.stringify(file));
  window.dispatchEvent(new Event("creator-packs-payout"));
}

export function useCreatorPayout() {
  const [file, setFile] = useState<PayoutFile>({ ...EMPTY, paidIds: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setFile(loadPayoutFile());
    sync();
    setHydrated(true);
    window.addEventListener("storage", sync);
    window.addEventListener("creator-packs-payout", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("creator-packs-payout", sync);
    };
  }, []);

  const write = (next: PayoutFile) => {
    savePayoutFile(next);
    setFile(next);
  };

  return {
    youReady: file.youReady,
    hydrated,
    paidIds: file.paidIds,
    markReady: () => write({ ...loadPayoutFile(), youReady: true }),
    markPaid: (id: string) => {
      const current = loadPayoutFile();
      if (current.paidIds.includes(id)) return;
      write({ ...current, paidIds: [...current.paidIds, id] });
    },
  };
}
