import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

async function loadClassic(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const dir = join(
    root,
    "scripts",
    `.generated-classic-sample-${process.pid}-${Math.random().toString(16).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  const opts = {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  };
  writeFileSync(
    join(dir, "play-skus.mjs"),
    ts.transpileModule(src("src/lib/play-skus.ts"), opts).outputText,
  );
  writeFileSync(
    join(dir, "catalog.mjs"),
    ts
      .transpileModule(src("src/lib/catalog.ts"), opts)
      .outputText.replaceAll("@/lib/play-skus", "./play-skus.mjs"),
  );
  writeFileSync(
    join(dir, "classic-sample.mjs"),
    ts
      .transpileModule(src("src/lib/classic-sample.ts"), opts)
      .outputText.replaceAll("@/lib/catalog", "./catalog.mjs")
      .replaceAll('from "@/data/packs"', ""),
  );
  writeFileSync(
    join(dir, "classic-run.mjs"),
    ts.transpileModule(src("src/lib/classic-run.ts"), opts).outputText,
  );
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  const classic = await import(pathToFileURL(join(dir, "classic-sample.mjs")).href);
  const catalog = await import(pathToFileURL(join(dir, "catalog.mjs")).href);
  const run = await import(pathToFileURL(join(dir, "classic-run.mjs")).href);
  return { classic, catalog, run };
}

test("Fischer vs Sherwin 1957 is the Sean-locked cut through 10...Qc7", async (t) => {
  const loaded = await loadClassic(t);
  if (!loaded) return;
  const mod = loaded.classic;
  const pack = mod.classicSamplePack();
  const line = pack.lines[0];
  assert.equal(pack.id, "classic-fischer-sherwin-1957");
  assert.equal(pack.name, "Classic GM — Fischer vs Sherwin, 1957");
  assert.equal(pack.isFree, true);
  assert.equal(pack.price, null);
  assert.equal(pack.badge, "KIA vs Sicilian");
  assert.equal(line.name, "King's Indian Attack vs Sicilian");
  assert.equal(line.side, "w");
  assert.equal(line.players.white, "Bobby Fischer");
  assert.equal(line.players.black, "J. Sherwin");
  assert.deepEqual(line.plies, [
    "e4",
    "c5",
    "Nf3",
    "e6",
    "d3",
    "Nc6",
    "g3",
    "Nf6",
    "Bg2",
    "Be7",
    "O-O",
    "O-O",
    "Nbd2",
    "Rb8",
    "Re1",
    "d6",
    "c3",
    "b6",
    "d4",
    "Qc7",
  ]);
  assert.equal(mod.verifyClassicSamplePlies(line.plies), null);
  assert.doesNotMatch(src("src/lib/classic-sample.ts"), /TODO\(run-the-game\)|11\.e5/);
  assert.doesNotMatch(src("src/lib/classic-sample.ts"), /Play on|vs computer|versus the computer/i);

  const run = loaded.run;
  assert.equal(run.CLASSIC_RUN_AUDIO, "/coach/classic-fischer-sherwin/professor-potato-pie-run-the-game.wav");
  assert.equal(run.CLASSIC_RUN_FALLBACK_SEC, 450.12);
  assert.equal(run.CLASSIC_RUN_BEATS.length, 61);
  assert.equal(run.verifyClassicRun(), null);
  const moves = run.classicRunMoves();
  assert.deepEqual(
    moves.slice(0, 20).map((move) => move.ply),
    line.plies,
  );
  assert.equal(moves[0].plyAtSec > run.CLASSIC_RUN_BEATS[3].atSec - 0.01, true);
  assert.equal(moves.at(-1).ply, "Bc6+");
  assert.equal(
    existsSync(join(root, "public/coach/classic-fischer-sherwin/professor-potato-pie-run-the-game.wav")),
    true,
  );
  let cursor = 0;
  for (const beat of run.CLASSIC_RUN_BEATS) {
    const owned = [];
    if (beat.ply) owned.push(beat.plyAtSec);
    for (const extra of beat.extraPlies ?? []) owned.push(extra.plyAtSec);
    for (const at of owned) {
      assert.equal(at >= beat.atSec - 0.001, true, beat.caption);
      const next = run.CLASSIC_RUN_BEATS[cursor + 1];
      if (next) assert.equal(at < next.atSec + 0.001, true, `${beat.ply} ${at}`);
    }
    cursor += 1;
  }
});

test("the Classic sample is free on the website and not a Play SKU", async (t) => {
  const loaded = await loadClassic(t);
  if (!loaded) return;
  const catalog = loaded.catalog;
  const id = "classic-fischer-sherwin-1957";
  assert.equal(catalog.VISIBLE_PACK_IDS.includes(id), false);
  assert.equal(catalog.LIVE_PACK_IDS.includes(id), false);
  assert.equal(catalog.PLAY_PATH_B_PACK_IDS.includes(id), false);
  assert.equal(catalog.isPackVisible(id), false);
  assert.equal(catalog.isPackComingSoon(id), false);
  assert.equal(catalog.isComingSoonClosed(id, []), false);
  assert.equal(catalog.canPurchasePack(id), false);
  assert.equal(catalog.isLineUnlocked({ id }, "fs1957", []), true);
  assert.equal(catalog.isLineUnlocked({ id }, "other", []), false);
  assert.equal(catalog.playSkuForVisiblePack(id), null);

  const skus = src("src/lib/play-skus.ts");
  assert.equal(skus.includes(id), false);
  assert.equal(skus.includes("pack_classic_fischer_sherwin_1957"), false);
  const packs = src("src/data/packs.ts");
  assert.equal(packs.includes('id: "classic-fischer-sherwin-1957"'), false);
});

test("www shows the Classic card and the gym; Play wrap does not", () => {
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const list = src("src/components/opening-lab/pack-list.tsx");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  const train = src("src/components/opening-lab/train-view.tsx");
  const hero = src("src/components/opening-lab/home-hero.tsx");

  assert.match(landing, /data-landing-classic/);
  assert.match(landing, /setShowClassic\(!isPlayApp\(\)\)/);
  assert.match(landing, /showClassic \?/);
  assert.match(landing, /t\("Classic GM — Fischer vs Sherwin, 1957"\)/);
  assert.match(landing, /t\("King's Indian Attack vs Sicilian"\)/);
  assert.match(landing, /onOpenPack\(WEBSITE_CLASSIC_SAMPLE_PACK_ID\)/);
  const puzzle = landing.indexOf("data-landing-puzzle");
  const classic = landing.indexOf("data-landing-classic");
  const openNow = landing.indexOf('t("Open now")');
  assert.ok(openNow >= 0 && puzzle > openNow && classic > puzzle);
  assert.doesNotMatch(landing, /data-landing-cta|landing-puzzle-card/);

  assert.match(list, /setShowClassicSample\(!isPlayWrap\(\)\)/);
  assert.match(list, /showClassicSample \? classicSamplePack\(\)/);
  assert.match(list, /classicSample \? renderCard\(classicSample\)/);
  assert.match(shell, /isClassicSamplePack\(pack\)\) return !isPlayWrap\(\)/);
  assert.match(shell, /parkRunTheGame=\{isClassicSamplePack\(active\.pack\)\}/);
  assert.match(hero, /parkRunTheGame=\{isClassicSamplePack\(pack\)\}/);
  assert.match(train, /data-run-the-game=\{runTheGame \? "live" : undefined\}/);
  assert.match(train, /beginClassicRunNarration\(\)/);
  assert.match(train, /ClassicRunTheGame/);
  assert.match(src("src/components/opening-lab/classic-run-the-game.tsx"), /CLASSIC_RUN_AUDIO/);
  assert.match(src("src/components/opening-lab/classic-run-the-game.tsx"), /plyAtSec=\{plyAtSec\}/);
  assert.doesNotMatch(train, /TODO\(run-the-game\)|Coming soon/);
  assert.doesNotMatch(train, /Play on|vs computer|versus the computer/i);
  assert.doesNotMatch(landing, /Play on|vs computer|versus the computer/i);
  assert.doesNotMatch(src("src/components/opening-lab/classic-run-the-game.tsx"), /Play on|vs computer|versus the computer/i);

  const copy = src("src/lib/classic-copy.ts");
  for (const lang of ["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"]) {
    assert.match(copy, new RegExp(`\\n  ${lang}:`));
  }
  assert.match(copy, /run: "Run the game"/);
  assert.doesNotMatch(copy, /Coming soon|11\.e5/);
  assert.match(src("src/lib/i18n.ts"), /CLASSIC_COPY\[lang\]/);

  assert.match(landing, /if \(!classicRunAlreadySeen\(\)\) beginClassicRunNarration\(\)/);
  assert.match(landing, /onOpenPack\(WEBSITE_CLASSIC_SAMPLE_PACK_ID\)/);
  assert.match(hero, /if \(playApp \|\| !isClassicSamplePack\(pack\)\) return/);
  assert.match(hero, /if \(classicRunAlreadySeen\(\)\) return/);
  assert.match(hero, /markClassicRunSeen\(\)/);
  assert.match(hero, /beginClassicRunNarration\(\)/);
  assert.match(hero, /autoRunTheGame: true/);
  assert.match(hero, /autoRunTheGame=\{frame\.autoRunTheGame === true\}/);
  assert.match(train, /useState\(\(\) => autoRunTheGame && parkRunTheGame\)/);
  assert.match(train, /if \(mode !== "learn"\) changeMode\("learn"\)/);
  assert.match(train, /else setRunTheGame\(false\)/);
  assert.match(shell, /autoRunTheGame=\{active\.autoRunTheGame === true\}/);
  assert.match(src("src/lib/classic-run.ts"), /opening-lab:classic-run-seen/);
  assert.doesNotMatch(hero, /Play on|vs computer|versus the computer/i);
});
