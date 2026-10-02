import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

async function loadModule(t, rel, outName) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const js = ts.transpileModule(src(rel), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", `.generated-square-memory-${outName.replace(/\W/g, "")}`);
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, outName);
  writeFileSync(tmp, js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(tmp).href);
}

const SQUARES = ["e2", "e4", "c7", "c5", "g1", "f3"];

function drainWatch(tick, state, now) {
  for (let guard = 0; guard < 40 && state.phase === "watch"; guard++) {
    now = state.lit ? state.litUntil : state.gapUntil;
    const next = tick(state, now, SQUARES);
    if (next === state) throw new Error("watch tick made no progress");
    state = next;
  }
  if (state.phase === "watch") throw new Error("watch did not finish");
  return { state, now };
}

test("rounds grow by two and a miss keeps the finished squares", async (t) => {
  const mod = await loadModule(t, "src/lib/square-memory.ts", "logic.mjs");
  if (!mod) return;
  const { begin, tap, tick, FLASH_MS, GAP_MS, HIT_MS } = mod;
  assert.equal(FLASH_MS, 520);
  assert.equal(GAP_MS, 100);
  assert.ok(FLASH_MS < 1200);
  assert.ok(FLASH_MS > 380);
  assert.ok(GAP_MS < FLASH_MS);

  let now = 1000;
  let state = begin(0, now, SQUARES);
  assert.equal(state.phase, "watch");
  assert.equal(state.length, 2);
  assert.equal(state.lit, "e2");
  assert.equal(state.litUntil - now, FLASH_MS);
  ({ state, now } = drainWatch(tick, state, now));
  assert.equal(state.phase, "input");
  state = tap(state, "e2", SQUARES, now);
  state = tap(state, "e4", SQUARES, now);
  now += HIT_MS;
  state = tick(state, now, SQUARES);
  assert.equal(state.phase, "watch");
  assert.equal(state.length, 4);

  ({ state, now } = drainWatch(tick, state, now));
  state = tap(state, "a1", SQUARES, now);
  assert.equal(state.phase, "punish");
  assert.equal(state.score, 2);
  now = state.litUntil;
  state = tick(state, now, SQUARES);
  assert.equal(state.phase, "reveal");
  assert.equal(state.score, 2);
  assert.equal(state.perfect, false);
});

test("a wrong tap during the longer round counts the correct prefix", async (t) => {
  const mod = await loadModule(t, "src/lib/square-memory.ts", "logic-prefix.mjs");
  if (!mod) return;
  const { begin, tap, tick, HIT_MS } = mod;
  let now = 0;
  let state = begin(0, now, SQUARES);
  ({ state, now } = drainWatch(tick, state, now));
  state = tap(state, "e2", SQUARES, now);
  state = tap(state, "e4", SQUARES, now);
  now += HIT_MS;
  state = tick(state, now, SQUARES);
  ({ state, now } = drainWatch(tick, state, now));
  state = tap(state, "e2", SQUARES, now);
  state = tap(state, "e4", SQUARES, now);
  state = tap(state, "c7", SQUARES, now);
  state = tap(state, "h8", SQUARES, now);
  assert.equal(state.score, 3);
  assert.equal(state.litKind, "miss");
});

test("taps during the flash are ignored and a perfect line reveals", async (t) => {
  const mod = await loadModule(t, "src/lib/square-memory.ts", "logic-perfect.mjs");
  if (!mod) return;
  const { begin, tap, tick, FLASH_MS, GAP_MS } = mod;
  const started = begin(0, 0, SQUARES);
  assert.equal(tap(started, "e2", SQUARES, 10), started);

  const tiny = ["e2", "e4"];
  let now = 0;
  let state = begin(0, now, tiny);
  now = FLASH_MS;
  state = tick(state, now, tiny);
  now += GAP_MS;
  state = tick(state, now, tiny);
  now = state.litUntil;
  state = tick(state, now, tiny);
  now = state.gapUntil;
  state = tick(state, now, tiny);
  assert.equal(state.phase, "input");
  state = tap(state, "e2", tiny, now);
  state = tap(state, "e4", tiny, now);
  now = state.litUntil;
  state = tick(state, now, tiny);
  assert.equal(state.phase, "reveal");
  assert.equal(state.perfect, true);
  assert.equal(state.score, 2);
});

test("every flash uses the same on-time and gap, including the first", async (t) => {
  const mod = await loadModule(t, "src/lib/square-memory.ts", "logic-timing.mjs");
  if (!mod) return;
  const { begin, tap, tick, FLASH_MS, GAP_MS, HIT_MS, minimumClearMs, formatClearTime, cleanScoreName } = mod;
  const squares = ["e2", "e4", "c7", "c5", "g1", "f3", "b8", "c6"];

  function flashes(state, now) {
    const ons = [];
    const gaps = [];
    for (let guard = 0; guard < 40 && state.phase === "watch"; guard++) {
      if (state.lit) {
        ons.push(state.litUntil - now);
        now = state.litUntil;
      } else {
        gaps.push(state.gapUntil - now);
        now = state.gapUntil;
      }
      const next = tick(state, now, squares);
      if (next === state) throw new Error("watch tick made no progress");
      state = next;
    }
    return { ons, gaps, state, now };
  }

  let now = 5000;
  let state = begin(0, now, squares);
  const first = flashes(state, now);
  state = first.state;
  now = first.now;
  assert.ok(first.ons.length >= 2);
  assert.ok(first.ons.every((ms) => ms === FLASH_MS));
  assert.ok(first.gaps.every((ms) => ms === GAP_MS));
  assert.equal(first.ons[0], first.ons[first.ons.length - 1]);

  state = tap(state, "e2", squares, now);
  state = tap(state, "e4", squares, now);
  now += HIT_MS;
  state = tick(state, now, squares);
  const longer = flashes(state, now);
  assert.equal(longer.ons.length, 4);
  assert.ok(longer.ons.every((ms) => ms === first.ons[0]));
  assert.ok(longer.gaps.every((ms) => ms === GAP_MS));

  assert.equal(minimumClearMs(10), 30 * FLASH_MS + 25 * GAP_MS + 4 * HIT_MS);
  assert.equal(formatClearTime(32480), "0:32.4");
  assert.equal(cleanScoreName("  Sean  "), "Sean");
  assert.equal(cleanScoreName("sean@lab.co"), null);
  assert.equal(cleanScoreName("a name that is far too long"), null);
});

test("the hidden line is the Ruy Lopez through Bb5", async (t) => {
  const mod = await loadModule(t, "src/lib/square-memory-line.ts", "line.mjs");
  if (!mod) return;
  assert.equal(mod.SQUARE_MEMORY_NAME, "Ruy Lopez");
  assert.equal(mod.SQUARE_MEMORY_PACK_ID, "ruy-lopez-white");
  assert.deepEqual(mod.SQUARE_MEMORY_LINE.squares, [
    "e2",
    "e4",
    "e7",
    "e5",
    "g1",
    "f3",
    "b8",
    "c6",
    "f1",
    "b5",
  ]);
  assert.deepEqual(
    mod.SQUARE_MEMORY_LINE.plies.map((ply) => ply.san),
    ["e4", "e5", "Nf3", "Nc6", "Bb5"],
  );
  const after = mod.SQUARE_MEMORY_LINE.positions[5];
  const bishop = after[3][1];
  assert.equal(bishop?.type, "b");
  assert.equal(bishop?.color, "w");
});

test("website and Play home show Square Memory under the packs", () => {
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const page = src("src/routes/square-memory.tsx");
  const view = src("src/components/opening-lab/square-memory.tsx");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const css = src("src/styles.css");

  assert.match(landing, /setShowMemory\(!isPlayApp\(\) \|\| readSquareMemoryPlayPreview\(\)\)/);
  assert.match(landing, /data-play-memory-preview/);
  assert.match(landing, /nextSquareMemoryPreviewTaps/);
  assert.doesNotMatch(landing, /Test mode|Preview Square Memory/);
  assert.match(landing, /showMemory \?/);
  assert.match(landing, /data-landing-square-memory/);
  assert.match(landing, /to="\/square-memory"/);
  assert.match(landing, /Square Memory/);
  const art = landing.indexOf("landing-hero-art");
  const memory = landing.indexOf("data-landing-square-memory");
  const puzzle = landing.indexOf("data-landing-puzzle");
  const openNow = landing.indexOf('t("Open now")');
  assert.ok(art >= 0 && openNow > art && memory > openNow && puzzle > memory);
  assert.doesNotMatch(landing, /function LandingBoard[\s\S]*data-landing-square-memory/);

  assert.match(css, /\.landing-square-memory\s*\{[^}]*width:\s*100%/);
  assert.match(css, /@media \(min-width: 960px\)[\s\S]*\.landing-square-memory\s*\{[^}]*width:\s*min\(22rem,\s*100%\)/);
  assert.doesNotMatch(hero, /square-memory|Square Memory/);

  assert.match(page, /isPlayApp\(\) && !readSquareMemoryPlayPreview\(\)/);
  assert.match(page, /window\.location\.replace\("\/"\)/);
  assert.match(view, /Watch the squares\. Tap them back in order\./);
  assert.match(view, /data-begin/);
  assert.match(view, /"Start"/);
  assert.doesNotMatch(view, /"Begin"/);
  assert.match(view, /data-mute/);
  assert.match(view, /data-square-memory-pack=\{choice\.packId\}/);
  assert.match(view, /href=\{`\/#pack\/\$\{choice\.packId\}`\}/);
  assert.match(view, /SQUARE_MEMORY_PACK_ID/);
  assert.match(view, /Play again/);
  assert.match(view, /localStorage/);
  assert.doesNotMatch(view, /document\.addEventListener\(\s*["']pointerdown/);
  assert.doesNotMatch(view, /document\.addEventListener\(\s*["']click/);
  assert.doesNotMatch(view, /speechSynthesis|\.mp3|\.wav|new Audio\(/);
  assert.doesNotMatch(`${page}\n${view}`, /stripe|play-billing|checkout|buyPack/i);

  const audio = src("src/lib/square-memory-audio.ts");
  assert.match(audio, /osc\.type = "square"/);
  assert.match(audio, /punch\(freq, 0\.11, 0\.72\)/);
  assert.doesNotMatch(audio, /speechSynthesis|new Audio\(/);
  assert.match(
    css,
    /\.sqmem-sq\.is-flash,\s*\.sqmem-sq-light\.is-flash,\s*\.sqmem-sq-dark\.is-flash\s*\{[^}]*#ffe400/,
  );
  assert.doesNotMatch(
    css,
    /\.sqmem-sq\.is-flash,\s*\.sqmem-sq-light\.is-flash,\s*\.sqmem-sq-dark\.is-flash\s*\{[^}]*background:\s*#ffe400/,
  );
  assert.match(css, /\.sqmem-board\s*\{[^}]*width:\s*100%/);
  assert.match(view, /data-square-memory-status=\{snap\.phase\}/);
});

test("a perfect line brings Big Red in; a miss does not", () => {
  const view = src("src/components/opening-lab/square-memory.tsx");
  const audio = src("src/lib/square-memory-audio.ts");
  const css = src("src/styles.css");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  const catalog = src("src/lib/catalog.ts");
  const coach = src("src/lib/coach-packs.ts");
  const portrait = coach.match(/RUY_LOPEZ_PORTRAIT = "([^"]+)"/)?.[1];
  assert.equal(portrait, "/coach/ruy-lopez-white/big-red-portrait.png");
  assert.match(view, /const BIG_RED_PORTRAIT = "\/coach\/ruy-lopez-white\/big-red-portrait\.png"/);
  assert.match(view, /perfect && cheerOn \? <PerfectCheer choice=\{choice\} \/> : null/);
  assert.match(view, /BOARD_BEFORE_CHEER_MS = 2000/);
  assert.match(view, /revealing && !snap\.perfect/);
  assert.match(
    view,
    /You smashed it\. That's the Ruy Lopez\. Want to learn openings properly\? Try the opening packs\./,
  );
  assert.match(view, /data-square-memory-cheer/);
  assert.match(view, /coach: "Big Red"/);
  assert.match(view, /data-square-memory-gym/);
  assert.match(view, /href="\/#gym"/);
  assert.match(view, /unlockAudio\(\)[\s\S]{0,280}performance\.now\(\)/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.doesNotMatch(audio, /You smashed it/);
  assert.match(css, /\.sqmem-cheer-portrait\s*\{[^}]*width:\s*46%/);
  assert.match(
    css,
    /@media \(max-width: 959px\) \{[\s\S]*?\.sqmem-cheer-portrait\s*\{[^}]*max-height:\s*16rem[^}]*object-fit:\s*cover/,
  );
  assert.match(css, /\.sqmem-cheer-bubble/);
  assert.match(catalog, /export function readRequestedGym/);
  assert.match(catalog, /raw === "gym"/);
  assert.match(shell, /readRequestedGym\(\) && !isPlayWrap\(\)\) goPacks\(\)/);
  assert.match(shell, /if \(isPlayWrap\(\)\) return/);
});

test("both openings live on Square Memory, and the old London URL redirects", () => {
  const packs = src("src/data/packs.ts");
  const line = src("src/lib/square-memory-london.ts");
  const view = src("src/components/opening-lab/square-memory.tsx");
  const page = src("src/routes/square-memory-london.tsx");
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const ruyLine = src("src/lib/square-memory-line.ts");
  const lon1 = packs.slice(packs.indexOf('id: "lon1"'), packs.indexOf('id: "lon2"'));
  assert.match(lon1, /\["d4", "d5", "Bf4", "Nf6", "e3",/);
  assert.match(line, /LONDON_MEMORY_MOVES = \["d4", "d5", "Bf4", "Nf6", "e3"\]/);
  assert.match(line, /LONDON_MEMORY_PACK_ID = "london"/);
  assert.match(line, /LONDON_MEMORY_NAME = "London System"/);
  assert.match(
    view,
    /You smashed it\. That's the London System\. Want to learn openings properly\? Try the opening packs\./,
  );
  assert.match(view, /coach-seated-v2\.png/);
  assert.match(view, /Professor Potato Pie/);
  assert.match(view, /data-memory-line=\{item\.id\}/);
  assert.match(view, /<h1 className="sqmem-title">Square Memory<\/h1>/);
  assert.doesNotMatch(view, /London Memory|Square London/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(page, /createFileRoute\("\/square-memory-london"\)/);
  assert.match(page, /isPlayApp\(\)/);
  assert.match(
    page,
    /isPlayApp\(\) && !readSquareMemoryPlayPreview\(\) \? "\/" : "\/square-memory"/,
  );
  assert.match(page, /Square Memory · Opening Lab/);
  assert.doesNotMatch(page, /London Memory/);
  const memory = landing.indexOf("data-landing-square-memory");
  const puzzle = landing.indexOf("data-landing-puzzle");
  assert.ok(memory > 0 && puzzle > memory);
  assert.doesNotMatch(landing, /data-landing-london-memory|London Memory|landing-memory-row/);
  assert.match(ruyLine, /SQUARE_MEMORY_MOVES = \["e4", "e5", "Nf3", "Nc6", "Bb5"\]/);
  assert.equal((landing.match(/data-landing-square-memory/g) || []).length, 1);
});

test("Queen's Gambit Declined is the third hidden line on the same page", () => {
  const packs = src("src/data/packs.ts");
  const line = src("src/lib/square-memory-qg.ts");
  const view = src("src/components/opening-lab/square-memory.tsx");
  const api = src("src/routes/api/square-memory-scores.ts");
  const migration = src("migrations/0008_square_memory_qg.sql");
  const qg = packs.slice(packs.indexOf('id: "qg-white"'), packs.indexOf('id: "english-white"'));
  const qg1 = qg.slice(qg.indexOf('id: "qg1"'), qg.indexOf('id: "qg2"'));
  const moves = ["d4", "d5", "c4", "e6", "Nc3"];
  assert.match(qg1, /\["d4", "d5", "c4", "e6", "Nc3",/);
  assert.match(line, /QG_MEMORY_MOVES = \["d4", "d5", "c4", "e6", "Nc3"\]/);
  assert.match(line, /QG_MEMORY_PACK_ID = "qg-white"/);
  assert.match(line, /QG_MEMORY_NAME = "Queen's Gambit Declined"/);
  assert.doesNotMatch(line, /QG_MEMORY_MOVES = \[[^\]]*dxc4/);
  const chess = new Chess();
  const squares = [];
  for (const san of moves) {
    const played = chess.move(san);
    assert.ok(played, san);
    assert.equal(played.san, san);
    squares.push(played.from, played.to);
  }
  assert.deepEqual(squares, ["d2", "d4", "d7", "d5", "c2", "c4", "e7", "e6", "b1", "c3"]);
  assert.match(
    view,
    /You smashed it\. That's the Queen's Gambit Declined\. Want to learn openings properly\? Try the opening packs\./,
  );
  assert.match(view, /pick: "Declined"/);
  assert.match(view, /name: QG_MEMORY_NAME/);
  assert.match(view, /name=\{QG_MEMORY_NAME\}/);
  assert.match(view, /packLabel: "Queen's Gambit for White"/);
  assert.match(view, /packId: QG_MEMORY_PACK_ID/);
  assert.match(view, /id: "qg"/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(api, /value === "qg"/);
  assert.match(api, /qg: QG_MEMORY_LINE\.squares\.length/);
  assert.match(migration, /line in \('ruy', 'london', 'qg'\)/);
  assert.doesNotMatch(migration, /delete from square_memory_scores/);
});

test("a full clear is timed and only that time can join the shared board", () => {
  const view = src("src/components/opening-lab/square-memory.tsx");
  const api = src("src/routes/api/square-memory-scores.ts");
  const migration = src("migrations/0007_square_memory_scores.sql");
  const qgMigration = src("migrations/0008_square_memory_qg.sql");
  assert.match(view, /runStartRef\.current = now/);
  assert.match(view, /data-square-memory-time/);
  assert.match(view, /perfect && showClearTime && clearMs != null/);
  assert.match(view, /No times yet\./);
  assert.match(view, /data-square-memory-all-times/);
  assert.match(view, /All times/);
  assert.match(view, /data-square-memory-score-form/);
  assert.match(view, /data-square-memory-boards/);
  assert.match(view, /data-square-memory-leaderboard=\{lineId\}/);
  assert.match(view, /CHOICES\.map\(\(item\) =>/);
  assert.match(view, /\/api\/square-memory-scores/);
  assert.doesNotMatch(view, /localStorage\.setItem\([^)]*square-memory-scores/);
  assert.match(api, /getSql\(/);
  assert.match(api, /minimumClearMs/);
  assert.match(api, /cleanScoreName/);
  assert.match(migration, /create table if not exists square_memory_scores/);
  assert.match(migration, /line in \('ruy', 'london'\)/);
  assert.match(qgMigration, /line in \('ruy', 'london', 'qg'\)/);
  assert.doesNotMatch(api, /localStorage/);
});

test("Play shows Square Memory until seven taps hide it, and the website ignores the switch", async (t) => {
  const mod = await loadModule(t, "src/lib/play-app.ts", "play-preview.mjs");
  if (!mod) return;
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  t.after(() => {
    delete globalThis.localStorage;
  });
  assert.equal(mod.readSquareMemoryPlayPreview(), true);
  assert.equal(mod.SQUARE_MEMORY_PREVIEW_TAPS, 7);
  let taps = [];
  for (let i = 0; i < 6; i++) {
    const step = mod.nextSquareMemoryPreviewTaps(taps, 1_000 + i * 200);
    taps = step.taps;
    assert.equal(step.toggled, false);
  }
  const on = mod.nextSquareMemoryPreviewTaps(taps, 1_000 + 6 * 200);
  assert.equal(on.toggled, true);
  assert.deepEqual(on.taps, []);
  const stale = mod.nextSquareMemoryPreviewTaps([1_000], 1_000 + mod.SQUARE_MEMORY_PREVIEW_TAP_WINDOW_MS);
  assert.equal(stale.toggled, false);
  assert.equal(stale.taps.length, 1);
  assert.equal(mod.toggleSquareMemoryPlayPreview(), false);
  assert.equal(mod.readSquareMemoryPlayPreview(), false);
  assert.equal(mod.toggleSquareMemoryPlayPreview(), true);
  assert.equal(mod.readSquareMemoryPlayPreview(), true);
  const landing = src("src/components/opening-lab/home-intro.tsx");
  assert.match(landing, /if \(!isPlayApp\(\)\) return/);
  assert.equal((landing.match(/data-landing-square-memory/g) || []).length, 1);
});
