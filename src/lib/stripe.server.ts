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

export async function createCheckoutSession(request: Request): Promise<Response> {
  if (!paymentsAreEnabled()) {
    return json({ error: "Payments are not configured" }, 503);
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
    metadata: { kind, packId },
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

  const session = await stripeClient().checkout.sessions.retrieve(sessionId);
  const paid =
    session.payment_status === "paid" || session.status === "complete";
  if (!paid) {
    return json({ ok: false });
  }

  const kind = session.metadata?.kind;
  const packId = session.metadata?.packId || undefined;
  const plan = kind === "monthly" || kind === "yearly" ? kind : null;

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

  if (webhookSecret) {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }
    try {
      Stripe.webhooks.constructEvent(raw, signature, webhookSecret);
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }
  }

  // v1: client success_url confirm unlocks on the device. Keep the route
  // so a Stripe webhook can be added later. Do not store card data.
  return json({ received: true });
}
