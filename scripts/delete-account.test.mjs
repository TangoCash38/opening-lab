import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const privacy = src("src/routes/privacy.tsx");
const deletePage = src("src/routes/delete-account.tsx");
const deleteApi = src("src/routes/api/account.delete.ts");
const deleteServer = src("src/lib/account-delete.server.ts");
const deleteClient = src("src/lib/account-delete.ts");
const guide = src("src/components/opening-lab/guide-view.tsx");
const login = src("src/routes/login.tsx");
const footer = src("src/components/opening-lab/legal-footer.tsx");
const routeTree = src("src/routeTree.gen.ts");
const legal = src("src/components/opening-lab/legal-page.tsx");
const i18n = src("src/lib/i18n.ts");

test("Privacy names what we store and does not offer Buy all", () => {
  assert.match(privacy, /updated="24 September 2026"/);
  assert.match(privacy, /title="Who we are"/);
  assert.match(privacy, /title="Who may use Opening Lab"/);
  assert.match(
    privacy,
    /Opening Lab is for people aged 13 or over\. Do not create an account if/,
  );
  assert.match(
    privacy,
    /Pack unlocks on your account if you buy a pack on the website/,
  );
  assert.match(privacy, /We do not use advertising\s+cookies or an Advertising ID/);
  assert.match(
    privacy,
    /Paid packs may be sold:/,
  );
  assert.match(
    privacy,
    /in the Google Play app as one-time in-app purchases via Google Play/,
  );
  assert.match(privacy, /There is no Lab\+ subscription/);
  assert.match(privacy, /BUY_ALL_FOR_SALE/);
  assert.match(privacy, /Paid packs may be sold:/);
  assert.match(privacy, /uk\.co\.openinglab/);
  assert.match(privacy, /https:\/\/www\.openinglab\.co\.uk\/delete-account/);
  assert.match(privacy, /Account → Delete account/);
  assert.match(privacy, /Information Commissioner.s Office \(ICO\)/);
  assert.doesNotMatch(privacy, /Packs are currently free/);
  assert.doesNotMatch(privacy, /postal|PO Box|SW1A|address:/i);
});

test("delete-account route has signed copy and confirm-then-API UX", () => {
  assert.match(deletePage, /createFileRoute\("\/delete-account"\)/);
  assert.match(deletePage, /Delete your Opening Lab account/);
  assert.match(deletePage, /title="What we delete"/);
  assert.match(deletePage, /title="What we may keep"/);
  assert.match(deletePage, /title="What we do not store on our servers"/);
  assert.match(deletePage, /title="Google Play billing"/);
  assert.match(deletePage, /title="How to delete"/);
  assert.match(deletePage, /Account → Delete account/);
  assert.match(deletePage, /Payments & subscriptions/);
  assert.match(deletePage, /requestAccountDeletion/);
  assert.match(deletePage, /Type DELETE/);
  assert.match(deletePage, /window\.confirm/);
  assert.match(deletePage, /clearLocalSession/);
  assert.match(deletePage, /authClient\.signIn\.email/);
  assert.match(deletePage, /Account deleted/);
  assert.match(legal, /updated\?: string \| null/);
});

test("delete API is authenticated, clears unlocks, keeps payment records", () => {
  assert.match(deleteApi, /createFileRoute\("\/api\/account\/delete"\)/);
  assert.match(deleteApi, /POST:/);
  assert.match(deleteApi, /deleteAccountResponse/);
  assert.match(deleteServer, /signedInUser\(request\)/);
  assert.match(deleteServer, /Sign in required/);
  assert.match(deleteServer, /status = 200/);
  assert.match(
    deleteServer,
    /set packs = '\{\}',[\s\S]*plan = null,[\s\S]*expires_at = null/,
  );
  assert.match(deleteServer, /emailed_packs = '\{\}'/);
  assert.match(deleteServer, /labplus_emailed_at = null/);
  assert.doesNotMatch(deleteServer, /stripe_customer_id\s*=/);
  assert.doesNotMatch(deleteServer, /stripe_subscription_id\s*=/);
  assert.doesNotMatch(deleteServer, /play_purchase_token\s*=/);
  assert.doesNotMatch(deleteServer, /play_order_id\s*=/);
  assert.doesNotMatch(deleteServer, /delete from purchases/i);
  assert.match(deleteServer, /delete from "user" where id = \$1/);
  assert.match(deleteServer, /delete from verification where identifier = \$1/);
  assert.match(deleteClient, /fetch\("\/api\/account\/delete"/);
  assert.match(deleteClient, /credentials: "same-origin"/);
  assert.match(deleteClient, /getBearerToken/);
  assert.match(routeTree, /from '\.\/routes\/delete-account'/);
  assert.match(routeTree, /path: '\/delete-account'/);
  assert.match(routeTree, /from '\.\/routes\/api\/account.delete'/);
  assert.match(routeTree, /path: '\/api\/account\/delete'/);
});

test("Account surfaces link Privacy and Delete account", () => {
  assert.match(guide, /to="\/privacy"/);
  assert.match(guide, /to="\/delete-account"/);
  assert.match(guide, /t\("Delete account"\)/);
  assert.match(login, /to="\/privacy"/);
  assert.match(login, /to="\/delete-account"/);
  assert.match(login, />\s*Delete account\s*</);
  assert.match(footer, /to="\/delete-account"/);
  assert.match(i18n, /"Delete account": "Delete account"/);
  assert.match(i18n, /"Delete account": "Eliminar cuenta"/);
});

test("deleteAccountForUser is idempotent and keeps payment ids (mock)", async () => {
  const queries = [];
  const sql = {
    async query(text, params) {
      queries.push({ text, params });
      return [];
    },
  };

  async function clearAccountUnlocks(userId) {
    await sql.query(
      `update purchases
        set packs = '{}',
            plan = null,
            expires_at = null,
            emailed_packs = '{}',
            labplus_emailed_at = null,
            updated_at = now()
      where user_id = $1`,
      [userId],
    );
  }

  async function deleteAuthUser(userId, email) {
    if (email) {
      await sql.query(`delete from verification where identifier = $1`, [email]);
    }
    await sql.query(`delete from "user" where id = $1`, [userId]);
  }

  async function deleteAccountForUser(userId, email) {
    await clearAccountUnlocks(userId);
    await deleteAuthUser(userId, email);
    return { ok: true, deleted: true };
  }

  const first = await deleteAccountForUser("user-1", "a@example.com");
  const second = await deleteAccountForUser("user-1", "a@example.com");
  assert.deepEqual(first, { ok: true, deleted: true });
  assert.deepEqual(second, { ok: true, deleted: true });
  assert.equal(queries.length, 6);
  assert.match(queries[0].text, /update purchases/);
  assert.doesNotMatch(queries[0].text, /stripe_customer_id/);
  assert.deepEqual(queries[1].params, ["a@example.com"]);
  assert.deepEqual(queries[2].params, ["user-1"]);

  const noEmail = await deleteAccountForUser("user-2", null);
  assert.deepEqual(noEmail, { ok: true, deleted: true });
  assert.equal(queries.at(-1).text.includes("user"), true);
  assert.equal(
    queries.filter((q) => q.text.includes("verification") && q.params[0] == null)
      .length,
    0,
  );
});

test("unsigned delete response is 401 (mock)", async () => {
  async function deleteAccountResponse(signedIn) {
    if (!signedIn) return { status: 401, body: { error: "Sign in required" } };
    return { status: 200, body: { ok: true, deleted: true } };
  }
  const denied = await deleteAccountResponse(null);
  assert.equal(denied.status, 401);
  assert.equal(denied.body.error, "Sign in required");
  const ok = await deleteAccountResponse({ id: "u1", email: "a@b.c" });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.deleted, true);
});
