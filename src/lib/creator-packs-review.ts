import { useEffect, useState } from "react";

/** Mock review desk. Packs live in localStorage on this device only. */
export const CREATOR_PACKS_REVIEW_KEY = "opening-lab.creator-packs.review";

export const SUGGESTED_PACK_PRICES = ["£1.50", "£2.50", "£5.00"] as const;

export type PackReviewStatus = "review" | "live" | "returned";

export type StoredPack = {
  id: string;
  name: string;
  creatorName: string;
  lineCount: number;
  suggestedPrice: string;
  finalPrice: string;
  status: PackReviewStatus;
};

export const SEEDED_REVIEW_PACKS: readonly StoredPack[] = [
  {
    id: "seed-quiet-notes",
    name: "Quiet notes",
    creatorName: "You",
    lineCount: 4,
    suggestedPrice: "£2.50",
    finalPrice: "£2.50",
    status: "live",
  },
  {
    id: "seed-short-walk",
    name: "A short walk",
    creatorName: "You",
    lineCount: 2,
    suggestedPrice: "Free",
    finalPrice: "",
    status: "review",
  },
  {
    id: "seed-sunday-drills",
    name: "Sunday drills",
    creatorName: "Demo Coach",
    lineCount: 6,
    suggestedPrice: "£3.00",
    finalPrice: "",
    status: "review",
  },
];

function isStatus(value: unknown): value is PackReviewStatus {
  return value === "review" || value === "live" || value === "returned";
}

function isStoredPack(value: unknown): value is StoredPack {
  if (!value || typeof value !== "object") return false;
  const pack = value as Partial<StoredPack>;
  return (
    typeof pack.id === "string" &&
    typeof pack.name === "string" &&
    typeof pack.creatorName === "string" &&
    typeof pack.lineCount === "number" &&
    typeof pack.suggestedPrice === "string" &&
    typeof pack.finalPrice === "string" &&
    isStatus(pack.status)
  );
}

export function formatPackPrice(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^free$/i.test(trimmed)) return "Free";
  const cleaned = trimmed.replace(/^£/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0 || value > 250) return null;
  return `£${value.toFixed(2)}`;
}

const REVIEW_VERSION = 1;

export function loadReviewPacks(): StoredPack[] {
  const seeds = SEEDED_REVIEW_PACKS.map((pack) => ({ ...pack }));
  if (typeof window === "undefined") return seeds;
  try {
    const raw = window.localStorage.getItem(CREATOR_PACKS_REVIEW_KEY);
    if (!raw) return seeds;
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          (parsed as { version?: unknown }).version === REVIEW_VERSION &&
          Array.isArray((parsed as { packs?: unknown }).packs)
        ? (parsed as { packs: unknown[] }).packs
        : null;
    if (!list) return seeds;
    const packs = list.filter(isStoredPack).map((pack) => ({ ...pack }));
    return packs.length > 0 ? packs : seeds;
  } catch {
    return seeds;
  }
}

export function saveReviewPacks(packs: readonly StoredPack[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CREATOR_PACKS_REVIEW_KEY,
    JSON.stringify({ version: REVIEW_VERSION, packs }),
  );
  window.dispatchEvent(new Event("creator-packs-review"));
}

export function useReviewPacks(): readonly [StoredPack[], (next: StoredPack[]) => void, boolean] {
  const [packs, setPacks] = useState<StoredPack[]>(() => SEEDED_REVIEW_PACKS.map((pack) => ({ ...pack })));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setPacks(loadReviewPacks());
    sync();
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener("creator-packs-review", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("creator-packs-review", sync);
    };
  }, []);

  const replace = (next: StoredPack[]) => {
    saveReviewPacks(next);
    setPacks(next.map((pack) => ({ ...pack })));
  };

  return [packs, replace, ready] as const;
}
