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
  assert.equal(demo.split('id: "').length - 1, 6);
  assert.match(browse, /creator-pack-badge">10 lines</);
  assert.match(pack, /index > 0/);
  assert.match(pack, /Preview only/);
  assert.match(pack, /data-creator-buy/);
  assert.match(pack, /No payment is taken/);
  assert.match(become, /You keep 70%/);
  assert.match(become, /Opening Lab keeps 30%/);
  assert.match(become, /pays you 85%/);
  assert.match(become, /Stockfish/);
  assert.match(become, /Line Gate/);
  assert.match(become, /data-creator-thanks/);
  assert.match(become, /has not sent or stored/);
  assert.match(editor, /ChessBoard/);
  assert.match(editor, /Stockfish/);
  assert.match(editor, /Line Gate/);
  assert.match(editor, /data-creator-publish/);
  assert.match(editor, /Nothing you type is saved|Nothing was saved|was not saved/);
  assert.match(frame, /creatorPacksPreviewEnabled/);
  assert.match(frame, /data-creator-packs-closed/);
  const joined = [demo, browse, pack, become, editor, frame].join("\n");
  assert.doesNotMatch(joined, /—|–/);
  assert.doesNotMatch(joined, /5 book|punish|Play on/i);
  assert.doesNotMatch(joined, /stripe|play-billing|playBilling|startCheckout|@\/data\/packs/i);
  assert.doesNotMatch(joined, /fetch\(/);
});
