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
  const js = ts
    .transpileModule(src("src/lib/coach-packs.ts"), options)
    .outputText.replaceAll("@/lib/scotch-coach", "./scotch-coach.mjs")
    .replaceAll("@/lib/caro-intro-stem", "./caro-intro-stem.mjs")
    .replaceAll("@/lib/london-intro-stem", "./london-intro-stem.mjs");
  writeFileSync(join(dir, "coach-packs.mjs"), js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return "./scripts/.generated-italian-coach/coach-packs.mjs";
}

test("Italian Potato Pie intro plays three White moves and returns to the line list", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  const wav = "public/coach/italian-white/professor-potato-pie-italian-intro.wav";
  assert.equal(existsSync(join(root, wav)), true);
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
  assert.match(hero, /coachIntroEndsOnLineList\(pack\.id\)/);
  assert.match(board, /playWhiteOnlySan/);
  assert.match(board, /data-coach-white-only/);
  assert.doesNotMatch(src("src/lib/coach-packs.ts"), /italian-white[\s\S]{0,900}firstLineAudio:/);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      const { Chess } = await import("chess.js");
      const { PACKS } = await import("./src/data/packs.ts");
      const { replayWhiteOnly } = await import("./src/lib/london-intro-stem.ts");
      const {
        COACH_PACKS,
        ITALIAN_INTRO_STEM,
        ITALIAN_INTRO_STEM_AT_SEC,
        coachAudioPlyCount,
        coachIntroEndsOnLineList,
        coachIntroSessionKey,
        coachLinePlyCues,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
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
      if (coach.firstLineAudio) throw new Error("line audio should be absent");
      if (coach.firstLineBeats.length !== 0) throw new Error("line beats " + coach.firstLineBeats.length);
      if (coachTalkHasAudio("italian-white", "line")) throw new Error("line talk has audio");
      if (coach.introStemWhiteOnly !== true) throw new Error("white only flag");
      if (coach.introEndsOnLineList !== true) throw new Error("intro should stop on the line list");
      if (coachIntroEndsOnLineList("italian-white") !== true) throw new Error("italian list gate");
      if (!coach.introStem || coach.introStem.join(" ") !== ITALIAN_INTRO_STEM.join(" ")) {
        throw new Error("stem " + coach.introStem);
      }
      if (!coach.introStemAtSec || coach.introStemAtSec.join(",") !== ITALIAN_INTRO_STEM_AT_SEC.join(",")) {
        throw new Error("stem times " + coach.introStemAtSec);
      }
      if (coach.introStem.join(" ") !== "e4 Nf3 Bc4") throw new Error("three white moves");
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
      if (coachAudioPlyCount(cues, 29.49, 69.12, 69.12) !== 1) throw new Error("knight to f3 not yet");
      if (coachAudioPlyCount(cues, 29.5, 69.12, 69.12) !== 2) throw new Error("knight to f3");
      if (coachAudioPlyCount(cues, 33.19, 69.12, 69.12) !== 2) throw new Error("bishop not yet");
      if (coachAudioPlyCount(cues, 33.2, 69.12, 69.12) !== 3) throw new Error("bishop");
      const game = replayWhiteOnly(coach.introStem, coach.introStem.length);
      if (game.history().length !== 1) throw new Error("history should be the last white move only");
      const fen = game.fen();
      if (!fen.startsWith("rnbqkbnr/pppppppp/")) throw new Error("black moved " + fen);
      if (game.get("e4")?.type !== "p" || game.get("e4")?.color !== "w") throw new Error("e4");
      if (game.get("f3")?.type !== "n" || game.get("f3")?.color !== "w") throw new Error("f3");
      if (game.get("c4")?.type !== "b" || game.get("c4")?.color !== "w") throw new Error("c4");
      if (game.get("e5")) throw new Error("black e5 should stay home");
      if (game.get("c6")) throw new Error("black c6 should stay home");
      const plain = new Chess();
      for (const san of ["e4", "e5", "Nf3", "Nc6", "Bc4"]) {
        if (!plain.move(san)) throw new Error("spoken order illegal " + san);
      }
      if (coachTalkPlies("italian-white", "intro") !== null) throw new Error("intro uses the stem clock");
      if (!coachPackIntroApplies("italian-white")) throw new Error("intro gate");
      if (coachPackLineApplies({ packId: "italian-white", lineId: "it1" })) {
        throw new Error("Line 1 tap must not open a missing talk");
      }
      if (coachPackLineApplies({ packId: "italian-white", lineId: "it2" })) throw new Error("only a future it1");
      if (coachLinePlyCues("italian-white")) throw new Error("no line cues");
      if (coachTalkAfterPackIntro({ packId: "italian-white", lineId: "it1", lineIndex: 0, skipped: false, lineAlreadySeen: false }) !== null) {
        throw new Error("finishing the intro must not open Line 1");
      }
      if (coachTalkAfterPackIntro({ packId: "italian-white", lineId: "it1", lineIndex: 0, skipped: true, lineAlreadySeen: false }) !== null) {
        throw new Error("skip stays off Line 1");
      }
      const key = coachIntroSessionKey("italian-white");
      if (key !== "opening-lab:coach-intro:italian-white") throw new Error(key);
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
