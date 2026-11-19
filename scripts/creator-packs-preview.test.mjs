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
  assert.match(become, /Opening Lab keeps 30%/);
  assert.match(become, /pays you 85%/);
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
  assert.match(review, /localStorage/);
  assert.match(frame, /Need help\?/);
  assert.doesNotMatch(frame, /creator-packs\/admin/);
  assert.match(ratings, /Across every pack/);
  assert.match(ratings, /review.author/);
  assert.match(frame, /creatorPacksRoutesOpen/);
  assert.match(frame, /data-creator-packs-closed/);
  const joined = [demo, browse, pack, become, editor, frame, study, ratings, help, dashboard, admin, helpEmail, review, status].join("\n");
  assert.doesNotMatch(joined, /—|–/);
  assert.doesNotMatch(joined, /Stockfish|Line Gate|checked before it goes live/i);
  assert.doesNotMatch(joined, /5 book|punish|Play on/i);
  assert.doesNotMatch(joined, /stripe|play-billing|playBilling|startCheckout|@\/data\/packs/i);
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
