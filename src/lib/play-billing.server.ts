/**
 * Server-only Google Play Path B verification (one-time INAPP only).
 *
 * POST /api/play/subscribe
 * { packageName, productId, purchaseToken, orderId? }
 *
 *   pack_*         → applyPurchase({ kind: "pack", packId })
 *   buy_all_packs  → applyPurchase({ kind: "buy_all" })
 *
 * Verify via Android Publisher purchases/products/{productId}/tokens/{token}.
 * Path B grants are one-time INAPP only (no subscriptions).
 *
 * Live grants require GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (raw or base64 JSON
 * with client_email + private_key). When it is missing, fail-soft 503
 * `not_connected` and optionally save the token — never grant unlocks.
 * Never import from client code. Never log tokens or the service-account JSON.
 */
import { createSign } from "node:crypto";
import { PACKS } from "@/data/packs";
import { PLAY_PACKAGE, playWrapAccountUnlocks } from "@/lib/play-app";
import {
  packIdFromPlaySku,
  resolvePlayProduct,
  type PlayProduct,
} from "@/lib/play-skus";
import {
  applyPurchase,
  getUnlocksForUser,
  savePlayPurchaseToken,
  signedInUserId,
  userIdForPlayToken,
} from "@/lib/purchases.server";
import type { UnlockState } from "@/lib/unlocks";

const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const KNOWN_PACK_IDS = new Set(PACKS.map((p) => p.id));

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

function serviceAccount(): ServiceAccount | null {
  const raw = env("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (typeof parsed.client_email === "string" && typeof parsed.private_key === "string") {
      return { client_email: parsed.client_email, private_key: parsed.private_key };
    }
  } catch {
    /* maybe base64-wrapped JSON */
  }
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<ServiceAccount>;
    if (typeof parsed.client_email === "string" && typeof parsed.private_key === "string") {
      return { client_email: parsed.client_email, private_key: parsed.private_key };
    }
  } catch {
    return null;
  }
  return null;
}

function b64url(value: Buffer | string): string {
  const buf = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function googleAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: ANDROID_PUBLISHER_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${encodeURIComponent(jwt)}`,
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!res.ok || !data.access_token) {
    throw new Error("play-auth");
  }
  return data.access_token;
}

type PlayProductPurchase = {
  purchaseState?: number;
  acknowledgementState?: number;
  orderId?: string;
};

function publisherAuthHeader(access: string): { Authorization: string } {
  return { Authorization: `Bearer ${access}` };
}

async function verifyOneTimeProduct(input: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): Promise<{ orderId: string | null; acknowledgementState: number | null }> {
  const sa = serviceAccount();
  if (!sa) throw new Error("not_connected");
  const access = await googleAccessToken(sa);
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${encodeURIComponent(input.packageName)}/purchases/products/` +
    `${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}`;
  const res = await fetch(url, { headers: publisherAuthHeader(access) });
  if (!res.ok) {
    throw new Error("verify");
  }
  const purchase = (await res.json()) as PlayProductPurchase;
  // 0 = purchased, 1 = canceled, 2 = pending
  if (purchase.purchaseState !== 0) {
    throw new Error("inactive");
  }
  return {
    orderId: purchase.orderId ?? null,
    acknowledgementState:
      typeof purchase.acknowledgementState === "number" ? purchase.acknowledgementState : null,
  };
}

async function acknowledgeOneTimeProduct(input: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): Promise<void> {
  const sa = serviceAccount();
  if (!sa) return;
  try {
    const access = await googleAccessToken(sa);
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
      `${encodeURIComponent(input.packageName)}/purchases/products/` +
      `${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}:acknowledge`;
    await fetch(url, {
      method: "POST",
      headers: {
        ...publisherAuthHeader(access),
        "Content-Type": "application/json",
      },
      body: "{}",
    });
  } catch {
    /* acknowledge is best-effort; grant already persisted */
  }
}

function parsePlayProduct(productId: string): PlayProduct | null {
  const resolved = resolvePlayProduct(productId);
  if (!resolved) return null;
  if (resolved.kind === "pack") {
    const packId = packIdFromPlaySku(resolved.productId, KNOWN_PACK_IDS);
    if (!packId) return null;
    return { kind: "pack", productId: resolved.productId, packId };
  }
  return resolved;
}

function alreadyGranted(product: PlayProduct, existing: UnlockState): boolean {
  if (!existing.playBilled) return false;
  if (product.kind === "buy_all") return existing.plan === "buy_all";
  return existing.packs.includes(product.packId);
}

/** UnlockState Mobile merges: packs, plan, expiresAt, playBilled. */
function grantPayload(unlocks: UnlockState): UnlockState {
  return playWrapAccountUnlocks({
    packs: unlocks.packs,
    plan: unlocks.plan,
    expiresAt: unlocks.expiresAt,
    playBilled: true,
  });
}

async function notConnectedResponse(
  userId: string,
  purchaseToken: string,
  orderId: string | null,
): Promise<Response> {
  try {
    await savePlayPurchaseToken(userId, purchaseToken, orderId);
  } catch {
    /* persist is best-effort when Play is not connected */
  }
  return json(
    {
      error: "Play Billing is not connected on the server yet",
      code: "not_connected",
    },
    503,
  );
}

async function applyVerifiedGrant(
  userId: string,
  product: PlayProduct,
  purchaseToken: string,
  orderId: string | null,
): Promise<UnlockState> {
  if (product.kind === "pack") {
    return applyPurchase(userId, {
      kind: "pack",
      packId: product.packId,
      playPurchaseToken: purchaseToken,
      playOrderId: orderId,
    });
  }
  return applyPurchase(userId, {
    kind: "buy_all",
    playPurchaseToken: purchaseToken,
    playOrderId: orderId,
  });
}

export async function playSubscribeResponse(request: Request): Promise<Response> {
  const userId = await signedInUserId(request);
  if (!userId) return json({ error: "Sign in required" }, 401);

  let body: {
    packageName?: unknown;
    productId?: unknown;
    purchaseToken?: unknown;
    orderId?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const packageName = typeof body.packageName === "string" ? body.packageName.trim() : "";
  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const purchaseToken = typeof body.purchaseToken === "string" ? body.purchaseToken.trim() : "";
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";

  if (!purchaseToken) return json({ error: "Missing purchase token" }, 400);
  if (!productId) return json({ error: "Unknown product" }, 400);
  if (packageName && packageName !== PLAY_PACKAGE) {
    return json({ error: "Wrong app" }, 400);
  }

  const pkg = packageName || PLAY_PACKAGE;
  const product = parsePlayProduct(productId);
  if (!product) {
    return json({ error: "Unknown product" }, 400);
  }

  try {
    const owner = await userIdForPlayToken(purchaseToken);
    if (owner && owner !== userId) {
      return json({ error: "This purchase is already on another account" }, 409);
    }
    if (owner === userId) {
      const existing = await getUnlocksForUser(userId);
      if (alreadyGranted(product, existing)) {
        return json(grantPayload(existing));
      }
    }
  } catch {
    /* columns may not exist yet — continue */
  }

  if (!serviceAccount()) {
    return notConnectedResponse(userId, purchaseToken, orderId || null);
  }

  let verifiedOrderId: string | null = orderId || null;
  try {
    const verified = await verifyOneTimeProduct({
      packageName: pkg,
      productId: product.productId,
      purchaseToken,
    });
    verifiedOrderId = verified.orderId || orderId || null;
    if (verified.acknowledgementState === 0) {
      await acknowledgeOneTimeProduct({
        packageName: pkg,
        productId: product.productId,
        purchaseToken,
      });
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : "verify";
    if (reason === "not_connected") {
      return notConnectedResponse(userId, purchaseToken, orderId || null);
    }
    if (reason === "inactive") {
      return json({ error: "This Google Play purchase is not active" }, 402);
    }
    console.error("[play] verify failed");
    return json({ error: "Could not verify this Google Play purchase" }, 502);
  }

  try {
    const unlocks = await applyVerifiedGrant(
      userId,
      product,
      purchaseToken,
      verifiedOrderId,
    );
    return json(grantPayload(unlocks));
  } catch (err) {
    console.error("[play] grant failed", err);
    return json({ error: "Could not save this Google Play purchase" }, 500);
  }
}

/** Same handler — Mobile Path B posts to /api/play/subscribe. */
export const playPurchaseResponse = playSubscribeResponse;
