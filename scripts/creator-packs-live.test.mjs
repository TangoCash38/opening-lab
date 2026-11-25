import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

test("creator pack tables keep play sales for later and store no bank details", () => {
  const sql = src("migrations/0012_creator_packs.sql");
  assert.match(sql, /create table if not exists creator_profiles/);
  assert.match(sql, /create table if not exists creator_packs/);
  assert.match(sql, /create table if not exists creator_pack_lines/);
  assert.match(sql, /create table if not exists creator_sales/);
  assert.match(sql, /create table if not exists creator_pack_unlocks/);
  assert.match(sql, /channel in \('web', 'play'\)/);
  assert.match(sql, /stripe_account_id text/);
  assert.doesNotMatch(sql, /password|iban|sort_code|account_number|email/i);
  assert.doesNotMatch(sql, /purchases/);
});

test("website sales use a destination charge and the review desk is an allow-list", () => {
  const server = src("src/lib/creator-packs.server.ts");
  const webhook = src("src/lib/stripe.server.ts");
  const client = src("src/lib/creator-packs-client.ts");
  assert.match(server, /transfer_data: \{ destination: pack\.stripe_account_id \}/);
  assert.match(server, /application_fee_amount: split\.platformPence/);
  assert.match(server, /type: "express"/);
  assert.doesNotMatch(server, /on_behalf_of\s*:/);
  assert.match(server, /CREATOR_PACKS_ADMIN_EMAILS/);
  assert.match(server, /channel = 'web'/);
  assert.doesNotMatch(server, /applyPurchase|insert into purchases/i);
  assert.match(webhook, /kind === "creator_pack"/);
  assert.match(webhook, /account\.updated/);
  assert.match(webhook, /recordCreatorPackCheckout/);
  assert.match(client, /fetch\(path/);
  assert.match(client, /getBearerToken/);
  assert.match(client, /\/api\/creator-packs/);
  assert.doesNotMatch(client, /sk_live|sk_test/);
  for (const file of [
    "src/components/opening-lab/creator-packs-browse.tsx",
    "src/components/opening-lab/creator-packs-pack.tsx",
    "src/components/opening-lab/creator-packs-dashboard.tsx",
    "src/components/opening-lab/creator-packs-admin.tsx",
    "src/components/opening-lab/creator-packs-get-paid.tsx",
    "src/components/opening-lab/creator-packs-editor.tsx",
  ]) {
    assert.doesNotMatch(src(file), /fetch\(/);
    assert.doesNotMatch(src(file), /from ["']stripe["']/);
  }
});

test("a creator pack must be legal chess and cannot carry a website address", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
        import { validateCreatorPack } from "./src/lib/creator-packs-content.ts";
        const good = validateCreatorPack({
          name: "Quiet centre",
          blurb: "A short line.",
          suggestedPrice: "£2.50",
          lines: [{
            name: "The modest centre",
            mode: "drill",
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            plies: ["e4", "e5"],
            comments: ["The king's pawn steps out.", "Black answers."],
          }],
        });
        if (!good.ok || good.pack.suggestedPricePence !== 250) process.exit(2);
        const link = validateCreatorPack({
          name: "Quiet centre",
          blurb: "See coach.example.com",
          suggestedPrice: "Free",
          lines: [{
            name: "Line",
            mode: "walk",
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            plies: ["e4"],
            comments: [""],
          }],
        });
        if (link.ok) process.exit(3);
        const illegal = validateCreatorPack({
          name: "Quiet centre",
          blurb: "",
          suggestedPrice: "Free",
          lines: [{
            name: "Line",
            mode: "drill",
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            plies: ["e5"],
            comments: ["Not White's move."],
          }],
        });
        if (illegal.ok) process.exit(4);
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
