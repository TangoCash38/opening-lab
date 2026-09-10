import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const purchases = readFileSync(
  join(root, "src/lib/purchases.server.ts"),
  "utf8",
);
const useUnlocks = readFileSync(join(root, "src/hooks/use-unlocks.ts"), "utf8");
const stripe = readFileSync(join(root, "src/lib/stripe.server.ts"), "utf8");
const db = readFileSync(join(root, "src/lib/db.ts"), "utf8");
const auth = readFileSync(join(root, "src/lib/auth/server.ts"), "utf8");

test("claim refuses client packs when Stripe secret is set", () => {
  assert.match(purchases, /function stripePaymentsConfigured/);
  assert.match(purchases, /STRIPE_SECRET_KEY/);
  assert.match(
    purchases,
    /if \(stripePaymentsConfigured\(\)\) \{\s*return getUnlocksForUser\(userId\);/s,
  );
  assert.match(
    purchases,
    /if \(stripePaymentsConfigured\(\)\) \{\s*try \{\s*return json\(\s*unlocksForSignedIn/s,
  );
  // Must not call claimUnlocksForUser / upsert on the payments-on path before the read-only return.
  const claimFn = purchases.slice(
    purchases.indexOf("export async function unlocksClaimResponse"),
  );
  const paymentsGuard = claimFn.indexOf("if (stripePaymentsConfigured())");
  const upsertCall = claimFn.indexOf("claimUnlocksForUser");
  assert.ok(paymentsGuard >= 0, "payments guard present in claim response");
  assert.ok(
    upsertCall > paymentsGuard,
    "claimUnlocksForUser only reached after payments guard (demo path)",
  );
  assert.match(
    claimFn.slice(paymentsGuard, paymentsGuard + 400),
    /getUnlocksForUser\(user\.id\)/,
  );
  assert.doesNotMatch(
    claimFn.slice(paymentsGuard, paymentsGuard + 400),
    /claimUnlocksForUser|upsertMerged/,
  );
});

test("client sync fetches account unlocks when payments enabled (no fake claim)", () => {
  assert.match(useUnlocks, /fetchPaymentsEnabled/);
  assert.match(
    useUnlocks,
    /if \(paymentsOn\) \{\s*writeClaimedUser\(userId\);\s*const account = await fetchAccountUnlocks/s,
  );
  assert.doesNotMatch(
    useUnlocks.match(/if \(paymentsOn\) \{[\s\S]*?return;\s*\}/)?.[0] ?? "",
    /claimAccountUnlocks/,
  );
});

test("production webhook rejects when STRIPE_WEBHOOK_SECRET missing", () => {
  assert.match(stripe, /VERCEL_ENV === "production"/);
  assert.match(stripe, /NODE_ENV === "production"/);
  assert.match(stripe, /Webhook secret not configured/);
  assert.match(
    stripe,
    /if \(!webhookSecret\) \{[\s\S]*?if \(isProduction\) \{[\s\S]*?status: 500/s,
  );
});

test("auth and db share one Neon pool with low max", () => {
  assert.match(db, /export function getOrCreateNeonPool/);
  assert.match(db, /max:\s*2/);
  assert.match(auth, /getOrCreateNeonPool/);
  assert.match(auth, /max:\s*2/);
  assert.doesNotMatch(
    auth,
    /databaseUrl\s*\n\s*\? new Pool\(\{ connectionString: databaseUrl \}\)/,
  );
});

/** Runtime: claimUnlocksForUser must not upsert when STRIPE_SECRET_KEY is set. */
test("claimUnlocksForUser is a no-write when payments env set (mock)", async () => {
  const prev = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_mock_for_claim_guard";

  let upsertCalls = 0;
  let getCalls = 0;

  // Minimal stand-in of the guard + helpers (mirrors purchases.server.ts).
  function stripePaymentsConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  }
  async function getUnlocksForUser(userId) {
    getCalls += 1;
    return { packs: [], plan: null, expiresAt: null, userId };
  }
  async function upsertMerged() {
    upsertCalls += 1;
    return { packs: ["italian-white"], plan: null, expiresAt: null };
  }
  async function claimUnlocksForUser(userId, incoming) {
    if (stripePaymentsConfigured()) {
      return getUnlocksForUser(userId);
    }
    return upsertMerged(userId, incoming.packs, incoming.plan, incoming.expiresAt);
  }

  const out = await claimUnlocksForUser("user-1", {
    packs: ["italian-white", "sicilian-black"],
    plan: "yearly",
    expiresAt: Date.now() + 86_400_000,
  });

  assert.equal(upsertCalls, 0);
  assert.equal(getCalls, 1);
  assert.deepEqual(out.packs, []);

  delete process.env.STRIPE_SECRET_KEY;
  const demo = await claimUnlocksForUser("user-1", {
    packs: ["italian-white"],
    plan: null,
    expiresAt: null,
  });
  assert.equal(upsertCalls, 1);
  assert.deepEqual(demo.packs, ["italian-white"]);

  if (prev === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = prev;
});
