/**
 * Server-only Stripe helpers. Do not import from client code.
 */
import Stripe from "stripe";
import { PACKS } from "@/data/packs";
import {
  LAB_PLUS_LABEL,
  PRICE_MONTHLY,
  PRICE_YEARLY,
  isPackFree,
  packPrice,
  priceToPence,
} from "@/data/pricing";
import { applyPurchase, signedInUserId } from "@/lib/purchases.server";
import { MONTH_MS, YEAR_MS, type SubPlan } from "@/lib/unlocks";

export type CheckoutKind = "monthly" | "yearly" | "pack";

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

export function stripeSecretKey(): string | undefined {
  return env("STRIPE_SECRET_KEY");
}

export function paymentsAreEnabled(): boolean {
  return !!stripeSecretKey();
}

function stripeClient(): Stripe {
  const key = stripeSecretKey();
  if (!key) {
    throw new Error("Payments are not configured");
  }
  return new Stripe(key);
}

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = (
    request.headers.get("x-forwarded-proto") ??
    url.protocol.replace(":", "")
  ).split(",")[0]!.trim();
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host
  )
    .split(",")[0]!
    .trim();
  return `${proto}://${host}`;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function paymentsStatusResponse(): Response {
  return json({ enabled: paymentsAreEnabled() });
}

function subscriptionPeriodEndMs(sub: Stripe.Subscription): number | null {
  const fromSub = (sub as { current_period_end?: number }).current_period_end;
  if (typeof fromSub === "number" && fromSub > 0) return fromSub * 1000;
  const item = sub.items?.data?.[0] as
    | { current_period_end?: number }
    | undefined;
  if (typeof item?.current_period_end === "number" && item.current_period_end > 0) {
    return item.current_period_end * 1000;
  }
  return null;
}

function stripeId(
  value: string | { id?: string } | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

async function expiresAtForPlan(
  session: Stripe.Checkout.Session,
  plan: SubPlan,
): Promise<number> {
  let sub = session.subscription;
  if (typeof sub === "string") {
    try {
      sub = await stripeClient().subscriptions.retrieve(sub);
    } catch {
      sub = null;
    }
  }
  if (sub && typeof sub === "object") {
    const end = subscriptionPeriodEndMs(sub);
    if (end) return end;
  }
  return Date.now() + (plan === "yearly" ? YEAR_MS : MONTH_MS);
}

async function persistPaidSession(
  session: Stripe.Checkout.Session,
  fallbackUserId?: string | null,
): Promise<void> {
  const userId =
    session.metadata?.userId?.trim() ||
    session.client_reference_id?.trim() ||
    fallbackUserId?.trim() ||
    "";
  if (!userId) return;

  const kind = session.metadata?.kind;
  const packId = session.metadata?.packId || undefined;
  const plan: SubPlan | null =
    kind === "monthly" || kind === "yearly" ? kind : null;

  try {
    if (kind === "pack" && packId) {
      await applyPurchase(userId, {
        kind: "pack",
        packId,
        stripeCustomerId: stripeId(session.customer),
      });
      return;
    }
    if (plan) {
      await applyPurchase(userId, {
        kind: plan,
        plan,
        expiresAt: await expiresAtForPlan(session, plan),
        stripeCustomerId: stripeId(session.customer),
        stripeSubscriptionId: stripeId(session.subscription),
      });
    }
  } catch (err) {
    console.error("[purchases] persist failed", err);
  }
}

export async function createCheckoutSession(request: Request): Promise<Response> {
  if (!paymentsAreEnabled()) {
    return json({ error: "Payments are not configured" }, 503);
  }

  const userId = await signedInUserId(request);
  if (!userId) {
    return json({ error: "Sign in required" }, 401);
  }

  let body: { kind?: unknown; packId?: unknown };
  try {
    body = (await request.json()) as { kind?: unknown; packId?: unknown };
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const kind = body.kind;
  if (kind !== "monthly" && kind !== "yearly" && kind !== "pack") {
    return json({ error: "Invalid request" }, 400);
  }

  const origin = requestOrigin(request);
  const stripe = stripeClient();

  let mode: "subscription" | "payment";
  let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;
  let packId = "";

  if (kind === "monthly" || kind === "yearly") {
    const pence = priceToPence(kind === "monthly" ? PRICE_MONTHLY : PRICE_YEARLY);
    if (!pence) return json({ error: "Invalid price" }, 400);
    mode = "subscription";
    lineItem = {
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: pence,
        recurring: { interval: kind === "monthly" ? "month" : "year" },
        product_data: { name: LAB_PLUS_LABEL },
      },
    };
  } else {
    if (typeof body.packId !== "string" || !body.packId) {
      return json({ error: "Missing pack" }, 400);
    }
    const pack = PACKS.find((p) => p.id === body.packId);
    if (!pack || isPackFree(pack)) {
      return json({ error: "Unknown or free pack" }, 400);
    }
    const price = packPrice(pack);
    const pence = price ? priceToPence(price) : null;
    if (!pence) return json({ error: "Unknown or free pack" }, 400);
    packId = pack.id;
    mode = "payment";
    lineItem = {
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: pence,
        product_data: { name: pack.name },
      },
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [lineItem],
    success_url: `${origin}/?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
    client_reference_id: userId,
    metadata: { kind, packId, userId },
  });

  if (!session.url) {
    return json({ error: "Could not start checkout" }, 500);
  }
  return json({ url: session.url });
}

export async function getCheckoutSession(request: Request): Promise<Response> {
  if (!paymentsAreEnabled()) {
    return json({ ok: false }, 503);
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return json({ ok: false }, 400);
  }

  const session = await stripeClient().checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
  const paid =
    session.payment_status === "paid" || session.status === "complete";
  if (!paid) {
    return json({ ok: false });
  }

  const kind = session.metadata?.kind;
  const packId = session.metadata?.packId || undefined;
  const plan = kind === "monthly" || kind === "yearly" ? kind : null;
  const signedInId = await signedInUserId(request);
  const metaUserId = session.metadata?.userId?.trim() || "";

  if (signedInId && metaUserId && signedInId !== metaUserId) {
    await persistPaidSession(session, metaUserId);
    return json({ ok: false });
  }
  if (signedInId || metaUserId) {
    await persistPaidSession(session, signedInId);
  }

  return json({
    ok: true,
    kind: kind === "monthly" || kind === "yearly" || kind === "pack" ? kind : undefined,
    packId,
    plan,
  });
}

export async function handleStripeWebhook(request: Request): Promise<Response> {
  const raw = await request.text();
  const webhookSecret = env("STRIPE_WEBHOOK_SECRET");
  let event: Stripe.Event | null = null;

  if (webhookSecret) {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }
    try {
      event = Stripe.webhooks.constructEvent(raw, signature, webhookSecret);
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(raw) as Stripe.Event;
    } catch {
      return json({ received: true });
    }
  }

  if (event?.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.userId || session.client_reference_id) {
      await persistPaidSession(session);
    }
  }

  return json({ received: true });
}
