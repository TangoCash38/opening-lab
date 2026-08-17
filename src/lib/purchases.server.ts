/**
 * Server-only purchase / unlock persistence. Do not import from client code.
 */
import { PACKS } from "@/data/packs";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import {
  MONTH_MS,
  YEAR_MS,
  type SubPlan,
  type UnlockState,
} from "@/lib/unlocks";

const KNOWN_PACK_IDS = new Set(PACKS.map((p) => p.id));

const EMPTY: UnlockState = { packs: [], plan: null, expiresAt: null };

export type PurchaseApply = {
  kind: "pack" | "monthly" | "yearly";
  packId?: string;
  plan?: SubPlan | null;
  expiresAt?: number | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

type PurchaseRow = {
  user_id: string;
  packs: string[] | null;
  plan: string | null;
  expires_at: Date | string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function asExpiryMs(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function asPlan(value: unknown): SubPlan | null {
  return value === "monthly" || value === "yearly" ? value : null;
}

function normalizePacks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const id of value) {
    if (typeof id !== "string" || !id || !KNOWN_PACK_IDS.has(id)) continue;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

function rowToUnlocks(row: PurchaseRow | undefined): UnlockState {
  if (!row) return { ...EMPTY };
  return {
    packs: normalizePacks(row.packs),
    plan: asPlan(row.plan),
    expiresAt: asExpiryMs(row.expires_at),
  };
}

export async function signedInUserId(request?: Request): Promise<string | null> {
  try {
    const user = await getSessionUser();
    if (user?.id) return user.id;
  } catch {
    /* fall through to request headers */
  }
  if (!request) return null;
  try {
    const { auth, authConfigured } = await import("@/lib/auth/server");
    if (!authConfigured) return null;
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getUnlocksForUser(userId: string): Promise<UnlockState> {
  const sql = await getSql();
  const rows = await sql.query<PurchaseRow>(
    "select user_id, packs, plan, expires_at, stripe_customer_id, stripe_subscription_id from purchases where user_id = $1",
    [userId],
  );
  return rowToUnlocks(rows[0]);
}

async function upsertMerged(
  userId: string,
  packs: string[],
  plan: SubPlan | null,
  expiresAt: number | null,
  stripeCustomerId?: string | null,
  stripeSubscriptionId?: string | null,
): Promise<UnlockState> {
  const sql = await getSql();
  await sql.query(
    `insert into purchases (
       user_id, packs, plan, expires_at,
       stripe_customer_id, stripe_subscription_id, updated_at
     ) values ($1, $2::text[], $3, $4, $5, $6, now())
     on conflict (user_id) do update set
       packs = (
         select coalesce(array_agg(distinct p), '{}')
         from unnest(purchases.packs || excluded.packs) as p
       ),
       plan = case
         when excluded.expires_at is null then purchases.plan
         when purchases.expires_at is null then excluded.plan
         when excluded.expires_at >= purchases.expires_at then excluded.plan
         else purchases.plan
       end,
       expires_at = case
         when excluded.expires_at is null then purchases.expires_at
         when purchases.expires_at is null then excluded.expires_at
         when excluded.expires_at >= purchases.expires_at then excluded.expires_at
         else purchases.expires_at
       end,
       stripe_customer_id = coalesce(excluded.stripe_customer_id, purchases.stripe_customer_id),
       stripe_subscription_id = coalesce(excluded.stripe_subscription_id, purchases.stripe_subscription_id),
       updated_at = now()`,
    [
      userId,
      packs,
      plan,
      expiresAt != null ? new Date(expiresAt) : null,
      stripeCustomerId ?? null,
      stripeSubscriptionId ?? null,
    ],
  );
  return getUnlocksForUser(userId);
}

export async function applyPurchase(
  userId: string,
  input: PurchaseApply,
): Promise<UnlockState> {
  const packs =
    input.kind === "pack" && input.packId && KNOWN_PACK_IDS.has(input.packId)
      ? [input.packId]
      : [];

  let plan: SubPlan | null = null;
  let expiresAt: number | null = null;
  if (input.kind === "monthly" || input.kind === "yearly") {
    plan = input.plan ?? input.kind;
    expiresAt =
      typeof input.expiresAt === "number" && Number.isFinite(input.expiresAt)
        ? input.expiresAt
        : Date.now() + (plan === "yearly" ? YEAR_MS : MONTH_MS);
  }

  return upsertMerged(
    userId,
    packs,
    plan,
    expiresAt,
    input.stripeCustomerId,
    input.stripeSubscriptionId,
  );
}

export async function claimUnlocksForUser(
  userId: string,
  incoming: UnlockState,
): Promise<UnlockState> {
  const packs = normalizePacks(incoming.packs);
  const plan = asPlan(incoming.plan);
  let expiresAt =
    typeof incoming.expiresAt === "number" && Number.isFinite(incoming.expiresAt)
      ? incoming.expiresAt
      : null;
  if (plan && expiresAt == null) {
    expiresAt = Date.now() + (plan === "yearly" ? YEAR_MS : MONTH_MS);
  }
  if (plan && expiresAt != null) {
    const cap = Date.now() + (plan === "yearly" ? YEAR_MS : MONTH_MS);
    expiresAt = Math.min(expiresAt, cap);
  }
  return upsertMerged(userId, packs, plan, plan ? expiresAt : null);
}

export async function unlocksGetResponse(request: Request): Promise<Response> {
  const userId = await signedInUserId(request);
  if (!userId) return json({ error: "Sign in required" }, 401);
  try {
    return json(await getUnlocksForUser(userId));
  } catch (err) {
    console.error("[purchases] load failed", err);
    return json({ error: "Could not load unlocks" }, 500);
  }
}

export async function unlocksClaimResponse(request: Request): Promise<Response> {
  const userId = await signedInUserId(request);
  if (!userId) return json({ error: "Sign in required" }, 401);

  let body: { packs?: unknown; plan?: unknown; expiresAt?: unknown };
  try {
    body = (await request.json()) as {
      packs?: unknown;
      plan?: unknown;
      expiresAt?: unknown;
    };
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  if (body.packs != null && !Array.isArray(body.packs)) {
    return json({ error: "Invalid request" }, 400);
  }
  if (body.plan != null && body.plan !== "monthly" && body.plan !== "yearly") {
    return json({ error: "Invalid request" }, 400);
  }
  if (
    body.expiresAt != null &&
    (typeof body.expiresAt !== "number" || !Number.isFinite(body.expiresAt))
  ) {
    return json({ error: "Invalid request" }, 400);
  }

  try {
    const unlocks = await claimUnlocksForUser(userId, {
      packs: normalizePacks(body.packs),
      plan: asPlan(body.plan),
      expiresAt:
        typeof body.expiresAt === "number" && Number.isFinite(body.expiresAt)
          ? body.expiresAt
          : null,
    });
    return json(unlocks);
  } catch (err) {
    console.error("[purchases] claim failed", err);
    return json({ error: "Could not save unlocks" }, 500);
  }
}
