import assert from "node:assert/strict";
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

test("website home shows Square Memory under the gym and Play does not", () => {
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const page = src("src/routes/square-memory.tsx");
  const view = src("src/components/opening-lab/square-memory.tsx");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const css = src("src/styles.css");

  assert.match(landing, /setShowMemory\(!isPlayApp\(\)\)/);
  assert.match(landing, /showMemory \?/);
  assert.match(landing, /data-landing-square-memory/);
  assert.match(landing, /to="\/square-memory"/);
  assert.match(landing, /Square Memory/);
  const art = landing.indexOf("landing-hero-art");
  const memory = landing.indexOf("data-landing-square-memory");
  const puzzle = landing.indexOf("data-landing-puzzle");
  const openNow = landing.indexOf('t("Open now")');
  assert.ok(art >= 0 && memory > art && openNow > memory && puzzle > openNow);
  assert.doesNotMatch(landing, /function LandingBoard[\s\S]*data-landing-square-memory/);
  assert.doesNotMatch(landing, /data-landing-cta|landing-puzzle-card/);

  assert.match(css, /\.landing-memory-link\s*\{/);
  assert.doesNotMatch(css, /\.landing-square-memory\s*\{/);
  assert.doesNotMatch(hero, /square-memory|Square Memory/);

  assert.match(page, /isPlayApp\(\)/);
  assert.match(page, /window\.location\.replace\("\/"\)/);
  assert.match(view, /Watch the squares\. Tap them back in order\./);
  assert.match(view, /data-begin/);
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
  const css = src("src/styles.css");
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
  assert.match(view, /role="group"/);
  assert.match(view, /aria-pressed=\{item\.id === choiceId\}/);
  assert.match(view, /sqmem-pick-portrait/);
  assert.match(view, /src=\{item\.portrait\}/);
  assert.match(css, /\.sqmem-pick\s*\{[^}]*grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /\.sqmem-pick-line\s*\{[^}]*min-height:\s*8\.6rem/);
  assert.match(view, /data-square-memory-stage/);
  assert.match(view, /<h1 className="sqmem-title">Square Memory<\/h1>/);
  assert.doesNotMatch(view, /London Memory|Square London/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.match(page, /createFileRoute\("\/square-memory-london"\)/);
  assert.match(page, /isPlayApp\(\)/);
  assert.match(page, /window\.location\.replace\(isPlayApp\(\) \? "\/" : "\/square-memory"\)/);
  assert.match(page, /Square Memory · Opening Lab/);
  assert.doesNotMatch(page, /London Memory/);
  const memory = landing.indexOf("data-landing-square-memory");
  const puzzle = landing.indexOf("data-landing-puzzle");
  assert.ok(memory > 0 && puzzle > memory);
  assert.doesNotMatch(landing, /data-landing-london-memory|London Memory|landing-memory-row/);
  assert.match(ruyLine, /SQUARE_MEMORY_MOVES = \["e4", "e5", "Nf3", "Nc6", "Bb5"\]/);
});

test("the live clock runs from Begin and stops on a miss or a clear", async (t) => {
  const mod = await loadModule(t, "src/lib/square-memory.ts", "clock.mjs");
  if (!mod) return;
  const { begin, tap, tick, clockRunning, clockVisible, titleState } = mod;
  const title = titleState(0);
  assert.equal(clockVisible(title.phase), false);
  assert.equal(clockRunning(title.phase, title.cursor, title.length, SQUARES.length), false);

  let now = 5000;
  let state = begin(0, now, SQUARES);
  assert.equal(clockVisible(state.phase), true);
  assert.equal(clockRunning(state.phase, state.cursor, state.length, SQUARES.length), true);
  ({ state, now } = drainWatch(tick, state, now));
  assert.equal(state.phase, "input");
  assert.equal(clockRunning(state.phase, state.cursor, state.length, SQUARES.length), true);
  state = tap(state, "e2", SQUARES, now);
  state = tap(state, "e4", SQUARES, now);
  assert.equal(state.cursor, state.length);
  assert.equal(clockRunning(state.phase, state.cursor, state.length, SQUARES.length), true);
  now += mod.HIT_MS;
  state = tick(state, now, SQUARES);
  assert.equal(state.phase, "watch");
  assert.equal(clockRunning(state.phase, state.cursor, state.length, SQUARES.length), true);

  ({ state, now } = drainWatch(tick, state, now));
  state = tap(state, "a1", SQUARES, now);
  assert.equal(state.phase, "punish");
  assert.equal(clockVisible(state.phase), true);
  assert.equal(clockRunning(state.phase, state.cursor, state.length, SQUARES.length), false);
  state = tick(state, state.litUntil, SQUARES);
  assert.equal(state.phase, "reveal");
  assert.equal(clockVisible(state.phase), false);

  const full = SQUARES;
  let clear = begin(0, 0, full);
  let at = 0;
  for (let guard = 0; guard < 80 && clear.phase !== "reveal"; guard++) {
    if (clear.phase === "watch" || (clear.phase === "input" && clear.cursor === clear.length)) {
      at = clear.phase === "watch" ? (clear.lit ? clear.litUntil : clear.gapUntil) : clear.litUntil;
      clear = tick(clear, at, full);
      continue;
    }
    if (clear.phase === "input") {
      const square = full[clear.cursor];
      const before = clear.length;
      clear = tap(clear, square, full, at);
      if (before >= full.length && clear.cursor >= full.length) {
        assert.equal(clockRunning(clear.phase, clear.cursor, clear.length, full.length), false);
      }
      continue;
    }
    break;
  }
  assert.equal(clear.perfect, true);
  assert.equal(clockVisible("reveal"), false);
});

test("a full clear is timed and only that time can join the shared board", () => {
  const view = src("src/components/opening-lab/square-memory.tsx");
  const api = src("src/routes/api/square-memory-scores.ts");
  const migration = src("migrations/0007_square_memory_scores.sql");
  assert.match(view, /runStartRef\.current = now/);
  assert.match(view, /data-square-memory-clock/);
  assert.match(view, /clockVisible\(snap\.phase\)/);
  assert.match(view, /clockRunning\(/);
  assert.match(view, /publishClockRef\.current\(0, true\)/);
  assert.doesNotMatch(view, /data-square-memory-clock[\s\S]{0,80}snap\.phase === "title"/);
  assert.match(view, /data-square-memory-time/);
  assert.match(view, /perfect && clearMs != null \?/);
  assert.match(view, /data-square-memory-score-form/);
  assert.match(view, /data-square-memory-leaderboard=\{lineId\}/);
  assert.match(view, /\/api\/square-memory-scores/);
  assert.doesNotMatch(view, /localStorage\.setItem\([^)]*square-memory-scores/);
  assert.match(api, /getSql\(/);
  assert.match(api, /minimumClearMs/);
  assert.match(api, /cleanScoreName/);
  assert.match(migration, /create table if not exists square_memory_scores/);
  assert.match(migration, /line in \('ruy', 'london'\)/);
  assert.doesNotMatch(api, /localStorage/);
});
