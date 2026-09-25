import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");
const require = createRequire(join(root, "package.json"));

const landing = src("src/components/opening-lab/home-intro.tsx");
const copy = src("src/lib/landing-copy.ts");
const pricing = src("src/data/pricing.ts");
const stripe = src("src/lib/stripe.server.ts");
const purchases = src("src/lib/purchases.server.ts");
const checkout = src("src/lib/checkout.ts");
const view = src("src/components/opening-lab/lessons-view.tsx");
const player = src("src/components/opening-lab/lesson-player.tsx");
const board = src("src/components/opening-lab/lesson-board.tsx");
const cues = JSON.parse(src("src/data/lessons/scotch/BOARD_CUES.json"));
const captions = src("src/data/lessons/scotch/CAPTIONS.txt");

test("landing keeps the gym and drill packs, and adds Chess opening lessons", () => {
  const cta = landing.indexOf("data-landing-cta");
  const drills = landing.indexOf("data-landing-drills");
  const lessons = landing.indexOf("data-landing-lessons");
  assert.ok(cta >= 0 && drills > cta && lessons > drills);
  assert.match(landing, /t\("Enter the gym"\)/);
  assert.match(landing, /t\("Opening drill packs"\)/);
  assert.match(landing, /t\("Chess opening lessons"\)/);
  assert.match(landing, /data-landing-drills[\s\S]*onClick=\{onEnterGym\}/);
  assert.match(landing, /navigate\(\{ to: "\/lessons" \}\)/);
  assert.match(landing, /setShowLessons\(!isPlayApp\(\)\)/);
  assert.match(landing, /showLessons \?/);
  assert.doesNotMatch(landing, /Play on|versus the computer|vs computer/i);
  assert.doesNotMatch(landing, /human voice|recorded voice|voice actor|real person/i);
  assert.equal(copy.split('"Opening drill packs":').length - 1, 12);
  assert.equal(copy.split('"Chess opening lessons":').length - 1, 12);
  assert.equal(copy.split('"{n} lessons":').length - 1, 12);
  assert.doesNotMatch(copy, /£/);
});

test("lesson-scotch is £2.99 and Stripe persists it apart from the drill pack", () => {
  assert.match(pricing, /PRICE_LESSON_SCOTCH = "£2\.99"/);
  assert.match(stripe, /lessonCheckout\(body\.packId\)/);
  assert.match(stripe, /isLessonProductId\(body\.packId\)/);
  assert.match(stripe, /!canPurchasePack\(pack\.id\)/);
  assert.match(stripe, /lessonCheckoutReturnPath/);
  assert.match(purchases, /LESSON_PRODUCT_IDS/);
  assert.match(purchases, /packs = PACKS\.map\(\(p\) => p\.id\)/);
  assert.match(checkout, /returnPath/);
  assert.equal(cues.product.id, "lesson-scotch");
  assert.equal(cues.product.price, "£2.99");
  assert.equal(cues.product.lessonCount, 3);
  assert.deepEqual(cues.product.freeLessonIds, ["sgl1"]);
});

test("catalogue source wires free sgl1 and locked sgl2/sgl3", () => {
  assert.match(view, /data-lessons-catalogue/);
  assert.match(view, /data-lesson-product=\{LESSON_SCOTCH_PRODUCT_ID\}/);
  assert.match(view, /PRICE_LESSON_SCOTCH/);
  assert.match(view, /\{n\} free · \{price\}/);
  assert.match(view, /scotchLessons\.map/);
  assert.match(view, /isLessonUnlocked\(lesson, checkout\.packs, LESSON_SCOTCH_PRODUCT_ID\)/);
  assert.match(view, /lessonScreen\(lesson\.id, unlocked\)/);
  assert.match(view, /data-lesson-id=\{lesson\.id\}/);
  assert.match(view, /data-lesson-access=\{access\}/);
  assert.match(view, /screen === "player" \? "free" : screen === "stub" \? "open" : "locked"/);
  assert.match(view, /screen === "player"/);
  assert.match(view, /<LessonPlayer/);
  assert.match(view, /data-lesson-stub=\{lesson\.id\}/);
  assert.match(view, /data-lesson-unlock/);
  assert.doesNotMatch(view, /Play on|versus the computer|vs computer/i);
  assert.doesNotMatch(view, /human voice|recorded voice|voice actor|real person/i);
  const byId = Object.fromEntries(cues.lessons.map((lesson) => [lesson.id, lesson]));
  assert.equal(byId.sgl1.free, true);
  assert.equal(byId.sgl1.title, "Lesson 1 · Intro");
  assert.equal(byId.sgl2.free, false);
  assert.equal(byId.sgl3.free, false);
  assert.match(byId.sgl2.title, /Lesson 2/);
  assert.match(byId.sgl3.title, /Lesson 3/);
});

test("lesson 1 player uses Potato Pie, captions, and the narration clock", () => {
  assert.match(player, /startCoachPackNarration/);
  assert.match(player, /stopScotchCoachNarration/);
  assert.match(player, /SCOTCH_LESSON_INTRO_MP3/);
  assert.match(player, /ScotchCoachFigure/);
  assert.match(player, /scotch-coach-plate/);
  assert.match(player, /data-lesson-player="sgl1"/);
  assert.match(player, /data-lesson-caption/);
  assert.match(player, /captionIndexAt/);
  assert.match(player, /audio\.currentTime/);
  assert.match(player, /data-lesson-skip/);
  assert.match(player, /data-lesson-done/);
  assert.match(player, /LessonBoard/);
  assert.match(board, /lessonSansAt/);
  assert.match(board, /audio\.currentTime/);
  assert.match(src("src/data/lessons/scotch-course.ts"), /\/lessons\/scotch\/intro\.mp3/);
  assert.ok(readFileSync(join(root, "public/lessons/scotch/intro.mp3")).byteLength > 100_000);
  const captionModule = src("src/data/lessons/scotch-captions.ts");
  const exported = captionModule.match(/export const SCOTCH_CAPTION_SCRIPT = (".*");/);
  assert.ok(exported);
  assert.equal(JSON.parse(exported[1]), captions);
  const boardModule = src("src/data/lessons/scotch-board-cues.ts");
  const boardExported = boardModule.match(/export const SCOTCH_BOARD_FILE = (\{.*\});/);
  assert.ok(boardExported);
  assert.deepEqual(JSON.parse(boardExported[1]), cues);
  assert.match(captions, /Professor Potato Pie/);
  assert.doesNotMatch(player + board + captions, /human voice|recorded voice|voice actor/i);
  assert.doesNotMatch(player + board, /Play on|versus the computer|vs computer/i);
});

test("sgl1 is free, sgl2 and sgl3 stay locked until lesson-scotch", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }
  const dir = join(root, "scripts", ".generated-lessons");
  mkdirSync(dir, { recursive: true });
  const compile = (file, name) => {
    const js = ts.transpileModule(src(file), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const out = join(dir, name);
    writeFileSync(out, js);
    return out;
  };
  compile("src/lib/lesson-sync.ts", "lesson-sync.mjs");
  const products = ts
    .transpileModule(src("src/lib/lesson-products.ts"), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    .outputText.replaceAll("@/data/pricing", "./pricing-stub.mjs");
  writeFileSync(
    join(dir, "pricing-stub.mjs"),
    `
    export const PRICE_LESSON_SCOTCH = "£2.99";
    export function priceToPence(price) {
      const n = Number(String(price).replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(n) || n <= 0) return null;
      return Math.round(n * 100);
    }
  `,
  );
  writeFileSync(join(dir, "lesson-products.mjs"), products);
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const sync = await import(pathToFileURL(join(dir, "lesson-sync.mjs")).href);
  const productsMod = await import(pathToFileURL(join(dir, "lesson-products.mjs")).href);
  const id = productsMod.LESSON_SCOTCH_PRODUCT_ID;
  assert.equal(id, "lesson-scotch");
  assert.equal(sync.isLessonUnlocked({ free: true }, [], id), true);
  assert.equal(sync.isLessonUnlocked({ free: false }, [], id), false);
  assert.equal(sync.isLessonUnlocked({ free: false }, ["scotch"], id), false);
  assert.equal(sync.isLessonUnlocked({ free: false }, [id], id), true);
  assert.equal(sync.lessonScreen("sgl1", true), "player");
  assert.equal(sync.lessonScreen("sgl2", false), "locked");
  assert.equal(sync.lessonScreen("sgl3", false), "locked");
  assert.equal(sync.lessonScreen("sgl2", true), "stub");
  assert.equal(sync.lessonScreen("sgl3", true), "stub");

  const checkout = productsMod.lessonCheckout(id);
  assert.equal(checkout.pence, 299);
  assert.equal(checkout.name, "Scotch Gambit lessons");
  assert.equal(productsMod.lessonCheckout("scotch"), null);
  assert.equal(productsMod.lessonCheckoutReturnPath("/lessons/scotch"), "/lessons/scotch");
  assert.equal(productsMod.lessonCheckoutReturnPath("https://evil.example"), "/");
  assert.equal(productsMod.lessonCheckoutReturnPath("//lessons"), "/");

  const lines = sync.parseCaptionScript(captions);
  assert.ok(lines.length >= 20);
  assert.equal(sync.captionIndexAt(0, cues.audioDurationSec, lines.length), 0);
  assert.equal(
    sync.captionIndexAt(cues.audioDurationSec, cues.audioDurationSec, lines.length),
    lines.length - 1,
  );
  assert.ok(
    sync.captionIndexAt(cues.audioDurationSec / 2, cues.audioDurationSec, lines.length) > 0,
  );

  const stem = ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4"];
  assert.deepEqual(sync.lessonSansAt(cues.cues, 56.04), stem);
  assert.deepEqual(sync.lessonSansAt(cues.cues, 112.9), stem);
  assert.deepEqual(sync.lessonSansAt(cues.cues, 113.5).slice(0, 8), [...stem, "Bc5"]);
  const branch = sync.lessonSansAt(cues.cues, 150);
  assert.deepEqual(branch, [...stem, "Bc5", "c3", "dxc3", "Bxf7+", "Kxf7", "Qd5+", "Kf8", "Qxc5+"]);
  const fen = sync.lessonFenAt(cues.cues, 160);
  assert.ok(fen);
  const { Chess } = await import("chess.js");
  const chess = new Chess(fen);
  assert.equal(chess.turn(), "b");
  assert.equal(chess.inCheck(), true);

  assert.deepEqual(
    sync.lessonSansAt(
      [
        { t: 1, san: "e4" },
        { t: 2, san: "e5" },
        { t: 3, san: "Nf3" },
        { t: 4, fromPly: 1, san: "c5" },
      ],
      4,
    ),
    ["e4", "c5"],
  );
});
