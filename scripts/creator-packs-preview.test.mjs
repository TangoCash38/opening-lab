import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
const vite = src("vite.config.ts");

test("creator packs stay off production and the live hosts", () => {
  assert.match(flag, /openinglab\.co\.uk/);
  assert.match(flag, /www\.openinglab\.co\.uk/);
  assert.match(flag, /opening-lab-xi\.vercel\.app/);
  assert.match(flag, /opening-lab-tango6\.vercel\.app/);
  assert.match(flag, /vercelEnv === "production"/);
  assert.match(flag, /VITE_CREATOR_PACKS/);
  assert.match(flag, /flag === "0"/);
  assert.match(vite, /creatorPacksEnvPlugin/);
  assert.match(vite, /VERCEL_ENV/);
  assert.match(flag, /__VERCEL_ENV__/);
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
  assert.match(ratings, /Across every pack/);
  assert.match(ratings, /review.author/);
  assert.match(frame, /creatorPacksPreviewEnabled/);
  assert.match(frame, /data-creator-packs-closed/);
  const joined = [demo, browse, pack, become, editor, frame, study, ratings].join("\n");
  assert.doesNotMatch(joined, /—|–/);
  assert.doesNotMatch(joined, /Stockfish|Line Gate|checked before it goes live/i);
  assert.doesNotMatch(joined, /5 book|punish|Play on/i);
  assert.doesNotMatch(joined, /stripe|play-billing|playBilling|startCheckout|@\/data\/packs/i);
  assert.doesNotMatch(joined, /fetch\(/);
});
