import assert from "node:assert/strict";
import { createServer } from "vite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import Stripe from "stripe";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Signature checks must not touch a configured database, and the connect
// secret must start unset so each case sets only what it means to test.
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_WEBHOOK_SECRET;
delete process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
process.env.NODE_ENV = "test";

const PLATFORM_SECRET = "whsec_test_platform_destination";
const CONNECT_SECRET = "whsec_test_connect_destination";

const vite = await createServer({
  configFile: false,
  root,
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true },
  resolve: { alias: { "@": join(root, "src") } },
});

const stripeServer = await vite.ssrLoadModule("/src/lib/stripe.server.ts");
const db = await vite.ssrLoadModule("/src/lib/db.ts");

function sign(raw, secret) {
  return Stripe.webhooks.generateTestHeaderString({ payload: raw, secret });
}

async function post(payload, signature) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  const headers = new Headers();
  if (signature) headers.set("stripe-signature", signature);
  const response = await stripeServer.handleStripeWebhook(
    new Request("https://www.openinglab.co.uk/api/stripe/webhook", {
      method: "POST",
      headers,
      body: raw,
    }),
  );
  const text = await response.text();
  return { status: response.status, text };
}

function platformEvent() {
  return {
    id: "evt_platform_charge",
    object: "event",
    type: "charge.succeeded",
    data: { object: { id: "ch_platform", object: "charge" } },
  };
}

function accountUpdatedEvent(accountId, ready) {
  return {
    id: `evt_${accountId}_${ready ? "ready" : "pending"}`,
    object: "event",
    account: accountId,
    type: "account.updated",
    data: {
      object: {
        id: accountId,
        object: "account",
        type: "express",
        charges_enabled: ready,
        payouts_enabled: ready,
        details_submitted: ready,
        capabilities: {
          card_payments: ready ? "active" : "pending",
          transfers: ready ? "active" : "pending",
        },
      },
    },
  };
}

async function withEnv(values, run) {
  const previous = new Map();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function payoutsReady(accountId) {
  const sql = await db.getSql();
  const rows = await sql.query(
    `select payouts_ready from creator_profiles where stripe_account_id = $1`,
    [accountId],
  );
  assert.equal(rows.length, 1, `creator profile for ${accountId}`);
  return rows[0].payouts_ready === true;
}

test.describe("stripe webhook signatures", { concurrency: 1, timeout: 120_000 }, () => {
  test("platform-signed event is accepted", async () => {
    await withEnv(
      {
        STRIPE_WEBHOOK_SECRET: PLATFORM_SECRET,
        STRIPE_CONNECT_WEBHOOK_SECRET: CONNECT_SECRET,
      },
      async () => {
        const raw = JSON.stringify(platformEvent());
        const response = await post(raw, sign(raw, PLATFORM_SECRET));
        assert.equal(response.status, 200, response.text);
        assert.deepEqual(JSON.parse(response.text), { received: true });
      },
    );
  });

  test("connect-signed account.updated updates the matching creator", async () => {
    const readyId = "acct_creator_ready";
    const otherId = "acct_creator_other";
    const sql = await db.getSql();
    await sql.query(
      `insert into creator_profiles (user_id, display_name, stripe_account_id, payouts_ready)
       values ($1, 'Ready Creator', $2, false), ($3, 'Other Creator', $4, false)`,
      ["user-ready", readyId, "user-other", otherId],
    );

    await withEnv(
      {
        STRIPE_WEBHOOK_SECRET: PLATFORM_SECRET,
        STRIPE_CONNECT_WEBHOOK_SECRET: CONNECT_SECRET,
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      },
      async () => {
        const readyRaw = JSON.stringify(accountUpdatedEvent(readyId, true));
        const ready = await post(readyRaw, sign(readyRaw, CONNECT_SECRET));
        assert.equal(ready.status, 200, ready.text);
        assert.equal(await payoutsReady(readyId), true);
        assert.equal(await payoutsReady(otherId), false);

        const pendingRaw = JSON.stringify(accountUpdatedEvent(readyId, false));
        const pending = await post(pendingRaw, sign(pendingRaw, CONNECT_SECRET));
        assert.equal(pending.status, 200, pending.text);
        assert.equal(await payoutsReady(readyId), false);

        delete process.env.STRIPE_WEBHOOK_SECRET;
        const onlyConnectRaw = JSON.stringify(accountUpdatedEvent(readyId, true));
        const onlyConnect = await post(onlyConnectRaw, sign(onlyConnectRaw, CONNECT_SECRET));
        assert.equal(onlyConnect.status, 200, onlyConnect.text);
        assert.equal(await payoutsReady(readyId), true);

        const unsigned = await post(onlyConnectRaw, undefined);
        assert.equal(unsigned.status, 400);
        assert.equal(unsigned.text, "Missing signature");
      },
    );
  });

  test("bad signature is rejected", async () => {
    await withEnv(
      {
        STRIPE_WEBHOOK_SECRET: PLATFORM_SECRET,
        STRIPE_CONNECT_WEBHOOK_SECRET: CONNECT_SECRET,
      },
      async () => {
        const raw = JSON.stringify(platformEvent());
        const response = await post(raw, sign(raw, "whsec_test_neither_destination"));
        assert.equal(response.status, 400);
        assert.equal(response.text, "Invalid signature");
      },
    );
  });

  test("unset STRIPE_CONNECT_WEBHOOK_SECRET keeps the platform-only behaviour", async () => {
    await withEnv(
      {
        STRIPE_WEBHOOK_SECRET: PLATFORM_SECRET,
        STRIPE_CONNECT_WEBHOOK_SECRET: undefined,
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      },
      async () => {
        const raw = JSON.stringify(platformEvent());
        const accepted = await post(raw, sign(raw, PLATFORM_SECRET));
        assert.equal(accepted.status, 200, accepted.text);

        const foreign = await post(raw, sign(raw, CONNECT_SECRET));
        assert.equal(foreign.status, 400);
        assert.equal(foreign.text, "Invalid signature");

        const missing = await post(raw, undefined);
        assert.equal(missing.status, 400);
        assert.equal(missing.text, "Missing signature");
      },
    );

    await withEnv(
      {
        STRIPE_WEBHOOK_SECRET: undefined,
        STRIPE_CONNECT_WEBHOOK_SECRET: undefined,
        NODE_ENV: "test",
        VERCEL_ENV: undefined,
      },
      async () => {
        const unsigned = await post(JSON.stringify(platformEvent()), undefined);
        assert.equal(unsigned.status, 200, unsigned.text);
        assert.deepEqual(JSON.parse(unsigned.text), { received: true });
      },
    );

    await withEnv(
      {
        STRIPE_WEBHOOK_SECRET: undefined,
        STRIPE_CONNECT_WEBHOOK_SECRET: undefined,
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      },
      async () => {
        const blocked = await post(JSON.stringify(platformEvent()), undefined);
        assert.equal(blocked.status, 500);
        assert.equal(blocked.text, "Webhook secret not configured");
      },
    );
  });
});

test.after(async () => {
  try {
    const pg = await db.getPglite();
    await pg.close();
  } catch {
    // Database bootstrap did not open PGLite.
  }
  await vite.close();
});
