import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

test("next opening wraps around the picker", async (t) => {
  const mod = await loadModule(t, "src/lib/square-memory.ts", "logic-order.mjs");
  if (!mod) return;
  const ids = ["ruy", "london", "qg", "orthodox", "italian", "caro"];
  assert.equal(mod.nextInOrder(ids, "ruy"), "london");
  assert.equal(mod.nextInOrder(ids, "london"), "qg");
  assert.equal(mod.nextInOrder(ids, "qg"), "orthodox");
  assert.equal(mod.nextInOrder(ids, "orthodox"), "italian");
  assert.equal(mod.nextInOrder(ids, "italian"), "caro");
  assert.equal(mod.nextInOrder(ids, "caro"), "ruy");
});

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
  const {
    begin,
    tap,
    tick,
    FLASH_MS,
    GAP_MS,
    HIT_MS,
    minimumClearMs,
    formatClearTime,
    cleanScoreName,
  } = mod;
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

test("Square Memory game stays on the free card and opens the free game", () => {
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const css = src("src/styles.css");
  const page = src("src/routes/square-memory.tsx");
  const menu = src("src/components/opening-lab/landing-menu.tsx");
  const nav = landing.match(/<nav className="landing-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";
  const card = landing.slice(
    landing.indexOf("data-landing-square-memory") - 280,
    landing.indexOf("data-landing-square-memory") + 420,
  );
  assert.match(nav, /data-landing-feedback/);
  assert.doesNotMatch(
    nav,
    /Square Memory|data-landing-memory-bar|data-landing-account|data-landing-support/,
  );
  assert.match(card, /to="\/square-memory"/);
  assert.match(card, /Square Memory game/);
  assert.match(card, /data-landing-memory-new[\s\S]*?>\s*New\s*</);
  assert.doesNotMatch(landing, /What's new|What&apos;s new/);
  assert.doesNotMatch(
    css,
    /landing-memory-flash|landing-memory-chip|landing-memory-new|landing-nav-pair/,
  );
  assert.match(css, /\.landing-nav-new\s*\{[^}]*font-size:\s*0\.62rem/);
  assert.doesNotMatch(css, /\.landing-nav-new\s*\{[^}]*(#ffe400|animation)/);
  assert.match(menu, /data-menu-account/);
  assert.match(menu, /data-menu-feedback/);
  assert.match(menu, /data-menu-support/);
  assert.match(page, /<SquareMemory \/>/);
  assert.doesNotMatch(page, /readSquareMemoryPlayPreview|buyPack|checkout|unlock|stripe/i);
  assert.equal((landing.match(/data-landing-square-memory/g) || []).length, 1);
});

test("home shows Square Memory under the board in the website and the Play app", () => {
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const page = src("src/routes/square-memory.tsx");
  const view = src("src/components/opening-lab/square-memory.tsx");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const css = src("src/styles.css");

  assert.doesNotMatch(landing, /setShowMemory\(!isPlayApp\(\)/);
  assert.match(landing, /data-play-memory-preview/);
  assert.match(landing, /nextSquareMemoryPreviewTaps/);
  assert.doesNotMatch(landing, /Test mode|Preview Square Memory/);
  assert.doesNotMatch(landing, /showMemory \?/);
  assert.match(landing, /data-landing-square-memory/);
  assert.match(landing, /to="\/square-memory"/);
  assert.match(landing, /Square Memory/);
  const art = landing.indexOf("landing-hero-art");
  const memory = landing.indexOf("data-landing-square-memory");
  const openNow = landing.indexOf('t("Open now")');
  assert.equal(landing.indexOf("data-landing-puzzle"), -1);
  assert.ok(art >= 0 && memory > art && openNow > memory);
  assert.doesNotMatch(landing, /function LandingBoard[\s\S]*data-landing-square-memory/);

  assert.match(css, /\.landing-square-memory\s*\{[^}]*width:\s*100%/);
  assert.match(
    css,
    /@media \(min-width: 960px\)[\s\S]*\.landing-square-memory\s*\{[^}]*width:\s*min\(22rem,\s*100%\)/,
  );
  assert.doesNotMatch(hero, /square-memory|Square Memory/);

  assert.doesNotMatch(page, /readSquareMemoryPlayPreview|window\.location\.replace/);
  assert.match(view, /Watch the squares\. Tap them back in order\./);
  assert.match(view, /data-begin/);
  assert.match(view, /"Start"/);
  assert.doesNotMatch(view, /"Begin"/);
  assert.match(view, /data-mute/);
  assert.match(view, /data-square-memory-pack=\{choice\.packId\}/);
  assert.match(view, /href=\{`\/#pack\/\$\{choice\.packId\}`\}/);
  assert.match(view, /SQUARE_MEMORY_PACK_ID/);
  assert.match(view, /Well done, you did it!/);
  assert.doesNotMatch(view, /Play again/);
  assert.match(view, /localStorage/);
  assert.doesNotMatch(view, /document\.addEventListener\(\s*["']pointerdown/);
  assert.doesNotMatch(view, /document\.addEventListener\(\s*["']click/);
  assert.doesNotMatch(view, /speechSynthesis|\.mp3|\.wav|new Audio\(/);
  assert.doesNotMatch(`${page}\n${view}`, /stripe|play-billing|checkout|buyPack/i);

  const audio = src("src/lib/square-memory-audio.ts");
  assert.match(audio, /osc\.type = "square"/);
  assert.match(audio, /RANK_HZ/);
  assert.match(audio, /function woodClick/);
  assert.doesNotMatch(audio, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(
    css,
    /\.sqmem-sq\.is-flash,\s*\.sqmem-sq-light\.is-flash,\s*\.sqmem-sq-dark\.is-flash\s*\{[^}]*radial-gradient/,
  );
  assert.match(
    css,
    /\.sqmem-sq\.is-flash,\s*\.sqmem-sq-light\.is-flash,\s*\.sqmem-sq-dark\.is-flash\s*\{[^}]*box-shadow:/,
  );
  assert.doesNotMatch(
    css,
    /\.sqmem-sq\.is-flash,\s*\.sqmem-sq-light\.is-flash,\s*\.sqmem-sq-dark\.is-flash\s*\{[^}]*background:\s*#ffe400/,
  );
  assert.match(css, /\.sqmem-board\s*\{[^}]*width:\s*100%/);
  assert.match(view, /data-square-memory-status=\{snap\.phase\}/);
});

test("rank pitches follow a C pentatonic and the board keeps its glow cues", async (t) => {
  const mod = await loadModule(t, "src/lib/square-memory-audio.ts", "audio.mjs");
  if (!mod) return;
  const view = src("src/components/opening-lab/square-memory.tsx");
  const audio = src("src/lib/square-memory-audio.ts");
  const css = src("src/styles.css");
  const logic = src("src/lib/square-memory.ts");

  assert.deepEqual(
    ["a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8"].map((square) => mod.rankHz(square)),
    [...mod.RANK_HZ],
  );
  assert.deepEqual(mod.ROUND_TRIAD_HZ, [523.25, 659.25, 783.99]);
  assert.equal(mod.rankHz("e2"), mod.RANK_HZ[1]);
  assert.equal(mod.rankHz("e4"), mod.RANK_HZ[3]);
  assert.match(logic, /Math\.min\(2, squares\.length\)/);
  assert.match(logic, /length \+ 2/);
  assert.match(audio, /bp\.type = "bandpass"/);
  assert.match(audio, /osc\.type = "triangle"/);
  assert.match(audio, /exponentialRampToValueAtTime\(42/);
  assert.match(audio, /ROUND_TRIAD_HZ/);
  assert.doesNotMatch(audio, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(view, /playWatch\(next\.lit\)/);
  assert.match(view, /playHit\(square\)/);
  assert.match(view, /playWin\(\)/);
  assert.doesNotMatch(view, /sqmem-trace|PathTrace/);
  assert.match(view, /is-\$\{kind\}/);
  assert.match(view, /className="sqmem-ripple"/);
  assert.match(view, /sqmem-coord-rank/);
  assert.match(view, /sqmem-coord-file/);
  assert.doesNotMatch(view, /board-margin-ranks|board-margin-files|board-frame--margin-coords/);
  assert.match(css, /--square-dark:\s*#1b2028/i);
  assert.match(css, /--square-light:\s*#3e4756/i);
  assert.match(css, /--board-border:\s*#12151a/i);
  assert.match(css, /--coordinates:\s*rgba\(226,\s*232,\s*240,\s*0\.7\)/);
  assert.match(css, /--glow-amber:\s*#ffb800/i);
  assert.match(css, /--success-green:\s*#10b981/i);
  assert.match(css, /--error-red:\s*#ef4444/i);
  assert.match(css, /--app-bg:\s*#0f1216/i);
  assert.match(css, /--panel-bg:\s*#1e232a/i);
  assert.match(css, /--text-primary:\s*#f8fafc/i);
  assert.match(css, /\.sqmem-sq-dark\s*\{[^}]*var\(--square-dark\)/);
  assert.match(css, /\.sqmem-sq-light\s*\{[^}]*var\(--square-light\)/);
  assert.match(css, /\.sqmem-sq\s*\{[^}]*var\(--board-border\)/);
  assert.match(css, /\.sqmem-coord\s*\{[^}]*var\(--coordinates\)/);
  assert.match(css, /\.sqmem-board > \.board-frame\s*\{[^}]*var\(--board-border\)/);
  assert.match(css, /\.sqmem\s*\{[^}]*background:\s*var\(--app-bg\)/);
  assert.match(css, /\.sqmem\s*\{[^}]*color:\s*var\(--text-primary\)/);
  assert.match(css, /\.sqmem-boards\s*\{[^}]*background:\s*var\(--panel-bg\)/);
  assert.match(css, /\.sqmem-frame\s*\{[^}]*background:\s*var\(--panel-bg\)/);
  assert.match(css, /\.sqmem-frame-tools\s*\{[^}]*background:\s*var\(--panel-bg\)/);
  assert.match(css, /\.sqmem-dock\s*\{[^}]*background:\s*var\(--panel-bg\)/);
  assert.match(
    css,
    /\.sqmem-sq\.is-flash,\s*\.sqmem-sq-light\.is-flash,\s*\.sqmem-sq-dark\.is-flash\s*\{[^}]*var\(--glow-amber\)/,
  );
  assert.match(
    css,
    /\.sqmem-sq\.is-hit,\s*\.sqmem-sq-light\.is-hit,\s*\.sqmem-sq-dark\.is-hit\s*\{[^}]*var\(--success-green\)/,
  );
  assert.match(
    css,
    /\.sqmem-sq\.is-miss,\s*\.sqmem-sq-light\.is-miss,\s*\.sqmem-sq-dark\.is-miss\s*\{[^}]*var\(--error-red\)/,
  );
  assert.match(css, /\.sqmem-board\s*\{[^}]*place-items:\s*center/);
  assert.doesNotMatch(css, /\.sqmem-start\s*\{[^}]*background:\s*#23483c/);
  assert.match(css, /\.sqmem-start\s*\{[^}]*backdrop-filter:\s*blur/);
  assert.match(css, /@keyframes sqmem-glitch/);
  assert.match(css, /@keyframes sqmem-shake/);
  assert.match(css, /@keyframes sqmem-particle/);
  assert.doesNotMatch(css, /\.sqmem-trace/);
  assert.match(
    css,
    /\.sqmem-sq\.is-flash,\s*\.sqmem-sq-light\.is-flash,\s*\.sqmem-sq-dark\.is-flash\s*\{[^}]*var\(--glow-amber\)/,
  );
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
});

test("a full clear and a miss use plain popups, with no coach", () => {
  const view = src("src/components/opening-lab/square-memory.tsx");
  const audio = src("src/lib/square-memory-audio.ts");
  const css = src("src/styles.css");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  const catalog = src("src/lib/catalog.ts");
  assert.doesNotMatch(
    view,
    /big-red-portrait|coach-seated-v2|PerfectCheer|sqmem-cheer|Big Red|Professor Potato Pie|You smashed it/,
  );
  assert.match(view, /Well done, you did it!/);
  assert.match(view, /Not this time\./);
  assert.match(view, /data-square-memory-end="win"/);
  assert.match(view, /data-square-memory-end="miss"/);
  assert.match(view, /data-square-memory-next/);
  assert.match(view, /data-square-memory-retry/);
  assert.match(view, /data-square-memory-exit/);
  assert.match(view, />\s*Next\s*</);
  assert.match(view, />\s*Retry\s*</);
  assert.match(view, />\s*Exit\s*</);
  assert.match(view, /revealing && !snap\.perfect/);
  assert.match(view, /function chooseLine[\s\S]{0,240}startRun\(\)/);
  assert.doesNotMatch(view, /next\.id === choiceRef\.current\.id/);
  assert.match(view, /function exitToBoard[\s\S]{0,180}titleState\(bestRef\.current\)/);
  assert.match(view, /nextInOrder\(CHOICES, choiceRef\.current\)/);
  assert.match(view, /unlockAudio\(\)[\s\S]{0,280}performance\.now\(\)/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.doesNotMatch(audio, /You smashed it/);
  assert.doesNotMatch(css, /\.sqmem-cheer|is-cheer/);
  assert.match(css, /\.sqmem-end-back\s*\{[^}]*position:\s*absolute/);
  assert.match(
    css,
    /\.sqmem-grid\s*\{[^}]*grid-template-columns:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/,
  );
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
  assert.doesNotMatch(view, /You smashed it|Professor Potato Pie|coach-seated-v2|Big Red/);
  assert.match(view, /data-memory-line=\{item\.id\}/);
  assert.match(view, /<h1 className="sqmem-title">Square Memory<\/h1>/);
  assert.doesNotMatch(view, /London Memory|Square London/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(page, /createFileRoute\("\/square-memory-london"\)/);
  assert.match(page, /window\.location\.replace\("\/square-memory"\)/);
  assert.doesNotMatch(page, /isPlayApp\(\)|readSquareMemoryPlayPreview/);
  assert.match(page, /Square Memory · Opening Lab/);
  assert.doesNotMatch(page, /London Memory/);
  const memory = landing.indexOf("data-landing-square-memory");
  const recall = landing.indexOf("data-landing-recall");
  assert.equal(landing.indexOf("data-landing-puzzle"), -1);
  assert.ok(memory > 0 && recall > memory);
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
  assert.doesNotMatch(view, /You smashed it/);
  assert.match(view, /pick: "Declined"/);
  assert.match(view, /name: QG_MEMORY_NAME/);
  assert.match(view, /\{choice\.name\}/);
  assert.match(view, /packLabel: "Queen's Gambit for White"/);
  assert.match(view, /packId: QG_MEMORY_PACK_ID/);
  assert.match(view, /id: "qg"/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(api, /value === "qg"/);
  assert.match(api, /qg: QG_MEMORY_LINE\.squares\.length/);
  assert.match(migration, /line in \('ruy', 'london', 'qg'\)/);
  assert.doesNotMatch(migration, /delete from square_memory_scores/);
});

test("QGD Orthodox Exchange is a fourth line on the same page, from Black's side", () => {
  const line = src("src/lib/square-memory-orthodox.ts");
  const view = src("src/components/opening-lab/square-memory.tsx");
  const api = src("src/routes/api/square-memory-scores.ts");
  const migration = src("migrations/0009_square_memory_orthodox.sql");
  const qg = src("src/lib/square-memory-qg.ts");
  const moves = [
    "d4",
    "d5",
    "c4",
    "e6",
    "Nc3",
    "Nf6",
    "Bg5",
    "Be7",
    "e3",
    "O-O",
    "Nf3",
    "Nbd7",
    "cxd5",
    "exd5",
    "Bd3",
    "c6",
    "Qc2",
    "Re8",
  ];
  assert.match(
    line.replace(/\s+/g, " "),
    /ORTHODOX_MEMORY_MOVES = \[ "d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "cxd5", "exd5", "Bd3", "c6", "Qc2", "Re8", \] as const/,
  );
  assert.match(line, /ORTHODOX_MEMORY_NAME = "QGD Orthodox Exchange"/);
  assert.match(line, /ORTHODOX_MEMORY_PACK_ID = "qgd-black"/);
  assert.match(line, /ORTHODOX_MEMORY_ORIENTATION = "black"/);
  assert.match(qg, /QG_MEMORY_MOVES = \["d4", "d5", "c4", "e6", "Nc3"\]/);
  const chess = new Chess();
  const squares = [];
  for (const san of moves) {
    const played = chess.move(san);
    assert.ok(played, san);
    assert.equal(played.san, san);
    squares.push(played.from, played.to);
  }
  assert.equal(squares.length, 36);
  assert.deepEqual(squares, [
    "d2",
    "d4",
    "d7",
    "d5",
    "c2",
    "c4",
    "e7",
    "e6",
    "b1",
    "c3",
    "g8",
    "f6",
    "c1",
    "g5",
    "f8",
    "e7",
    "e2",
    "e3",
    "e8",
    "g8",
    "g1",
    "f3",
    "b8",
    "d7",
    "c4",
    "d5",
    "e6",
    "d5",
    "f1",
    "d3",
    "c7",
    "c6",
    "d1",
    "c2",
    "f8",
    "e8",
  ]);
  assert.equal(chess.fen(), "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBPN2/PPQ2PPP/R3K2R w KQ - 2 10");
  assert.match(view, /id: "orthodox"/);
  assert.match(view, /pick: "Orthodox"/);
  assert.match(view, /name: ORTHODOX_MEMORY_NAME/);
  assert.match(view, /\{choice\.name\}/);
  assert.match(view, /orientation: ORTHODOX_MEMORY_ORIENTATION/);
  assert.match(view, /orientation: "white"/);
  assert.match(view, /orientation=\{choice\.orientation\}/);
  assert.match(view, /data-board-orientation=\{orientation\}/);
  assert.match(view, /Chessboard, Black at the bottom/);
  assert.match(view, /Chessboard, White at the bottom/);
  assert.doesNotMatch(view, /You smashed it/);
  assert.match(view, /packLabel: "Queen's Gambit Declined for Black"/);
  assert.doesNotMatch(`${line}\n${view}`, /5 book \+ 5 punish/);
  assert.match(api, /value === "orthodox"/);
  assert.match(api, /orthodox: ORTHODOX_MEMORY_LINE\.squares\.length/);
  assert.match(migration, /line in \('ruy', 'london', 'qg', 'orthodox'\)/);
  assert.doesNotMatch(migration, /delete from square_memory_scores/);
  assert.match(view, /id: "ruy"/);
  assert.match(view, /id: "london"/);
  assert.match(view, /id: "qg"/);
});

test("Italian Game is a fifth line on the same page, from White's side", () => {
  const packs = src("src/data/packs.ts");
  const line = src("src/lib/square-memory-italian.ts");
  const view = src("src/components/opening-lab/square-memory.tsx");
  const api = src("src/routes/api/square-memory-scores.ts");
  const migration = src("migrations/0011_square_memory_italian_caro.sql");
  const css = src("src/styles.css");
  const italian = packs.slice(
    packs.indexOf('id: "italian-white"'),
    packs.indexOf('id: "ruy-lopez-white"'),
  );
  const it1 = italian.slice(italian.indexOf('id: "it1"'), italian.indexOf('id: "it2"'));
  const moves = ["e4", "e5", "Nf3", "Nc6", "Bc4"];
  assert.match(it1, /\["e4", "e5", "Nf3", "Nc6", "Bc4",/);
  assert.match(line, /ITALIAN_MEMORY_MOVES = \["e4", "e5", "Nf3", "Nc6", "Bc4"\]/);
  assert.match(line, /ITALIAN_MEMORY_PACK_ID = "italian-white"/);
  assert.match(line, /ITALIAN_MEMORY_NAME = "Italian Game"/);
  assert.doesNotMatch(line, /ITALIAN_MEMORY_MOVES = \[[^\]]*Bc5/);
  const chess = new Chess();
  const squares = [];
  for (const san of moves) {
    const played = chess.move(san);
    assert.ok(played, san);
    assert.equal(played.san, san);
    squares.push(played.from, played.to);
  }
  assert.deepEqual(squares, ["e2", "e4", "e7", "e5", "g1", "f3", "b8", "c6", "f1", "c4"]);
  assert.equal(chess.fen(), "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3");
  assert.match(view, /id: "italian"/);
  assert.match(view, /pick: "Italian"/);
  assert.match(view, /name: ITALIAN_MEMORY_NAME/);
  assert.match(view, /\{choice\.name\}/);
  assert.match(view, /packLabel: "Italian Game for White"/);
  assert.match(view, /packId: ITALIAN_MEMORY_PACK_ID/);
  assert.match(view, /opening-lab:square-memory-italian-best/);
  assert.match(view, /orientation: "white"/);
  assert.doesNotMatch(view, /You smashed it|Professor Potato Pie|coach-seated-v2/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(api, /value === "italian"/);
  assert.match(api, /italian: ITALIAN_MEMORY_LINE\.squares\.length/);
  assert.match(migration, /line in \('ruy', 'london', 'qg', 'orthodox', 'italian', 'caro'\)/);
  assert.doesNotMatch(migration, /delete from square_memory_scores/);
  assert.match(
    css,
    /\.sqmem-grid\s*\{[^}]*grid-template-columns:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(
    css,
    /\.sqmem-grid\s*\{[^}]*grid-template-rows:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(view, /axes\.ranks\.map\(\(rank\) =>\s*axes\.files\.map\(\(file\) =>/);
});

test("Caro-Kann is a sixth line on the same page, from Black's side", () => {
  const packs = src("src/data/packs.ts");
  const line = src("src/lib/square-memory-caro.ts");
  const view = src("src/components/opening-lab/square-memory.tsx");
  const api = src("src/routes/api/square-memory-scores.ts");
  const migration = src("migrations/0011_square_memory_italian_caro.sql");
  const caro = packs.slice(
    packs.indexOf('id: "caro-kann-black"'),
    packs.indexOf('id: "qgd-black"'),
  );
  const ckb1 = caro.slice(caro.indexOf('id: "ckb1"'), caro.indexOf('id: "ckb2"'));
  const moves = ["e4", "c6", "d4", "d5", "e5"];
  assert.match(ckb1, /\["e4", "c6", "d4", "d5", "e5",/);
  assert.match(line, /CARO_MEMORY_MOVES = \["e4", "c6", "d4", "d5", "e5"\]/);
  assert.match(line, /CARO_MEMORY_PACK_ID = "caro-kann-black"/);
  assert.match(line, /CARO_MEMORY_NAME = "Caro-Kann"/);
  assert.match(line, /CARO_MEMORY_ORIENTATION = "black"/);
  assert.doesNotMatch(line, /CARO_MEMORY_MOVES = \[[^\]]*Bf5/);
  const chess = new Chess();
  const squares = [];
  for (const san of moves) {
    const played = chess.move(san);
    assert.ok(played, san);
    assert.equal(played.san, san);
    squares.push(played.from, played.to);
  }
  assert.deepEqual(squares, ["e2", "e4", "c7", "c6", "d2", "d4", "d7", "d5", "e4", "e5"]);
  assert.equal(chess.fen(), "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3");
  assert.match(view, /id: "caro"/);
  assert.match(view, /pick: "Caro-Kann"/);
  assert.match(view, /name: CARO_MEMORY_NAME/);
  assert.match(view, /\{choice\.name\}/);
  assert.match(view, /orientation: CARO_MEMORY_ORIENTATION/);
  assert.match(view, /orientation=\{choice\.orientation\}/);
  assert.match(view, /data-board-orientation=\{orientation\}/);
  assert.match(view, /Chessboard, Black at the bottom/);
  assert.match(view, /files: \["h", "g", "f", "e", "d", "c", "b", "a"\]/);
  assert.match(view, /ranks: \["1", "2", "3", "4", "5", "6", "7", "8"\]/);
  assert.doesNotMatch(view, /You smashed it/);
  assert.match(view, /packLabel: "Caro-Kann for Black"/);
  assert.match(view, /packId: CARO_MEMORY_PACK_ID/);
  assert.match(view, /opening-lab:square-memory-caro-best/);
  assert.doesNotMatch(view, /Professor Potato Pie|coach-seated-v2|Big Red/);
  assert.doesNotMatch(`${line}\n${view}`, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(api, /value === "caro"/);
  assert.match(api, /caro: CARO_MEMORY_LINE\.squares\.length/);
  assert.match(migration, /line in \('ruy', 'london', 'qg', 'orthodox', 'italian', 'caro'\)/);
  assert.doesNotMatch(migration, /delete from square_memory_scores/);
});

test("play hides the timer and the leaderboards, and the score store stays", () => {
  const view = src("src/components/opening-lab/square-memory.tsx");
  const api = src("src/routes/api/square-memory-scores.ts");
  const migration = src("migrations/0007_square_memory_scores.sql");
  const qgMigration = src("migrations/0008_square_memory_qg.sql");
  assert.doesNotMatch(
    view,
    /\/api\/square-memory-scores|data-square-memory-time|Save time|All times|No times yet|data-square-memory-boards|data-square-memory-score-form|Full clear|formatClearTime|runStartRef|sqmem-plaque/,
  );
  assert.match(view, /Well done, you did it!/);
  assert.match(api, /getSql\(/);
  assert.match(api, /minimumClearMs/);
  assert.match(api, /cleanScoreName/);
  assert.match(migration, /create table if not exists square_memory_scores/);
  assert.match(migration, /line in \('ruy', 'london'\)/);
  assert.match(qgMigration, /line in \('ruy', 'london', 'qg'\)/);
  assert.doesNotMatch(api, /localStorage/);
  assert.doesNotMatch(migration, /delete from square_memory_scores/);
});

test("tapping an opening mid-round abandons it and starts that opening", () => {
  const view = src("src/components/opening-lab/square-memory.tsx");
  const choose = view.slice(
    view.indexOf("function chooseLine"),
    view.indexOf("function exitToBoard"),
  );
  assert.match(choose, /if \(!applyChoice\(id\)\) return;\s*startRun\(\);/);
  assert.doesNotMatch(choose, /phase|watch|input|punish|reveal|title/);
  const startRun = view.slice(view.indexOf("function startRun"), view.indexOf("function start("));
  assert.doesNotMatch(startRun, /phase !==|return;/);
  assert.match(startRun, /begin\(bestRef\.current, now, choiceRef\.current\.line\.squares\)/);
  assert.doesNotMatch(view, /disabled=\{playing\}|disabled=\{locked\}/);
});

test("a completed game renders the plain win popup and no coach", () => {
  const view = src("src/components/opening-lab/square-memory.tsx");
  const win = view.slice(view.indexOf("function WinEnd"), view.indexOf("function MissEnd"));
  const shown = view.slice(view.indexOf("{perfect ?"), view.indexOf("{revealing && !snap.perfect"));
  assert.match(shown, /<WinEnd onNext=\{nextOpening\} onExit=\{exitToBoard\} \/>/);
  assert.doesNotMatch(shown, /Cheer|coach|portrait|img|You smashed|Big Red|Potato/);
  assert.match(win, /Well done, you did it!/);
  assert.match(win, />\s*Next\s*</);
  assert.match(win, />\s*Exit\s*</);
  assert.doesNotMatch(
    win,
    /img|portrait|coach|Big Red|Professor Potato Pie|You smashed|Full clear|Save time|sqmem-time/,
  );
  assert.doesNotMatch(
    view,
    /PerfectCheer|sqmem-cheer|big-red-portrait|coach-seated|You smashed it|Big Red|Professor Potato Pie|<img/,
  );
});

test("no connecting line renders during the demo or player taps", async (t) => {
  const view = src("src/components/opening-lab/square-memory.tsx");
  const css = src("src/styles.css");
  const route = src("src/routes/square-memory.tsx");
  const libs = [
    "src/lib/square-memory.ts",
    "src/lib/square-memory-audio.ts",
    "src/lib/square-memory-line.ts",
    "src/lib/square-memory-london.ts",
    "src/lib/square-memory-qg.ts",
    "src/lib/square-memory-orthodox.ts",
    "src/lib/square-memory-italian.ts",
    "src/lib/square-memory-caro.ts",
  ]
    .map((rel) => src(rel))
    .join("\n");
  const drawn =
    /<(svg|line|polyline|path)\b|sqmem-trace|PathTrace|squareCenter|data-board-arrows|laser|connector|trail/i;

  const board = view.slice(view.indexOf("function MemoryBoard"), view.indexOf("function kindFor"));
  const boardCall = view.slice(view.indexOf("<MemoryBoard"), view.indexOf("/>", view.indexOf("<MemoryBoard")));
  assert.ok(board.includes("function MemoryBoard"));
  assert.doesNotMatch(board, drawn);
  assert.doesNotMatch(boardCall, /trace=|trail=|path=|squares=\{|line\.squares\.slice/);
  assert.doesNotMatch(view, drawn);
  assert.doesNotMatch(libs, drawn);
  assert.doesNotMatch(css, /\.sqmem-trace|sqmem-trace-in|sqmem-laser|sqmem-trail|sqmem-connector|data-board-arrows/);
  assert.match(board, /is-\$\{kind\}/);
  assert.match(board, /<HitRipple/);
  assert.match(view, /className="sqmem-ripple"/);
  assert.match(view, /litKind === "hit"/);
  assert.match(view, /playHit\(square\)/);

  assert.match(route, /<SquareMemory \/>/);
  assert.doesNotMatch(
    `${route}\n${view}`,
    /SquareMemoryLevels|Opening lines|data-sml-|square-memory-levels|square-memory-positions/,
  );
  for (const rel of [
    "src/components/opening-lab/square-memory-levels.tsx",
    "src/lib/square-memory-levels.ts",
    "src/lib/square-memory-positions.ts",
    "scripts/square-memory-levels.test.mjs",
    "scripts/square-memory-levels-validate.py",
  ]) {
    assert.equal(existsSync(join(root, rel)), false, rel);
  }

  const mod = await loadModule(t, "src/lib/square-memory.ts", "board-lines.mjs");
  if (!mod) return;
  let now = 1_000;
  let state = mod.begin(0, now, SQUARES);
  const marks = [];
  const expectNoLine = (snap, label) => {
    assert.equal(snap.trace, undefined, label);
    assert.equal(snap.trail, undefined, label);
    assert.equal(snap.path, undefined, label);
    assert.equal(snap.lines, undefined, label);
    assert.equal(snap.connectors, undefined, label);
    marks.push(`${snap.phase}:${snap.litKind ?? "dark"}`);
  };

  assert.equal(state.phase, "watch");
  for (let guard = 0; guard < 40 && state.phase === "watch"; guard++) {
    expectNoLine(state, "demo");
    now = state.lit ? state.litUntil : state.gapUntil;
    const next = mod.tick(state, now, SQUARES);
    if (next === state) throw new Error("demo flash made no progress");
    state = next;
  }
  assert.equal(state.phase, "input");
  for (const square of SQUARES.slice(0, state.length)) {
    expectNoLine(state, `before ${square}`);
    const tapped = mod.tap(state, square, SQUARES, now);
    assert.notEqual(tapped, state);
    assert.equal(tapped.lit, square);
    assert.equal(tapped.litKind, "hit");
    expectNoLine(tapped, `tap ${square}`);
    now = tapped.litUntil;
    state = mod.tick(tapped, now, SQUARES);
  }
  assert.ok(marks.some((mark) => mark.startsWith("watch:flash")));
  assert.ok(marks.some((mark) => mark.startsWith("input:hit")));
});

test("Play preview is off until seven taps, and the website ignores it", async (t) => {
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
  assert.equal(mod.readSquareMemoryPlayPreview(), false);
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
  const stale = mod.nextSquareMemoryPreviewTaps(
    [1_000],
    1_000 + mod.SQUARE_MEMORY_PREVIEW_TAP_WINDOW_MS,
  );
  assert.equal(stale.toggled, false);
  assert.equal(stale.taps.length, 1);
  assert.equal(mod.toggleSquareMemoryPlayPreview(), true);
  assert.equal(mod.readSquareMemoryPlayPreview(), true);
  assert.equal(mod.toggleSquareMemoryPlayPreview(), false);
  assert.equal(mod.readSquareMemoryPlayPreview(), false);
  const landing = src("src/components/opening-lab/home-intro.tsx");
  assert.match(landing, /if \(!isPlayApp\(\)\) return/);
  assert.equal((landing.match(/data-landing-square-memory/g) || []).length, 1);
});
