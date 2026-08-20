/**
 * Server-only Google Play Lab+ yearly verification.
 * Uses Android Publisher API when GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is set.
 * Never import from client code. Never log tokens or the service-account JSON.
 */
import { createSign } from "node:crypto";
import { PLAY_PACKAGE, PLAY_SKU_YEARLY } from "@/lib/play-app";
import {
  applyPurchase,
  getUnlocksForUser,
  savePlayPurchaseToken,
  signedInUserId,
  userIdForPlayToken,
} from "@/lib/purchases.server";
import { YEAR_MS, type UnlockState } from "@/lib/unlocks";

const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

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

type PlayLineItem = {
  productId?: string;
  expiryTime?: string;
};

type PlaySubV2 = {
  subscriptionState?: string;
  latestOrderId?: string;
  lineItems?: PlayLineItem[];
};

type PlaySubV1 = {
  expiryTimeMillis?: string;
  paymentState?: number;
  orderId?: string;
};

const GRANT_STATES = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
  "SUBSCRIPTION_STATE_CANCELED",
]);

function expiryFromV2(sub: PlaySubV2, productId: string): number | null {
  const item = (sub.lineItems ?? []).find((row) => row.productId === productId) ?? sub.lineItems?.[0];
  if (!item?.expiryTime) return null;
  const ms = Date.parse(item.expiryTime);
  return Number.isFinite(ms) ? ms : null;
}

async function verifyWithPublisher(input: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): Promise<{ expiresAt: number; orderId: string | null }> {
  const sa = serviceAccount();
  if (!sa) throw new Error("not_connected");
  const access = await googleAccessToken(sa);
  const auth = { Authorization: `Bearer ${access}` };

  const v2Url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${encodeURIComponent(input.packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(input.purchaseToken)}`;
  const v2res = await fetch(v2Url, { headers: auth });
  if (v2res.ok) {
    const sub = (await v2res.json()) as PlaySubV2;
    const line = (sub.lineItems ?? []).find((row) => row.productId === input.productId);
    if (!line && (sub.lineItems ?? []).length > 0) {
      throw new Error("product");
    }
    if (sub.subscriptionState && !GRANT_STATES.has(sub.subscriptionState)) {
      throw new Error("inactive");
    }
    const expiresAt = expiryFromV2(sub, input.productId) ?? Date.now() + YEAR_MS;
    if (expiresAt <= Date.now()) throw new Error("inactive");
    return { expiresAt, orderId: sub.latestOrderId ?? null };
  }

  const v1Url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${encodeURIComponent(input.packageName)}/purchases/subscriptions/` +
    `${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}`;
  const v1res = await fetch(v1Url, { headers: auth });
  if (!v1res.ok) {
    throw new Error("verify");
  }
  const sub = (await v1res.json()) as PlaySubV1;
  const expiresAt = sub.expiryTimeMillis ? Number(sub.expiryTimeMillis) : Date.now() + YEAR_MS;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error("inactive");
  }
  return { expiresAt, orderId: sub.orderId ?? null };
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
  if (packageName && packageName !== PLAY_PACKAGE) {
    return json({ error: "Wrong app" }, 400);
  }
  if (productId && productId !== PLAY_SKU_YEARLY) {
    return json({ error: "Unknown product" }, 400);
  }

  const pkg = packageName || PLAY_PACKAGE;
  const sku = productId || PLAY_SKU_YEARLY;

  try {
    const owner = await userIdForPlayToken(purchaseToken);
    if (owner && owner !== userId) {
      return json({ error: "This purchase is already on another account" }, 409);
    }
    if (owner === userId) {
      const existing = await getUnlocksForUser(userId);
      if (existing.plan === "yearly" && existing.expiresAt && existing.expiresAt > Date.now()) {
        return json(existing);
      }
    }
  } catch {
    /* columns may not exist yet — continue */
  }

  if (!serviceAccount()) {
    try {
      await savePlayPurchaseToken(userId, purchaseToken, orderId || null);
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

  let verified: { expiresAt: number; orderId: string | null };
  try {
    verified = await verifyWithPublisher({
      packageName: pkg,
      productId: sku,
      purchaseToken,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "verify";
    if (reason === "not_connected") {
      try {
        await savePlayPurchaseToken(userId, purchaseToken, orderId || null);
      } catch {
        /* ignore */
      }
      return json(
        {
          error: "Play Billing is not connected on the server yet",
          code: "not_connected",
        },
        503,
      );
    }
    if (reason === "inactive") {
      return json({ error: "This Lab+ purchase is not active" }, 402);
    }
    if (reason === "product") {
      return json({ error: "Unknown product" }, 400);
    }
    console.error("[play] verify failed");
    return json({ error: "Could not verify this Google Play purchase" }, 502);
  }

  try {
    const unlocks: UnlockState = await applyPurchase(userId, {
      kind: "yearly",
      plan: "yearly",
      expiresAt: verified.expiresAt,
      playPurchaseToken: purchaseToken,
      playOrderId: verified.orderId || orderId || null,
    });
    return json(unlocks);
  } catch (err) {
    console.error("[play] grant failed", err);
    return json({ error: "Could not save Lab+" }, 500);
  }
}
