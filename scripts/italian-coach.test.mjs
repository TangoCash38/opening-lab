import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");
const require = createRequire(join(root, "package.json"));

function compileCoachPacks(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const dir = join(root, "scripts", ".generated-italian-coach");
  mkdirSync(dir, { recursive: true });
  const options = {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  };
  const scotchJs = ts.transpileModule(src("src/lib/scotch-coach.ts"), options).outputText;
  writeFileSync(join(dir, "scotch-coach.mjs"), scotchJs);
  const caroJs = ts.transpileModule(src("src/lib/caro-intro-stem.ts"), options).outputText;
  writeFileSync(join(dir, "caro-intro-stem.mjs"), caroJs);
  const londonJs = ts.transpileModule(src("src/lib/london-intro-stem.ts"), options).outputText;
  writeFileSync(join(dir, "london-intro-stem.mjs"), londonJs);
  const qgJs = ts.transpileModule(src("src/lib/qg-intro-stem.ts"), options).outputText;
  writeFileSync(join(dir, "qg-intro-stem.mjs"), qgJs);
  const js = ts
    .transpileModule(src("src/lib/coach-packs.ts"), options)
    .outputText.replaceAll("@/lib/scotch-coach", "./scotch-coach.mjs")
    .replaceAll("@/lib/caro-intro-stem", "./caro-intro-stem.mjs")
    .replaceAll("@/lib/london-intro-stem", "./london-intro-stem.mjs")
    .replaceAll("@/lib/qg-intro-stem", "./qg-intro-stem.mjs");
  writeFileSync(join(dir, "coach-packs.mjs"), js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return "./scripts/.generated-italian-coach/coach-packs.mjs";
}

test("Italian Potato Pie intro plays the stem with speech and arrows the replies", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  const wav = "public/coach/italian-white/professor-potato-pie-italian-intro.wav";
  const lineWav = "public/coach/italian-white/professor-potato-pie-italian-line1.wav";
  assert.equal(existsSync(join(root, wav)), true);
  assert.equal(existsSync(join(root, lineWav)), true);
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const board = src("src/components/opening-lab/scotch-coach-board.tsx");
  const catalog = src("src/lib/catalog.ts");
  const packs = src("src/data/packs.ts");
  const intro = src("src/lib/pack-intro.ts");
  assert.match(catalog, /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white"\]/);
  assert.doesNotMatch(catalog, /"italian-white":\s*\[/);
  assert.match(packs, /id: "italian-white"[\s\S]{0,280}price: "£1\.99"/);
  assert.match(packs, /blurb: "10 lines from Opening Lab"/);
  assert.doesNotMatch(packs, /5 book lines \+ 5 punish/);
  const opening = intro.slice(intro.indexOf('"italian-white"'), intro.indexOf('"ruy-white"'));
  assert.match(opening, /10 lines from Opening Lab\. Practice with the green hint, then Test with none\./);
  assert.doesNotMatch(opening, /Lines 1–5 are book/);
  assert.doesNotMatch(opening, /punish/);
  assert.match(hero, /pack\.id === "italian-white"/);
  assert.match(hero, /l\.id === "it1"/);
  assert.match(hero, /Unpaid visitors still hear Potato Pie/);
  assert.match(hero, /if \(!practiceOpen\) return/);
  assert.match(hero, /whiteOnly=\{coachPack\(pack\.id\)\?\.introStemWhiteOnly === true\}/);
  assert.match(hero, /introArrows=\{coachPack\(pack\.id\)\?\.introArrows\}/);
  assert.doesNotMatch(hero, /coachIntroEndsOnLineList/);
  assert.match(board, /playWhiteOnlySan/);
  assert.match(board, /data-coach-white-only/);
  assert.match(src("src/lib/coach-packs.ts"), /firstLineAudio: ITALIAN_LINE_WAV/);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      const { Chess } = await import("chess.js");
      const { PACKS } = await import("./src/data/packs.ts");
      const {
        COACH_PACKS,
        ITALIAN_INTRO_ARROWS,
        ITALIAN_INTRO_STEM,
        ITALIAN_INTRO_STEM_AT_SEC,
        coachAudioPlyCount,
        coachIntroArrowsAt,
        coachIntroSessionKey,
        coachLinePlyCues,
        coachLineSessionKey,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
        coachTextPlayedSans,
      } = await import(${JSON.stringify(compiled)});
      const pack = PACKS.find((item) => item.id === "italian-white");
      if (!pack) throw new Error("italian pack missing");
      if (pack.price !== "£1.99") throw new Error("price " + pack.price);
      if (pack.blurb !== "10 lines from Opening Lab") throw new Error("blurb " + pack.blurb);
      const coach = COACH_PACKS["italian-white"];
      if (!coach) throw new Error("coach missing");
      if (coach.introTitle !== "Italian Game") throw new Error("title " + coach.introTitle);
      if (coach.introAudio !== "/coach/italian-white/professor-potato-pie-italian-intro.wav") {
        throw new Error("audio " + coach.introAudio);
      }
      if (coach.introAudioFallbackSec !== 69.12) throw new Error("length " + coach.introAudioFallbackSec);
      if (coach.firstLineId !== "it1") throw new Error("first line " + coach.firstLineId);
      if (coach.firstLineAudio !== "/coach/italian-white/professor-potato-pie-italian-line1.wav") {
        throw new Error("line audio " + coach.firstLineAudio);
      }
      if (coach.firstLineAudioFallbackSec !== 89.84) throw new Error("line length");
      if (!coachTalkHasAudio("italian-white", "line")) throw new Error("line talk missing audio");
      if (coach.introStemWhiteOnly === true) throw new Error("italian stem plays black replies");
      if (coach.introEndsOnLineList) throw new Error("intro should hand off to Line 1");
      if (!coach.introStem || coach.introStem.join(" ") !== ITALIAN_INTRO_STEM.join(" ")) {
        throw new Error("stem " + coach.introStem);
      }
      if (!coach.introStemAtSec || coach.introStemAtSec.join(",") !== ITALIAN_INTRO_STEM_AT_SEC.join(",")) {
        throw new Error("stem times " + coach.introStemAtSec);
      }
      if (coach.introStem.join(" ") !== "e4 e5 Nf3 Nc6 Bc4") throw new Error("italian stem");
      if (!coach.introArrows || JSON.stringify(coach.introArrows) !== JSON.stringify(ITALIAN_INTRO_ARROWS)) {
        throw new Error("arrows " + JSON.stringify(coach.introArrows));
      }
      for (const id of ["scotch", "opening-traps", "caro-kann-black", "london", "qg-white"]) {
        if (COACH_PACKS[id]?.introArrows) throw new Error(id + " should not arrow the intro");
      }
      if (COACH_PACKS.london?.introStemWhiteOnly !== true) throw new Error("london stays white-only");
      if (COACH_PACKS["qg-white"]?.introStemWhiteOnly === true) throw new Error("qg plays d5");
      if (coach.introBeats.length !== 7) throw new Error("beats " + coach.introBeats.length);
      if (!coach.introBeats[0].startsWith("Right then, Professor Potato Pie here")) throw new Error("open");
      if (!coach.introBeats[2].includes("pawn to e4") || !coach.introBeats[2].includes("bishop to c4")) {
        throw new Error("named moves");
      }
      if (!coach.introBeats[4].includes("Giuoco Piano")) throw new Error("giuoco");
      if (coach.introBeats[6] !== "Right, enjoy getting more familiar with the Italian Game, and let's see where that bishop on c4 takes us.") {
        throw new Error("close");
      }
      if (!coach.introBeatAtSec || coach.introBeatAtSec.join(",") !== "0,12.9,23.2,34.9,41.3,52.4,62.3") {
        throw new Error("beat times " + coach.introBeatAtSec);
      }
      const cues = coach.introStemAtSec;
      if (coachAudioPlyCount(cues, 24.89, 69.12, 69.12) !== 0) throw new Error("e4 not yet");
      if (coachAudioPlyCount(cues, 24.9, 69.12, 69.12) !== 1) throw new Error("e4");
      if (coachAudioPlyCount(cues, 27.59, 69.12, 69.12) !== 1) throw new Error("e5 not yet");
      if (coachAudioPlyCount(cues, 27.6, 69.12, 69.12) !== 2) throw new Error("e5");
      if (coachAudioPlyCount(cues, 29.49, 69.12, 69.12) !== 2) throw new Error("knight to f3 not yet");
      if (coachAudioPlyCount(cues, 29.5, 69.12, 69.12) !== 3) throw new Error("knight to f3");
      if (coachAudioPlyCount(cues, 31.09, 69.12, 69.12) !== 3) throw new Error("c6 not yet");
      if (coachAudioPlyCount(cues, 31.1, 69.12, 69.12) !== 4) throw new Error("c6");
      if (coachAudioPlyCount(cues, 33.19, 69.12, 69.12) !== 4) throw new Error("bishop not yet");
      if (coachAudioPlyCount(cues, 33.2, 69.12, 69.12) !== 5) throw new Error("bishop");
      if (coachAudioPlyCount(cues, 44.2, 69.12, 69.12) !== 5) throw new Error("arrows must not add plies");
      const game = new Chess();
      for (const san of coach.introStem) {
        if (!game.move(san)) throw new Error("stem illegal " + san);
      }
      if (game.history().join(" ") !== "e4 e5 Nf3 Nc6 Bc4") throw new Error("history " + game.history().join(" "));
      if (game.get("e4")?.type !== "p" || game.get("e4")?.color !== "w") throw new Error("e4");
      if (game.get("e5")?.type !== "p" || game.get("e5")?.color !== "b") throw new Error("e5");
      if (game.get("f3")?.type !== "n" || game.get("f3")?.color !== "w") throw new Error("f3");
      if (game.get("c6")?.type !== "n" || game.get("c6")?.color !== "b") throw new Error("c6");
      if (game.get("c4")?.type !== "b" || game.get("c4")?.color !== "w") throw new Error("c4");
      if (game.get("f8")?.type !== "b" || game.get("f8")?.color !== "b") throw new Error("bishop stays");
      if (game.get("g8")?.type !== "n" || game.get("g8")?.color !== "b") throw new Error("knight stays");
      const arrowAt = (t) => coachIntroArrowsAt(coach.introArrows, t, 69.12, 69.12);
      if (arrowAt(43.49).length !== 0) throw new Error("arrow early");
      const bc5 = arrowAt(43.5);
      if (bc5.length !== 1 || bc5[0].from !== "f8" || bc5[0].to !== "c5") throw new Error("bc5 " + JSON.stringify(bc5));
      if (arrowAt(47.89)[0]?.to !== "c5") throw new Error("bc5 should hold");
      const nf6 = arrowAt(47.9);
      if (nf6.length !== 1 || nf6[0].from !== "g8" || nf6[0].to !== "f6") throw new Error("nf6 " + JSON.stringify(nf6));
      if (arrowAt(51.09)[0]?.to !== "f6") throw new Error("nf6 should hold");
      if (arrowAt(51.1).length !== 0) throw new Error("arrow should clear");
      if (game.move("Bc5")?.to !== "c5") throw new Error("bc5 legal from the stem");
      game.undo();
      if (game.move("Nf6")?.to !== "f6") throw new Error("nf6 legal from the stem");
      game.undo();
      if (game.get("f8")?.type !== "b" || game.get("g8")?.type !== "n") throw new Error("options unplayed");
      if (coachTalkPlies("italian-white", "intro") !== null) throw new Error("intro uses the stem clock");
      if (!coachPackIntroApplies("italian-white")) throw new Error("intro gate");
      if (!coachPackLineApplies({ packId: "italian-white", lineId: "it1" })) {
        throw new Error("Line 1 tap should open the talk");
      }
      if (coachPackLineApplies({ packId: "italian-white", lineId: "it2" })) throw new Error("only it1");
      if (coachTalkAfterPackIntro({ packId: "italian-white", lineId: "it1", lineIndex: 0, skipped: false, lineAlreadySeen: false }) !== "line") {
        throw new Error("finishing the intro must open Line 1");
      }
      if (coachTalkAfterPackIntro({ packId: "italian-white", lineId: "it1", lineIndex: 0, skipped: true, lineAlreadySeen: false }) !== "line") {
        throw new Error("skip must open Line 1");
      }
      const it1 = pack.lines.find((item) => item.id === "it1");
      if (!it1) throw new Error("it1 missing");
      const script = coachTalkPlies("italian-white", "line");
      if (!script) throw new Error("line script");
      const played = coachTextPlayedSans(script, script.length);
      const expected = "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O a6 a4 Ba7 Nbd2 O-O h3 Ne7 Re1 Ng6";
      if (played.join(" ") !== expected) throw new Error("script " + played.join(" "));
      if (played.join(" ") !== it1.plies.join(" ")) throw new Error("live it1 " + played.join(" "));
      const lineCues = coachLinePlyCues("italian-white");
      if (!lineCues || lineCues.length !== it1.plies.length) throw new Error("cues " + (lineCues && lineCues.length));
      if (coachAudioPlyCount(lineCues, 14.09, 89.84, 89.84) !== 0) throw new Error("e4 not yet");
      if (coachAudioPlyCount(lineCues, 14.1, 89.84, 89.84) !== 1) throw new Error("e4");
      if (coachAudioPlyCount(lineCues, 31.39, 89.84, 89.84) !== 6) throw new Error("c3 not yet");
      if (coachAudioPlyCount(lineCues, 31.4, 89.84, 89.84) !== 7) throw new Error("c3");
      if (coachAudioPlyCount(lineCues, 57.19, 89.84, 89.84) !== 14) throw new Error("Nbd2 not yet");
      if (coachAudioPlyCount(lineCues, 57.2, 89.84, 89.84) !== 15) throw new Error("Nbd2");
      if (coachAudioPlyCount(lineCues, 73.69, 89.84, 89.84) !== 19) throw new Error("Ng6 not yet");
      if (coachAudioPlyCount(lineCues, 73.7, 89.84, 89.84) !== 20) throw new Error("Ng6");
      const line = new Chess();
      for (const san of played) {
        const move = line.move(san);
        if (!move) throw new Error("illegal " + san);
      }
      if (line.history().join(" ") !== played.join(" ")) throw new Error("history");
      if (line.get("c4")?.type !== "b" || line.get("c4")?.color !== "w") throw new Error("bishop");
      if (line.get("g1")?.type !== "k" || line.get("g8")?.type !== "k") throw new Error("castles");
      if (line.get("e1")?.type !== "r" || line.get("e1")?.color !== "w") throw new Error("rook");
      if (line.get("g6")?.type !== "n" || line.get("g6")?.color !== "b") throw new Error("knight");
      if (coach.firstLineBeats.length !== 20) throw new Error("line beats " + coach.firstLineBeats.length);
      if (!coach.firstLineBeats[0].caption.startsWith("Right then, welcome to Line 1")) throw new Error("line open");
      if (!coach.firstLineBeats[1].caption.startsWith("This is the quieter Italian")) throw new Error("quieter");
      if (coach.firstLineBeats[19].caption !== "Drill the line until the moves feel as natural as putting the kettle on.") {
        throw new Error("line close");
      }
      const lineKey = coachLineSessionKey("italian-white", "it1");
      if (lineKey !== "opening-lab:coach-line:italian-white:it1") throw new Error(lineKey);
      const key = coachIntroSessionKey("italian-white");
      if (key !== "opening-lab:coach-intro:italian-white") throw new Error(key);
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
