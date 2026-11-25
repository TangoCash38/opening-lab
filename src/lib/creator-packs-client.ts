/**
 * Browser calls for creator packs. Cookies on the live site, and the
 * live-preview bearer when that token is set. No Stripe secret lives here.
 */
import { getBearerToken } from "@/lib/auth/client";
import type { PackReviewStatus } from "@/lib/creator-packs-review";

export type CreatorDeskPack = {
  id: string;
  name: string;
  lineCount: number;
  status: PackReviewStatus;
  suggestedPrice: string;
  finalPrice: string;
  reviewNote: string;
};

export type CreatorDesk = {
  signedIn: boolean;
  paymentsEnabled: boolean;
  profile: {
    userId: string;
    displayName: string;
    bio: string;
    payoutsReady: boolean;
  } | null;
  packs: CreatorDeskPack[];
  sales: { count: number; amountPence: number; sharePence: number };
};

export type CataloguePack = {
  id: string;
  name: string;
  blurb: string;
  priceLabel: string;
  badge: string;
  creatorId: string;
  creatorName: string;
  bio: string;
};

export type PlayableLine = {
  id: string;
  name: string;
  mode: "drill" | "walk";
  locked: boolean;
  fen: string;
  plies: string[];
  comments: string[];
};

export type PlayablePack = {
  id: string;
  name: string;
  blurb: string;
  status: PackReviewStatus;
  priceLabel: string;
  pricePence: number;
  creatorId: string;
  creatorName: string;
  bio: string;
  isOwner: boolean;
  unlocked: boolean;
  paymentsEnabled: boolean;
  payoutsReady: boolean;
  reviewNote: string;
  lines: PlayableLine[];
};

export type AdminPack = {
  id: string;
  name: string;
  creatorName: string;
  creatorUserId: string;
  lineCount: number;
  suggestedPrice: string;
  finalPrice: string;
  status: PackReviewStatus;
  payoutsReady: boolean;
  reviewNote: string;
  lines: { name: string; mode: "drill" | "walk"; plyCount: number; comments: string[] }[];
};

export type AdminSale = {
  creatorUserId: string;
  creatorName: string;
  webCount: number;
  webPence: number;
  webSharePence: number;
  playWaitingCount: number;
  playWaitingPence: number;
};

type Fail = { ok: false; error: string; status: number };

async function api<T>(path: string, init?: RequestInit): Promise<{ status: number; data: T }> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");
  const token = getBearerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

function fail(status: number, data: { error?: string }, fallback: string): Fail {
  return { ok: false, status, error: data.error || fallback };
}

export async function fetchCreatorMine(): Promise<{ ok: true; desk: CreatorDesk } | Fail> {
  try {
    const { status, data } = await api<CreatorDesk & { error?: string }>("/api/creator-packs/mine");
    if (!status || status >= 400) {
      return fail(status, data, "Creator packs could not be loaded.");
    }
    return { ok: true, desk: data };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function saveCreatorProfile(input: {
  displayName: string;
  bio: string;
}): Promise<{ ok: true } | Fail> {
  try {
    const { status, data } = await api<{ error?: string }>("/api/creator-packs/profile", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!data || status >= 400) return fail(status, data, "Could not save your name.");
    return { ok: true };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function submitCreatorPack(input: unknown): Promise<
  { ok: true; pack: { id: string; name: string; suggestedPrice: string } } | Fail
> {
  try {
    const { status, data } = await api<{
      error?: string;
      pack?: { id: string; name: string; suggestedPrice: string };
    }>("/api/creator-packs/", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (status >= 400 || !data.pack) return fail(status, data, "Could not submit the pack.");
    return { ok: true, pack: data.pack };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function fetchCreatorCatalogue(): Promise<
  { ok: true; packs: CataloguePack[]; paymentsEnabled: boolean } | Fail
> {
  try {
    const { status, data } = await api<{ error?: string; packs?: CataloguePack[]; paymentsEnabled?: boolean }>(
      "/api/creator-packs/",
    );
    if (status >= 400 || !data.packs) return fail(status, data, "Creator packs could not be loaded.");
    return { ok: true, packs: data.packs, paymentsEnabled: data.paymentsEnabled === true };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function fetchCreatorProfile(creatorId: string): Promise<
  | { ok: true; creator: { id: string; name: string; bio: string }; packs: { id: string; name: string; blurb: string; priceLabel: string; badge: string }[] }
  | Fail
> {
  try {
    const { status, data } = await api<{
      error?: string;
      creator?: { id: string; name: string; bio: string };
      packs?: { id: string; name: string; blurb: string; priceLabel: string; badge: string }[];
    }>(`/api/creator-packs/creator/${encodeURIComponent(creatorId)}`);
    if (status >= 400 || !data.creator || !data.packs) {
      return fail(status, data, "This creator is not available.");
    }
    return { ok: true, creator: data.creator, packs: data.packs };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function fetchPlayablePack(packId: string): Promise<{ ok: true; pack: PlayablePack } | Fail> {
  try {
    const { status, data } = await api<PlayablePack & { error?: string }>(
      `/api/creator-packs/pack/${encodeURIComponent(packId)}`,
    );
    if (status >= 400 || !data.id) return fail(status, data, "This pack is not available.");
    return { ok: true, pack: data };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function startCreatorConnect(country: string): Promise<{ ok: true; url: string } | Fail> {
  try {
    const { status, data } = await api<{ error?: string; url?: string }>("/api/creator-packs/connect", {
      method: "POST",
      body: JSON.stringify({ country }),
    });
    if (status >= 400 || !data.url) return fail(status, data, "Stripe could not open payout setup.");
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function openCreatorPackCheckout(packId: string): Promise<{ ok: true; url: string } | Fail> {
  try {
    const { status, data } = await api<{ error?: string; url?: string }>("/api/creator-packs/checkout", {
      method: "POST",
      body: JSON.stringify({ packId }),
    });
    if (status >= 400 || !data.url) return fail(status, data, "Checkout could not start. No payment was taken.");
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function confirmCreatorCheckout(sessionId: string): Promise<{ ok: true } | Fail> {
  try {
    const { status, data } = await api<{ error?: string; ok?: boolean }>(
      `/api/creator-packs/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
    );
    if (status >= 400 || data.ok !== true) return fail(status, data, "The payment could not be confirmed yet.");
    return { ok: true };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function fetchCreatorAdmin(): Promise<
  { ok: true; packs: AdminPack[]; sales: AdminSale[] } | Fail
> {
  try {
    const { status, data } = await api<{ error?: string; code?: string; packs?: AdminPack[]; sales?: AdminSale[] }>(
      "/api/creator-packs/admin",
    );
    if (status >= 400 || !data.packs || !data.sales) return fail(status, data, "The review desk could not be loaded.");
    return { ok: true, packs: data.packs, sales: data.sales };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}

export async function reviewCreatorPack(input: {
  packId: string;
  action: "approve" | "return";
  finalPrice?: string;
  note?: string;
}): Promise<{ ok: true } | Fail> {
  try {
    const { status, data } = await api<{ error?: string }>("/api/creator-packs/admin", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (status >= 400) return fail(status, data, "The review could not be saved.");
    return { ok: true };
  } catch {
    return { ok: false, status: 0, error: "Could not reach Opening Lab. Check your connection and try again." };
  }
}
