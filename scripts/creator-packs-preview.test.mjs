import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const flag = src("src/lib/creator-packs-flag.ts");
const landing = src("src/components/opening-lab/home-intro.tsx");
const demo = src("src/data/creator-packs-demo.ts");
const browse = src("src/components/opening-lab/creator-packs-browse.tsx");
const pack = src("src/components/opening-lab/creator-packs-pack.tsx");
const become = src("src/components/opening-lab/creator-packs-become.tsx");
const editor = src("src/components/opening-lab/creator-packs-editor.tsx");
const frame = src("src/components/opening-lab/creator-packs-frame.tsx");
const study = src("src/components/opening-lab/creator-packs-study.tsx");
const ratings = src("src/components/opening-lab/creator-packs-ratings.tsx");
const help = src("src/components/opening-lab/creator-packs-help.tsx");
const dashboard = src("src/components/opening-lab/creator-packs-dashboard.tsx");
const admin = src("src/components/opening-lab/creator-packs-admin.tsx");
const helpEmail = src("src/lib/creator-packs-help.ts");
const review = src("src/lib/creator-packs-review.ts");
const payout = src("src/lib/creator-packs-payout.ts");
const getPaid = src("src/components/opening-lab/creator-packs-get-paid.tsx");
const status = src("src/components/opening-lab/creator-packs-status.tsx");
const vite = src("vite.config.ts");

test("creator packs stay off production and the live hosts", () => {
  assert.match(flag, /openinglab\.co\.uk/);
  assert.match(flag, /www\.openinglab\.co\.uk/);
  assert.match(flag, /opening-lab-xi\.vercel\.app/);
  assert.match(flag, /opening-lab-tango6\.vercel\.app/);
  assert.match(flag, /vercelEnv === "production"/);
  assert.match(flag, /VITE_CREATOR_PACKS/);
  assert.match(flag, /flag === "0"/);
  assert.match(flag, /export function creatorPacksRoutesEnabled/);
  assert.match(vite, /creatorPacksEnvPlugin/);
  assert.match(vite, /VERCEL_ENV/);
  assert.match(flag, /__VERCEL_ENV__/);
  assert.match(frame, /creatorPacksRoutesOpen/);
  assert.doesNotMatch(frame, /creatorPacksPreviewEnabled/);
  assert.match(landing, /creatorPacksPreviewEnabled/);
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
        import { creatorPacksPreviewDecision, creatorPacksRoutesEnabled } from "./src/lib/creator-packs-flag.ts";
        const live = { vercelEnv: "production", hostname: "openinglab.co.uk", dev: false, flag: undefined };
        const www = { vercelEnv: "production", hostname: "www.openinglab.co.uk", dev: false, flag: "1" };
        const alias = { vercelEnv: "production", hostname: "opening-lab-xi.vercel.app", dev: false, flag: undefined };
        const preview = { vercelEnv: "preview", hostname: "opening-lab-git-cursor-creator-packs-preview-cd48-tango6.vercel.app", dev: false, flag: undefined };
        if (creatorPacksPreviewDecision(live) !== false) process.exit(2);
        if (creatorPacksPreviewDecision(www) !== false) process.exit(3);
        if (creatorPacksPreviewDecision(alias) !== false) process.exit(4);
        if (creatorPacksPreviewDecision(preview) !== true) process.exit(5);
        if (creatorPacksRoutesEnabled(undefined) !== true) process.exit(6);
        if (creatorPacksRoutesEnabled("0") !== false) process.exit(7);
        if (creatorPacksRoutesEnabled("false") !== false) process.exit(8);
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("creator pack routes are noindex and are not in a sitemap", () => {
  const routes = readdirSync(join(root, "src/routes")).filter((name) => name.startsWith("creator-packs"));
  assert.ok(routes.length >= 6);
  for (const name of routes) {
    const file = src(`src/routes/${name}`);
    assert.match(file, /name: "robots", content: "noindex, nofollow"/);
  }
  assert.equal(src("src/routeTree.gen.ts").includes("sitemap"), false);
  assert.doesNotMatch(src("vercel.json"), /sitemap/i);
});

test("home entry is gated and does not alter the live pack grid", () => {
  assert.match(landing, /creatorPacksPreviewEnabled/);
  assert.match(landing, /showCreatorPacks \?/);
  assert.match(landing, /data-creator-packs-entry/);
  assert.match(landing, /to="\/creator-packs"/);
  assert.match(landing, /Sample preview/);
  assert.match(landing, /Creator packs/);
  assert.match(landing, /data-open-pack=\{pack\.id\}/);
  assert.doesNotMatch(landing, /stripe|checkout|play-billing|PlayBilling/i);
  const memory = landing.indexOf("data-landing-square-memory");
  const entry = landing.indexOf("data-creator-packs-entry");
  const openNow = landing.indexOf('t("Open now")');
  assert.ok(memory > 0 && entry > memory && openNow > entry);
});

test("sample catalogue is fictional, ten lines, and not wired to payments", () => {
  for (const name of ["Demo Coach", "Demo Streamer", "Demo Author"]) {
    assert.match(demo, new RegExp(name));
  }
  for (const id of ["quiet-centre", "evening-italian", "compact-caro", "f7-glance"]) {
    assert.match(demo, new RegExp(`id: "${id}"`));
  }
  assert.match(demo, /badge: "10 lines"/);
  assert.match(demo, /mode: "walk"/);
  assert.match(demo, /mode: "drill"/);
  assert.match(browse, /\{pack\.badge\}/);
  assert.match(pack, /index > 0/);
  assert.match(pack, /Preview only/);
  assert.match(pack, /data-creator-buy/);
  assert.match(pack, /No payment is taken/);
  assert.match(pack, /Rate this pack/);
  assert.match(pack, /has not stored your rating/);
  assert.match(become, /You keep 70%/);
  assert.match(become, /You keep 70% of every sale/);
  assert.match(become, /Opening Lab keeps 30%/);
  assert.match(become, /suggest a price/i);
  assert.match(become, /Opening Lab reviews/);
  assert.match(become, /Players buy on Opening Lab/);
  assert.match(become, /CreatorPromoteNote/);
  assert.match(src("src/components/opening-lab/creator-packs-promote.tsx"), /Promote your packs/);
  assert.match(become, /website or in the app/);
  assert.doesNotMatch(become, /Where players know/);
  assert.doesNotMatch(become, /data-creator-field="known"/);
  assert.match(become, /Create your own Opening Lab style drill/);
  assert.match(become, /Drill or Walk-through/);
  assert.match(become, /data-creator-thanks/);
  assert.match(become, /has not sent or stored/);
  assert.match(editor, /Create your own Opening Lab style drill/);
  assert.match(editor, /Lock in position/);
  assert.match(editor, /data-creator-step="1"/);
  assert.match(editor, /data-creator-step="2"/);
  assert.match(editor, /data-creator-step="3"/);
  assert.match(editor, /Turn it into a drill/);
  assert.match(editor, /ChessBoard/);
  assert.match(editor, /Double-check every line is exactly how you want it/);
  assert.match(editor, /data-creator-continue/);
  assert.match(editor, /data-creator-comment/);
  assert.match(editor, /data-creator-next/);
  assert.match(editor, /e2e4/);
  assert.match(editor, /did not store it/);
  assert.match(study, /data-creator-study-mode="walk"/);
  assert.match(study, /data-creator-study-mode="drill"/);
  assert.match(study, /data-creator-walk-comment/);
  assert.match(study, /new Chess\(fen\)/);
  assert.match(demo, /r1bqkb1r\/pppp1ppp\/2n2n2\/4p2Q\/2B1P3\/8\/PPPP1PPP\/RNB1K1NR/);
  assert.match(study, /data-creator-drill-comment/);
  assert.match(demo, /Sample Student/);
  assert.match(demo, /Fictional Viewer/);
  assert.match(demo, /Demo Clubmate/);
  assert.match(demo, /Demo Creator/);
  assert.match(demo, /id: "game-vs-smith"/);
  assert.match(demo, /name: "My game vs Smith"/);
  assert.match(demo, /badge: "3 lines"/);
  assert.match(become, /You do not have to start from an opening/);
  assert.match(become, /paste a FEN/);
  assert.match(become, /Need help\?/);
  assert.match(editor, /Paste a FEN/);
  assert.match(editor, /data-creator-fen/);
  assert.match(editor, /data-creator-add-line/);
  assert.match(editor, /How much to charge\?/);
  assert.match(editor, /data-creator-price/);
  assert.match(editor, /Your pack is live for you to see/);
  assert.match(editor, /Visible only to you/);
  assert.match(editor, /status="review"/);
  assert.match(status, /In review/);
  assert.match(status, /Live/);
  assert.match(help, /data-creator-help-form/);
  assert.match(help, /mailto:/);
  assert.match(helpEmail, /CREATOR_PACKS_HELP_EMAIL/);
  assert.match(helpEmail, /support@openinglab\.co\.uk/);
  assert.match(dashboard, /data-creator-packs-dashboard/);
  assert.match(dashboard, /Visible only to you/);
  assert.match(admin, /data-creator-packs-admin/);
  assert.match(admin, /data-creator-approve/);
  assert.match(admin, /data-creator-send-back/);
  assert.match(admin, /Final price/);
  assert.match(admin, /Monthly payouts/);
  assert.match(admin, /Pay via Stripe/);
  assert.match(admin, /data-creator-payout-row/);
  assert.match(getPaid, /Get paid with Stripe/);
  assert.match(getPaid, /Set up payouts with Stripe/);
  assert.match(getPaid, /Opening Lab never sees your bank details/);
  assert.match(getPaid, /You keep 70% of every sale/);
  assert.match(getPaid, /website or in the app/);
  assert.match(getPaid, /data-creator-payout-hosted/);
  assert.match(editor, /You keep 70% of every sale/);
  assert.match(editor, /firstPurchaseLink/);
  assert.match(editor, /CreatorPromoteNote/);
  assert.match(browse, /You keep 70% of every sale/);
  assert.match(dashboard, /CreatorPromoteNote/);
  assert.match(dashboard, /You keep 70% of every sale/);
  assert.match(admin, /flat 70%/);
  assert.match(admin, /70% of sales/);
  assert.match(pack, /purchaseLinkMessage/);
  assert.match(payout, /CREATOR_SHARE_PERCENT = 70/);
  assert.match(src("src/components/opening-lab/creator-packs-promote.tsx"), /data-creator-promote/);
  assert.match(src("src/lib/creator-packs-text.ts"), /hasPurchaseLink/);
  assert.match(editor, /data-creator-payout-prompt/);
  assert.match(editor, /You can still submit now/);
  assert.match(status, /Not set up/);
  assert.match(status, /Payouts set up/);
  assert.match(payout, /localStorage/);
  assert.doesNotMatch(getPaid, /<input/);
  assert.doesNotMatch(payout, /sk_live|sk_test|stripe\(/);
  assert.match(review, /localStorage/);
  assert.match(frame, /Need help\?/);
  assert.doesNotMatch(frame, /creator-packs\/admin/);
  assert.match(ratings, /Across every pack/);
  assert.match(ratings, /review.author/);
  assert.match(frame, /creatorPacksRoutesOpen/);
  assert.match(frame, /data-creator-packs-closed/);
  const promote = src("src/components/opening-lab/creator-packs-promote.tsx");
  const textGuard = src("src/lib/creator-packs-text.ts");
  const joined = [demo, browse, pack, become, editor, frame, study, ratings, help, dashboard, admin, helpEmail, review, status, payout, getPaid, promote, textGuard].join("\n");
  assert.doesNotMatch(joined, /—|–/);
  assert.doesNotMatch(joined, new RegExp("8" + "5%"));
  assert.doesNotMatch(joined, new RegExp("refer" + "ral", "i"));
  assert.doesNotMatch(joined, new RegExp("affil" + "iate", "i"));
  assert.doesNotMatch(joined, new RegExp("own" + " link", "i"));
  assert.doesNotMatch(joined, new RegExp("better" + " split", "i"));
  assert.doesNotMatch(joined, /Stockfish|Line Gate|checked before it goes live/i);
  assert.doesNotMatch(joined, /5 book|punish|Play on/i);
  assert.doesNotMatch(joined, /from ["']stripe["']|sk_live|sk_test|startCheckout|play-billing|playBilling|@\/data\/packs/i);
  assert.doesNotMatch(joined, /account number|sort code|routing number|iban/i);
  assert.doesNotMatch(joined, /fetch\(/);
});

test("middlegame sample lines are legal and each starts from its own position", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
        import { Chess } from "chess.js";
        import { DEMO_PACKS } from "./src/data/creator-packs-demo.ts";
        const pack = DEMO_PACKS.find((item) => item.id === "game-vs-smith");
        if (!pack || pack.lines.length !== 3) process.exit(2);
        const fens = new Set();
        for (const line of pack.lines) {
          if (!line.fen || !line.plies?.length) process.exit(3);
          if (!line.comments || line.comments.length !== line.plies.length) process.exit(4);
          if (line.fen.startsWith("rnbqkbnr/pppppppp")) process.exit(5);
          fens.add(line.fen);
          const chess = new Chess(line.fen);
          for (const san of line.plies) {
            const played = chess.move(san);
            if (!played) process.exit(6);
          }
        }
        if (fens.size !== 3) process.exit(7);
        for (const item of DEMO_PACKS) {
          for (const line of item.lines) {
            if (!line.plies?.length) continue;
            const chess = line.fen ? new Chess(line.fen) : new Chess();
            for (const san of line.plies) {
              if (!chess.move(san)) process.exit(8);
            }
            if (line.comments && line.comments.length !== line.plies.length) process.exit(9);
          }
        }
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("creator share is a flat 70 percent and pack text cannot carry a purchase link", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
        import { CREATOR_SHARE_PERCENT, MONTHLY_PAYOUTS, creatorSharePence } from "./src/lib/creator-packs-payout.ts";
        import { hasPurchaseLink } from "./src/lib/creator-packs-text.ts";
        import { DEMO_PACKS, DEMO_REVIEWS, DEMO_CREATORS } from "./src/data/creator-packs-demo.ts";
        if (CREATOR_SHARE_PERCENT !== 70) process.exit(2);
        if (creatorSharePence(1000) !== 700) process.exit(3);
        if (creatorSharePence(2000) !== 1400) process.exit(4);
        if (creatorSharePence(600) !== 420) process.exit(5);
        for (const row of MONTHLY_PAYOUTS) {
          const share = creatorSharePence(row.salesPence);
          if (share !== Math.round((row.salesPence * 70) / 100)) process.exit(6);
          if (row.shareLabel !== "£" + (share / 100).toFixed(2)) process.exit(7);
        }
        const samples = [];
        for (const creator of DEMO_CREATORS) samples.push(creator.bio, creator.about, creator.name);
        for (const pack of DEMO_PACKS) {
          samples.push(pack.name, pack.blurb, pack.price);
          for (const line of pack.lines) {
            samples.push(line.name);
            if (line.fen) samples.push(line.fen);
            for (const comment of line.comments ?? []) samples.push(comment);
          }
        }
        for (const review of DEMO_REVIEWS) samples.push(review.text, review.author);
        for (const sample of samples) {
          if (hasPurchaseLink(sample)) {
            console.error(sample);
            process.exit(8);
          }
        }
        const blocked = [
          "https://buy.example/pack",
          "http://shop.test",
          "www.coach.example",
          "See youtube.com/coach",
          "openinglab.co.uk/pack?ref=ada",
          "use utm_source=stream",
          "pay aff=creator",
        ];
        for (const value of blocked) {
          if (!hasPurchaseLink(value)) {
            console.error("allowed " + value);
            process.exit(9);
          }
        }
        const allowed = [
          "The knight develops and watches e5.",
          "My game vs Smith",
          "e4 or e2e4",
          "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
          "Suggest 4.00",
        ];
        for (const value of allowed) {
          if (hasPurchaseLink(value)) {
            console.error("blocked " + value);
            process.exit(10);
          }
        }
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
