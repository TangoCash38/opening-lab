import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

test("creator agreement is private, linked, and required before submit", () => {
  const page = src("src/components/opening-lab/creator-packs-agreement.tsx");
  const route = src("src/routes/creator-packs_.agreement.tsx");
  const become = src("src/components/opening-lab/creator-packs-become.tsx");
  const editor = src("src/components/opening-lab/creator-packs-editor.tsx");
  const server = src("src/lib/creator-packs.server.ts");
  assert.match(route, /noindex, nofollow/);
  assert.match(page, /You keep 70%/);
  assert.match(page, /Opening Lab keeps 30%/);
  assert.match(page, /sets the final price/);
  assert.match(page, /only on Opening Lab/);
  assert.match(page, /Stripe Connect/);
  assert.match(page, /once a month/);
  assert.match(page, /you own the lines/);
  assert.match(page, /may send a pack back, or remove it/);
  assert.match(page, /share of that refund is reversed/);
  assert.match(page, /Tax on your share is your responsibility/);
  assert.match(page, /checked by a solicitor/);
  assert.doesNotMatch(page, /—|–/);
  assert.match(become, /\/creator-packs\/agreement/);
  assert.match(editor, /\/creator-packs\/agreement/);
  assert.match(editor, /data-creator-accept/);
  assert.match(server, /acceptedAgreement/);
  assert.match(server, /CREATOR_SUBMIT_LIMIT/);
});

test("split, review, refund, and Play tiers", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
        import { splitSalePence, creatorSharePence } from "./src/lib/creator-packs-payout.ts";
        import { reversalForRefund } from "./src/lib/creator-packs-refund.ts";
        import { reviewDecision } from "./src/lib/creator-packs-review-decision.ts";
        import { submitIsLimited, CREATOR_SUBMIT_LIMIT } from "./src/lib/creator-packs-limits.ts";
        import { playSkuForCreatorPence, creatorPenceForPlaySku } from "./src/lib/creator-packs-play.ts";

        const a = splitSalePence(250);
        if (a.creatorPence !== 175 || a.platformPence !== 75) process.exit(2);
        const b = splitSalePence(100);
        if (b.creatorPence !== 70 || b.platformPence !== 30) process.exit(3);
        const c = splitSalePence(1);
        if (c.creatorPence + c.platformPence !== 1) process.exit(4);
        if (creatorSharePence(0) !== 0) process.exit(5);
        if (splitSalePence(101).creatorPence !== 71) process.exit(6);

        const full = reversalForRefund({
          saleAmountPence: 250,
          creatorSharePence: 175,
          alreadyReversedPence: 0,
          amountRefundedPence: 250,
        });
        if (full.reversalPence !== 175 || full.fullyRefunded !== true) process.exit(7);
        const partial = reversalForRefund({
          saleAmountPence: 250,
          creatorSharePence: 175,
          alreadyReversedPence: 0,
          amountRefundedPence: 100,
        });
        if (partial.reversalPence !== 70 || partial.fullyRefunded !== false) process.exit(8);
        const again = reversalForRefund({
          saleAmountPence: 250,
          creatorSharePence: 175,
          alreadyReversedPence: 70,
          amountRefundedPence: 100,
        });
        if (again.reversalPence !== 0) process.exit(9);

        const sent = reviewDecision({ action: "return", finalPrice: "", suggestedPence: 250, note: "Too short" });
        if (sent.ok) process.exit(10);
        const back = reviewDecision({
          action: "return",
          finalPrice: "",
          suggestedPence: 250,
          note: "Please shorten the comments on move 3.",
        });
        if (!back.ok || back.status !== "returned") process.exit(11);
        const live = reviewDecision({ action: "approve", finalPrice: "", suggestedPence: 250, note: "" });
        if (!live.ok || live.status !== "live" || live.finalPence !== 250) process.exit(12);
        const priced = reviewDecision({ action: "approve", finalPrice: "3.00", suggestedPence: 250, note: "" });
        if (!priced.ok || priced.finalPence !== 300) process.exit(13);
        const bad = reviewDecision({ action: "approve", finalPrice: "nope", suggestedPence: 250, note: "" });
        if (bad.ok) process.exit(14);

        if (!submitIsLimited(CREATOR_SUBMIT_LIMIT)) process.exit(15);
        if (submitIsLimited(CREATOR_SUBMIT_LIMIT - 1)) process.exit(16);
        if (playSkuForCreatorPence(250) !== "creator_pack_250") process.exit(17);
        if (playSkuForCreatorPence(400) !== null) process.exit(18);
        if (creatorPenceForPlaySku("creator_pack_150") !== 150) process.exit(19);
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("webhook reverses a creator refund and records a lost dispute", () => {
  const webhook = src("src/lib/stripe.server.ts");
  const server = src("src/lib/creator-packs.server.ts");
  assert.match(webhook, /charge\.refunded/);
  assert.match(webhook, /refundCreatorPackCharge/);
  assert.match(webhook, /charge\.dispute\.created/);
  assert.match(webhook, /charge\.dispute\.closed/);
  assert.match(webhook, /syncCreatorPackDispute/);
  assert.match(server, /transfers\.createReversal/);
  assert.match(server, /delete from creator_pack_unlocks/);
  assert.match(server, /status === "lost"/);
  assert.match(server, /channel = 'play'/);
  assert.match(server, /verifyPlayOneTimeProduct/);
  assert.match(server, /not_connected/);
});
