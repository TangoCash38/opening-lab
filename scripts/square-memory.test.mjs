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
  const gym = landing.indexOf("data-landing-cta");
  const art = landing.indexOf("landing-hero-art");
  const memory = landing.indexOf("data-landing-square-memory");
  const puzzle = landing.indexOf("data-landing-puzzle");
  const openNow = landing.indexOf('t("Open now")');
  assert.ok(art >= 0 && gym > art && memory > gym && puzzle > memory && openNow > memory);
  assert.doesNotMatch(landing, /function LandingBoard[\s\S]*data-landing-square-memory/);

  assert.match(css, /\.landing-square-memory\s*\{[^}]*width:\s*100%/);
  assert.match(css, /@media \(min-width: 960px\)[\s\S]*\.landing-square-memory\s*\{[^}]*width:\s*min\(22rem,\s*100%\)/);
  assert.doesNotMatch(hero, /square-memory|Square Memory/);

  assert.match(page, /isPlayApp\(\)/);
  assert.match(page, /window\.location\.replace\("\/"\)/);
  assert.match(view, /Watch the squares\. Tap them back in order\./);
  assert.match(view, /data-begin/);
  assert.match(view, /data-mute/);
  assert.match(view, /data-square-memory-pack=\{SQUARE_MEMORY_PACK_ID\}/);
  assert.match(view, /href=\{`\/#pack\/\$\{SQUARE_MEMORY_PACK_ID\}`\}/);
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
  assert.match(view, /perfect \? <PerfectCheer \/> : null/);
  assert.match(view, /revealing && !snap\.perfect/);
  assert.match(
    view,
    /You smashed it\. That's the Ruy Lopez\. Want to learn openings properly\? Try the opening packs\./,
  );
  assert.match(view, /data-square-memory-cheer/);
  assert.match(view, /alt="Big Red"/);
  assert.match(view, /data-square-memory-gym/);
  assert.match(view, /href="\/#gym"/);
  assert.doesNotMatch(view, /Potato Pie|coach-seated/);
  assert.doesNotMatch(view, /speechSynthesis|new Audio\(|\.mp3|\.wav/);
  assert.doesNotMatch(audio, /You smashed it/);
  assert.match(css, /\.sqmem-cheer-portrait\s*\{[^}]*width:\s*46%/);
  assert.match(css, /\.sqmem-cheer-bubble/);
  assert.match(catalog, /export function readRequestedGym/);
  assert.match(catalog, /raw === "gym"/);
  assert.match(shell, /readRequestedGym\(\) && !isPlayWrap\(\)\) goPacks\(\)/);
  assert.match(shell, /if \(isPlayWrap\(\)\) return/);
});
