/**
 * Creator packs on the server: profiles, review, Stripe Connect, and sales.
 *
 * Website checkout uses a destination charge on Opening Lab's Stripe account.
 * The PaymentIntent names the creator's Express account in transfer_data and
 * sets application_fee_amount to Opening Lab's 30%. Stripe creates the
 * transfer when the payment succeeds, so the creator's 70% is not a second
 * job we could miss after the buyer has paid. Opening Lab stays the merchant
 * of record. The buyer checks out on Opening Lab. The connected account only
 * receives its share.
 *
 * Separate charges and transfers stay the later path for Google Play. Those
 * sales are recorded with channel 'play' and transferred_at null, then paid
 * monthly. This file does not create those transfers.
 *
 * Do not import this from client code.
 */
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { getSql, type Sql } from "@/lib/db";
import { signedInUser, type SignedInUser } from "@/lib/purchases.server";
import {
  connectCountry,
  validateCreatorPack,
  validateCreatorProfile,
} from "@/lib/creator-packs-content";
import { splitSalePence } from "@/lib/creator-packs-payout";
import { formatPenceLabel, labelToPence, type PackReviewStatus } from "@/lib/creator-packs-review";
import { firstPurchaseLink } from "@/lib/creator-packs-text";

const PACK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProfileRow = {
  user_id: string;
  display_name: string;
  bio: string;
  stripe_account_id: string | null;
  payouts_ready: boolean;
};

type PackRow = {
  id: string;
  creator_user_id: string;
  name: string;
  blurb: string;
  status: PackReviewStatus;
  suggested_price_pence: number;
  final_price_pence: number | null;
  review_note: string;
  display_name: string;
  bio: string;
  payouts_ready: boolean;
  stripe_account_id: string | null;
};

type LineRow = {
  id: string;
  pack_id: string;
  position: number;
  name: string;
  mode: "drill" | "walk";
  fen: string;
  plies: string[] | null;
  comments: string[] | null;
};

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

export function creatorPaymentsEnabled(): boolean {
  return Boolean(env("STRIPE_SECRET_KEY"));
}

function stripeClient(): Stripe {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Payments are not configured");
  return new Stripe(key);
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = (request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", ""))
    .split(",")[0]!
    .trim();
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host)
    .split(",")[0]!
    .trim();
  return `${proto}://${host}`;
}

function asInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function isStatus(value: string): value is PackReviewStatus {
  return value === "review" || value === "live" || value === "returned";
}

export function creatorAdminEmails(): Set<string> {
  const raw = env("CREATOR_PACKS_ADMIN_EMAILS") ?? "";
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function creatorAdminStatus(email: string | null | undefined): "ok" | "unset" | "forbidden" {
  const list = creatorAdminEmails();
  if (list.size === 0) return "unset";
  if (!email || !list.has(email.trim().toLowerCase())) return "forbidden";
  return "ok";
}

async function withSql(work: (sql: Sql) => Promise<Response>): Promise<Response> {
  try {
    return await work(await getSql());
  } catch (err) {
    console.error("[creator-packs] database", err);
    return json(
      { error: "Creator packs need a database connection before they can be saved." },
      503,
    );
  }
}

function playApp(request: Request): boolean {
  return (request.headers.get("user-agent") ?? "").includes("OpeningLabPlay");
}

async function loadProfile(sql: Sql, userId: string): Promise<ProfileRow | null> {
  const rows = await sql.query<ProfileRow>(
    `select user_id, display_name, bio, stripe_account_id, payouts_ready
       from creator_profiles where user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

function accountPayoutsReady(account: Stripe.Account): boolean {
  return account.capabilities?.transfers === "active" && account.payouts_enabled === true;
}

async function refreshProfilePayouts(sql: Sql, profile: ProfileRow): Promise<ProfileRow> {
  if (!profile.stripe_account_id || !creatorPaymentsEnabled()) return profile;
  try {
    const account = await stripeClient().accounts.retrieve(profile.stripe_account_id);
    const ready = accountPayoutsReady(account);
    if (ready !== profile.payouts_ready) {
      await sql.query(
        `update creator_profiles set payouts_ready = $2, updated_at = now() where user_id = $1`,
        [profile.user_id, ready],
      );
      return { ...profile, payouts_ready: ready };
    }
  } catch (err) {
    console.error("[creator-packs] payout status", err);
  }
  return profile;
}

function priceLabel(pence: number | null, suggested: number, status: PackReviewStatus): string {
  if (status === "live" && pence !== null) return formatPenceLabel(pence);
  return formatPenceLabel(suggested);
}

async function salesForCreator(sql: Sql, userId: string) {
  const rows = await sql.query<{
    sales_count: number;
    amount_pence: number;
    share_pence: number;
  }>(
    `select count(*)::int as sales_count,
            coalesce(sum(s.amount_pence), 0)::int as amount_pence,
            coalesce(sum(s.creator_share_pence), 0)::int as share_pence
       from creator_sales s
       join creator_packs p on p.id = s.pack_id
      where p.creator_user_id = $1 and s.channel = 'web'`,
    [userId],
  );
  const row = rows[0];
  return {
    count: asInt(row?.sales_count),
    amountPence: asInt(row?.amount_pence),
    sharePence: asInt(row?.share_pence),
  };
}

async function packsForCreator(sql: Sql, userId: string) {
  const rows = await sql.query<{
    id: string;
    name: string;
    status: string;
    suggested_price_pence: number;
    final_price_pence: number | null;
    review_note: string;
    line_count: number;
  }>(
    `select p.id, p.name, p.status, p.suggested_price_pence, p.final_price_pence, p.review_note,
            (select count(*)::int from creator_pack_lines l where l.pack_id = p.id) as line_count
       from creator_packs p
      where p.creator_user_id = $1
      order by p.updated_at desc
      limit 100`,
    [userId],
  );
  return rows.filter((row) => isStatus(row.status)).map((row) => ({
    id: row.id,
    name: row.name,
    lineCount: asInt(row.line_count),
    status: row.status as PackReviewStatus,
    suggestedPrice: formatPenceLabel(asInt(row.suggested_price_pence)),
    finalPrice: row.final_price_pence == null ? "" : formatPenceLabel(asInt(row.final_price_pence)),
    reviewNote: row.review_note,
  }));
}

export async function creatorPacksMineResponse(request: Request): Promise<Response> {
  const user = await signedInUser(request);
  if (!user) {
    return json({ signedIn: false, paymentsEnabled: creatorPaymentsEnabled() });
  }
  return withSql(async (sql) => {
    const profile = await refreshProfilePayouts(sql, (await loadProfile(sql, user.id)) ?? {
      user_id: user.id,
      display_name: "",
      bio: "",
      stripe_account_id: null,
      payouts_ready: false,
    });
    const hasProfile = Boolean(profile.display_name);
    return json({
      signedIn: true,
      paymentsEnabled: creatorPaymentsEnabled(),
      profile: hasProfile
        ? {
            userId: user.id,
            displayName: profile.display_name,
            bio: profile.bio,
            payoutsReady: profile.payouts_ready,
          }
        : null,
      packs: hasProfile ? await packsForCreator(sql, user.id) : [],
      sales: hasProfile
        ? await salesForCreator(sql, user.id)
        : { count: 0, amountPence: 0, sharePence: 0 },
    });
  });
}

export async function saveCreatorProfileResponse(request: Request): Promise<Response> {
  const user = await signedInUser(request);
  if (!user) return json({ error: "Sign in required" }, 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Add the name you want on your packs." }, 400);
  }
  const parsed = validateCreatorProfile(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  return withSql(async (sql) => {
    await sql.query(
      `insert into creator_profiles (user_id, display_name, bio)
       values ($1, $2, $3)
       on conflict (user_id) do update set
         display_name = excluded.display_name,
         bio = excluded.bio,
         updated_at = now()`,
      [user.id, parsed.displayName, parsed.bio],
    );
    return json({ ok: true, displayName: parsed.displayName });
  });
}

export async function createCreatorPackResponse(request: Request): Promise<Response> {
  const user = await signedInUser(request);
  if (!user) return json({ error: "Sign in required" }, 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "The pack could not be read." }, 400);
  }
  const parsed = validateCreatorPack(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  return withSql(async (sql) => {
    const profile = await loadProfile(sql, user.id);
    if (!profile) {
      return json({ error: "Add the name you want on your packs before you submit." }, 409);
    }
    const pack = parsed.pack;
    const id = randomUUID();
    try {
      await sql.query(
        `insert into creator_packs (
           id, creator_user_id, name, blurb, status, suggested_price_pence
         ) values ($1, $2, $3, $4, 'review', $5)`,
        [id, user.id, pack.name, pack.blurb, pack.suggestedPricePence],
      );
      for (let i = 0; i < pack.lines.length; i += 1) {
        const line = pack.lines[i]!;
        await sql.query(
          `insert into creator_pack_lines (
             id, pack_id, position, name, mode, fen, plies, comments
           ) values ($1, $2, $3, $4, $5, $6, $7::text[], $8::text[])`,
          [randomUUID(), id, i, line.name, line.mode, line.fen, line.plies, line.comments],
        );
      }
    } catch (err) {
      await sql.query(`delete from creator_packs where id = $1`, [id]);
      throw err;
    }
    return json({
      ok: true,
      pack: {
        id,
        name: pack.name,
        suggestedPrice: pack.suggestedPriceLabel,
        status: "review",
      },
    });
  });
}

const PACK_SELECT = `
  select p.id, p.creator_user_id, p.name, p.blurb, p.status,
         p.suggested_price_pence, p.final_price_pence, p.review_note,
         pr.display_name, pr.bio, pr.payouts_ready, pr.stripe_account_id
    from creator_packs p
    join creator_profiles pr on pr.user_id = p.creator_user_id
`;

async function loadPack(sql: Sql, packId: string): Promise<PackRow | null> {
  if (!PACK_ID.test(packId)) return null;
  const rows = await sql.query<PackRow>(`${PACK_SELECT} where p.id = $1`, [packId]);
  const row = rows[0];
  if (!row || !isStatus(row.status)) return null;
  return row;
}

async function loadLines(sql: Sql, packId: string): Promise<LineRow[]> {
  return sql.query<LineRow>(
    `select id, pack_id, position, name, mode, fen, plies, comments
       from creator_pack_lines
      where pack_id = $1
      order by position`,
    [packId],
  );
}

async function buyerOwns(sql: Sql, userId: string, packId: string): Promise<boolean> {
  const rows = await sql.query<{ buyer_user_id: string }>(
    `select buyer_user_id from creator_pack_unlocks where buyer_user_id = $1 and pack_id = $2`,
    [userId, packId],
  );
  return Boolean(rows[0]);
}

function canReadPack(row: PackRow, user: SignedInUser | null): boolean {
  if (row.status === "live") return true;
  if (user && user.id === row.creator_user_id) return true;
  if (user && creatorAdminStatus(user.email) === "ok") return true;
  return false;
}

export async function creatorPackCatalogueResponse(): Promise<Response> {
  return withSql(async (sql) => {
    const rows = await sql.query<{
      id: string;
      name: string;
      blurb: string;
      final_price_pence: number | null;
      creator_user_id: string;
      display_name: string;
      bio: string;
      line_count: number;
    }>(
      `select p.id, p.name, p.blurb, p.final_price_pence, p.creator_user_id,
              pr.display_name, pr.bio,
              (select count(*)::int from creator_pack_lines l where l.pack_id = p.id) as line_count
         from creator_packs p
         join creator_profiles pr on pr.user_id = p.creator_user_id
        where p.status = 'live'
        order by p.updated_at desc
        limit 100`,
    );
    return json({
      paymentsEnabled: creatorPaymentsEnabled(),
      packs: rows.map((row) => {
        const lineCount = asInt(row.line_count);
        const pence = row.final_price_pence == null ? 0 : asInt(row.final_price_pence);
        return {
          id: row.id,
          name: row.name,
          blurb: row.blurb || `${lineCount === 1 ? "One line" : `${lineCount} lines`} from ${row.display_name}.`,
          priceLabel: formatPenceLabel(pence),
          badge: lineCount === 1 ? "1 line" : `${lineCount} lines`,
          creatorId: row.creator_user_id,
          creatorName: row.display_name,
          bio: row.bio,
        };
      }),
    });
  });
}

export async function creatorPublicProfileResponse(creatorId: string): Promise<Response> {
  if (!creatorId || creatorId.length > 80) return json({ error: "This creator is not available." }, 404);
  return withSql(async (sql) => {
    const profiles = await sql.query<ProfileRow>(
      `select user_id, display_name, bio, stripe_account_id, payouts_ready
         from creator_profiles where user_id = $1`,
      [creatorId],
    );
    const profile = profiles[0];
    if (!profile || profile.display_name === "Former creator") {
      return json({ error: "This creator is not available." }, 404);
    }
    const rows = await sql.query<{
      id: string;
      name: string;
      blurb: string;
      final_price_pence: number | null;
      line_count: number;
    }>(
      `select p.id, p.name, p.blurb, p.final_price_pence,
              (select count(*)::int from creator_pack_lines l where l.pack_id = p.id) as line_count
         from creator_packs p
        where p.creator_user_id = $1 and p.status = 'live'
        order by p.updated_at desc`,
      [creatorId],
    );
    return json({
      creator: { id: profile.user_id, name: profile.display_name, bio: profile.bio },
      packs: rows.map((row) => {
        const lineCount = asInt(row.line_count);
        return {
          id: row.id,
          name: row.name,
          blurb: row.blurb,
          priceLabel: formatPenceLabel(row.final_price_pence == null ? 0 : asInt(row.final_price_pence)),
          badge: lineCount === 1 ? "1 line" : `${lineCount} lines`,
        };
      }),
    });
  });
}

export async function creatorPackDetailResponse(request: Request, packId: string): Promise<Response> {
  const user = await signedInUser(request);
  return withSql(async (sql) => {
    const pack = await loadPack(sql, packId);
    if (!pack || !canReadPack(pack, user)) {
      return json({ error: "This pack is not available." }, 404);
    }
    const isOwner = user?.id === pack.creator_user_id;
    const unlocked = isOwner || (user ? await buyerOwns(sql, user.id, pack.id) : false);
    const finalPence = pack.final_price_pence == null ? null : asInt(pack.final_price_pence);
    const freePack = pack.status === "live" && finalPence === 0;
    const openAll = isOwner || unlocked || freePack;
    const lines = await loadLines(sql, pack.id);
    return json({
      id: pack.id,
      name: pack.name,
      blurb: pack.blurb,
      status: pack.status,
      priceLabel: priceLabel(finalPence, asInt(pack.suggested_price_pence), pack.status),
      pricePence: pack.status === "live" && finalPence !== null ? finalPence : asInt(pack.suggested_price_pence),
      creatorId: pack.creator_user_id,
      creatorName: pack.display_name,
      bio: pack.bio,
      isOwner,
      unlocked: openAll,
      paymentsEnabled: creatorPaymentsEnabled(),
      payoutsReady: pack.payouts_ready,
      reviewNote: isOwner || creatorAdminStatus(user?.email) === "ok" ? pack.review_note : "",
      lines: lines.map((line, index) => {
        const locked = !(openAll || (pack.status === "live" && index === 0));
        return {
          id: line.id,
          name: line.name,
          mode: line.mode === "walk" ? "walk" : "drill",
          locked,
          fen: locked ? "" : line.fen,
          plies: locked ? [] : asStrings(line.plies),
          comments: locked ? [] : asStrings(line.comments),
        };
      }),
    });
  });
}

function stripeNotice(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (/signed up for Connect|connect/i.test(message) && /only create|not enabled|signed up/i.test(message)) {
    return "Stripe Connect is not switched on for Opening Lab yet. Payout setup can start once it is.";
  }
  return "Stripe could not open payout setup. Nothing was sent.";
}

async function accountLink(origin: string, accountId: string): Promise<string> {
  const stripe = stripeClient();
  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/api/creator-packs/connect/refresh`,
      return_url: `${origin}/creator-packs/dashboard?stripe=return`,
      type: "account_onboarding",
    });
    if (!link.url) throw new Error("Missing Stripe link");
    return link.url;
  } catch (err) {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/api/creator-packs/connect/refresh`,
      return_url: `${origin}/creator-packs/dashboard?stripe=return`,
      type: "account_update",
    });
    if (!link.url) throw err;
    return link.url;
  }
}

export async function startCreatorConnectResponse(request: Request): Promise<Response> {
  const user = await signedInUser(request);
  if (!user) return json({ error: "Sign in required" }, 401);
  if (!creatorPaymentsEnabled()) {
    return json(
      {
        error:
          "Payouts are not switched on in this preview yet. Opening Lab still needs its Stripe secret key, and Connect turned on. You can submit a pack before that is ready.",
      },
      503,
    );
  }
  let countryCode = "GB";
  try {
    const body = (await request.json()) as { country?: unknown };
    const picked = connectCountry(body.country);
    if (body.country != null && !picked) {
      return json({ error: "Choose a country from the list. If yours is missing, use Need help?" }, 400);
    }
    if (picked) countryCode = picked;
  } catch {
    countryCode = "GB";
  }
  return withSql(async (sql) => {
    const profile = await loadProfile(sql, user.id);
    if (!profile) {
      return json({ error: "Add the name you want on your packs before payout setup." }, 409);
    }
    const stripe = stripeClient();
    let accountId = profile.stripe_account_id;
    try {
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: countryCode,
          email: user.email ?? undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual",
          metadata: { openingLabUserId: user.id },
        });
        accountId = account.id;
        await sql.query(
          `update creator_profiles
              set stripe_account_id = $2, updated_at = now()
            where user_id = $1 and stripe_account_id is null`,
          [user.id, accountId],
        );
      }
      const url = await accountLink(requestOrigin(request), accountId);
      return json({ url });
    } catch (err) {
      console.error("[creator-packs] connect", err);
      return json({ error: stripeNotice(err) }, 502);
    }
  });
}

export async function refreshCreatorConnectResponse(request: Request): Promise<Response> {
  const origin = requestOrigin(request);
  const user = await signedInUser(request);
  if (!user || !creatorPaymentsEnabled()) {
    return Response.redirect(`${origin}/creator-packs/dashboard?stripe=refresh-failed`, 303);
  }
  try {
    const sql = await getSql();
    const profile = await loadProfile(sql, user.id);
    if (!profile?.stripe_account_id) {
      return Response.redirect(`${origin}/creator-packs/dashboard`, 303);
    }
    const url = await accountLink(origin, profile.stripe_account_id);
    return Response.redirect(url, 303);
  } catch (err) {
    console.error("[creator-packs] connect refresh", err);
    return Response.redirect(`${origin}/creator-packs/dashboard?stripe=refresh-failed`, 303);
  }
}

export async function createCreatorCheckoutResponse(request: Request): Promise<Response> {
  if (playApp(request)) return json({ error: "Use Google Play Billing in the app" }, 400);
  const user = await signedInUser(request);
  if (!user) return json({ error: "Sign in required" }, 401);
  if (!creatorPaymentsEnabled()) {
    return json(
      { error: "Payments are not switched on in this preview yet. No payment is taken." },
      503,
    );
  }
  let packId = "";
  try {
    const body = (await request.json()) as { packId?: unknown };
    if (typeof body.packId === "string") packId = body.packId;
  } catch {
    return json({ error: "Missing pack" }, 400);
  }
  return withSql(async (sql) => {
    const pack = await loadPack(sql, packId);
    if (!pack || pack.status !== "live") return json({ error: "This pack is not on sale." }, 400);
    const pence = pack.final_price_pence == null ? null : asInt(pack.final_price_pence);
    if (pence == null) return json({ error: "This pack is not on sale." }, 400);
    if (pence === 0) return json({ error: "This pack is free." }, 400);
    if (user.id === pack.creator_user_id) {
      return json({ error: "This is your pack. Players buy it from the catalogue." }, 400);
    }
    if (await buyerOwns(sql, user.id, pack.id)) {
      return json({ error: "You already have this pack." }, 409);
    }
    if (!pack.payouts_ready || !pack.stripe_account_id) {
      return json(
        { error: "This creator is still setting up payouts. You cannot buy this pack yet." },
        409,
      );
    }
    const split = splitSalePence(pence);
    const origin = requestOrigin(request);
    try {
      const session = await stripeClient().checkout.sessions.create({
        mode: "payment",
        customer_email: user.email ?? undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: pence,
              product_data: {
                name: pack.name,
                description: `${formatPenceLabel(pence)} unlocks this creator pack on Opening Lab.`,
              },
            },
          },
        ],
        payment_intent_data: {
          ...(split.platformPence > 0 ? { application_fee_amount: split.platformPence } : {}),
          transfer_data: { destination: pack.stripe_account_id },
          metadata: { kind: "creator_pack", packId: pack.id, userId: user.id },
        },
        success_url: `${origin}/creator-packs/pack/${pack.id}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/creator-packs/pack/${pack.id}`,
        client_reference_id: user.id,
        metadata: {
          kind: "creator_pack",
          packId: pack.id,
          userId: user.id,
          amountPence: String(pence),
          creatorAccountId: pack.stripe_account_id,
        },
      });
      if (!session.url) return json({ error: "Could not start checkout" }, 500);
      return json({ url: session.url });
    } catch (err) {
      console.error("[creator-packs] checkout", err);
      return json({ error: "Stripe could not start checkout. No payment was taken." }, 502);
    }
  });
}

async function transferIdForSession(session: Stripe.Checkout.Session): Promise<{
  paymentIntentId: string | null;
  transferId: string | null;
}> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  if (!paymentIntentId || !creatorPaymentsEnabled()) {
    return { paymentIntentId, transferId: null };
  }
  try {
    const intent = await stripeClient().paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const charge = intent.latest_charge;
    if (charge && typeof charge === "object") {
      const transfer = charge.transfer;
      const transferId = typeof transfer === "string" ? transfer : transfer?.id ?? null;
      return { paymentIntentId, transferId };
    }
  } catch (err) {
    console.error("[creator-packs] transfer lookup", err);
  }
  return { paymentIntentId, transferId: null };
}

/**
 * Record a paid creator-pack Checkout session. Idempotent on the session id
 * and on the buyer plus pack. Called from the webhook and from the success page.
 */
export async function recordCreatorPackCheckout(
  session: Stripe.Checkout.Session,
): Promise<"recorded" | "ignored"> {
  if (session.metadata?.kind !== "creator_pack") return "ignored";
  const paid = session.payment_status === "paid" || session.status === "complete";
  if (!paid) return "ignored";
  const packId = session.metadata.packId?.trim() ?? "";
  const buyerId = session.metadata.userId?.trim() || session.client_reference_id?.trim() || "";
  const expected = Number(session.metadata.amountPence);
  if (!PACK_ID.test(packId) || !buyerId || !Number.isInteger(expected) || expected <= 0) {
    return "ignored";
  }
  if (session.amount_total !== expected || (session.currency ?? "").toLowerCase() !== "gbp") {
    console.error("[creator-packs] paid session did not match the pack price");
    return "ignored";
  }
  const split = splitSalePence(expected);
  const { paymentIntentId, transferId } = await transferIdForSession(session);
  const sql = await getSql();
  const saleId = randomUUID();
  await sql.query(
    `insert into creator_sales (
       id, pack_id, buyer_user_id, channel, amount_pence, currency,
       creator_share_pence, platform_share_pence,
       stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id,
       transferred_at
     ) values ($1, $2, $3, 'web', $4, 'gbp', $5, $6, $7, $8, $9, now())
     on conflict do nothing`,
    [
      saleId,
      packId,
      buyerId,
      expected,
      split.creatorPence,
      split.platformPence,
      session.id,
      paymentIntentId,
      transferId,
    ],
  );
  await sql.query(
    `insert into creator_pack_unlocks (buyer_user_id, pack_id, sale_id)
     select $1, $2, s.id
       from creator_sales s
      where s.buyer_user_id = $1 and s.pack_id = $2
     on conflict do nothing`,
    [buyerId, packId],
  );
  return "recorded";
}

export async function confirmCreatorCheckoutResponse(request: Request): Promise<Response> {
  if (!creatorPaymentsEnabled()) return json({ ok: false, error: "Payments are not configured" }, 503);
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId || !sessionId.startsWith("cs_")) return json({ ok: false }, 400);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripeClient().checkout.sessions.retrieve(sessionId);
  } catch {
    return json({ ok: false }, 400);
  }
  if (session.metadata?.kind !== "creator_pack") return json({ ok: false }, 400);
  try {
    const recorded = await recordCreatorPackCheckout(session);
    if (recorded !== "recorded") return json({ ok: false });
  } catch (err) {
    console.error("[creator-packs] confirm", err);
    return json({ ok: false, error: "Could not save the unlock yet." }, 500);
  }
  const user = await signedInUser(request);
  const buyerId = session.metadata.userId?.trim() || "";
  if (!user || user.id !== buyerId) return json({ ok: false }, 403);
  return json({ ok: true, packId: session.metadata.packId });
}

export async function syncCreatorConnectAccount(account: Stripe.Account): Promise<void> {
  if (!account.id) return;
  const sql = await getSql();
  await sql.query(
    `update creator_profiles
        set payouts_ready = $2, updated_at = now()
      where stripe_account_id = $1`,
    [account.id, accountPayoutsReady(account)],
  );
}

type AdminPack = {
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

export async function creatorAdminQueueResponse(request: Request): Promise<Response> {
  const user = await signedInUser(request);
  if (!user) return json({ error: "Sign in required" }, 401);
  const access = creatorAdminStatus(user.email);
  if (access === "unset") {
    return json(
      {
        error: "This desk is locked. Opening Lab has not named the review account yet.",
        code: "allow_list_unset",
      },
      403,
    );
  }
  if (access !== "ok") {
    return json({ error: "This desk is for the Opening Lab review account.", code: "forbidden" }, 403);
  }
  return withSql(async (sql) => {
    const rows = await sql.query<PackRow>(
      `${PACK_SELECT}
       order by case p.status when 'review' then 0 when 'returned' then 1 else 2 end,
                p.updated_at desc
       limit 100`,
    );
    const sales = await sql.query<{
      user_id: string;
      display_name: string;
      web_count: number;
      web_pence: number;
      web_share: number;
      play_waiting_count: number;
      play_waiting_pence: number;
    }>(
      `select pr.user_id, pr.display_name,
              count(*) filter (where s.channel = 'web')::int as web_count,
              coalesce(sum(s.amount_pence) filter (where s.channel = 'web'), 0)::int as web_pence,
              coalesce(sum(s.creator_share_pence) filter (where s.channel = 'web'), 0)::int as web_share,
              count(*) filter (where s.channel = 'play' and s.transferred_at is null)::int as play_waiting_count,
              coalesce(sum(s.creator_share_pence) filter (where s.channel = 'play' and s.transferred_at is null), 0)::int as play_waiting_pence
         from creator_sales s
         join creator_packs pk on pk.id = s.pack_id
         join creator_profiles pr on pr.user_id = pk.creator_user_id
        group by pr.user_id, pr.display_name
        order by pr.display_name`,
    );
    const packs: AdminPack[] = [];
    for (const row of rows) {
      if (!isStatus(row.status)) continue;
      const lines = await loadLines(sql, row.id);
      packs.push({
        id: row.id,
        name: row.name,
        creatorName: row.display_name,
        creatorUserId: row.creator_user_id,
        lineCount: lines.length,
        suggestedPrice: formatPenceLabel(asInt(row.suggested_price_pence)),
        finalPrice: row.final_price_pence == null ? "" : formatPenceLabel(asInt(row.final_price_pence)),
        status: row.status,
        payoutsReady: row.payouts_ready,
        reviewNote: row.review_note,
        lines: lines.map((line) => ({
          name: line.name,
          mode: line.mode === "walk" ? "walk" : "drill",
          plyCount: asStrings(line.plies).length,
          comments: asStrings(line.comments),
        })),
      });
    }
    return json({
      packs,
      sales: sales.map((row) => ({
        creatorUserId: row.user_id,
        creatorName: row.display_name,
        webCount: asInt(row.web_count),
        webPence: asInt(row.web_pence),
        webSharePence: asInt(row.web_share),
        playWaitingCount: asInt(row.play_waiting_count),
        playWaitingPence: asInt(row.play_waiting_pence),
      })),
    });
  });
}

export async function reviewCreatorPackResponse(request: Request): Promise<Response> {
  const user = await signedInUser(request);
  if (!user) return json({ error: "Sign in required" }, 401);
  if (creatorAdminStatus(user.email) !== "ok") {
    return json({ error: "This desk is for the Opening Lab review account." }, 403);
  }
  let body: { packId?: unknown; action?: unknown; finalPrice?: unknown; note?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "The review could not be read." }, 400);
  }
  if (typeof body.packId !== "string" || !PACK_ID.test(body.packId)) {
    return json({ error: "Missing pack" }, 400);
  }
  if (body.action !== "approve" && body.action !== "return") {
    return json({ error: "Choose approve or send back." }, 400);
  }
  return withSql(async (sql) => {
    const pack = await loadPack(sql, body.packId as string);
    if (!pack) return json({ error: "This pack is not available." }, 404);
    if (body.action === "return") {
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
      const blocked = firstPurchaseLink([note]);
      if (blocked) return json({ error: blocked }, 400);
      await sql.query(
        `update creator_packs
            set status = 'returned', review_note = $2, updated_at = now()
          where id = $1`,
        [pack.id, note],
      );
      return json({ ok: true, status: "returned" });
    }
    const raw = typeof body.finalPrice === "string" ? body.finalPrice.trim() : "";
    const pence = raw ? labelToPence(raw) : asInt(pack.suggested_price_pence);
    if (pence === null) {
      return json(
        { error: "Enter a price such as 2.50, or leave the field blank to keep the suggestion." },
        400,
      );
    }
    await sql.query(
      `update creator_packs
          set status = 'live',
              final_price_pence = $2,
              review_note = '',
              updated_at = now()
        where id = $1`,
      [pack.id, pence],
    );
    return json({ ok: true, status: "live", finalPrice: formatPenceLabel(pence) });
  });
}
