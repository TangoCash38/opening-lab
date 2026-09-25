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
  const dir = join(root, "scripts", ".generated-london-coach");
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
  return "./scripts/.generated-london-coach/coach-packs.mjs";
}

test("London Potato Pie intro plays eight White moves and still shows when the pack is locked", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  const wav = "public/coach/london/professor-potato-pie-london-intro.wav";
  assert.equal(existsSync(join(root, wav)), true);
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const board = src("src/components/opening-lab/scotch-coach-board.tsx");
  const audio = src("src/lib/scotch-coach-audio.ts");
  const catalog = src("src/lib/catalog.ts");
  const packs = src("src/data/packs.ts");
  const lessons = src("src/lib/lesson-products.ts");
  assert.match(catalog, /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white"\]/);
  assert.match(packs, /id: "london"[\s\S]{0,240}price: "£1\.99"/);
  assert.match(lessons, /LESSONS_ENABLED: boolean = false/);
  assert.doesNotMatch(catalog, /"london":\s*\[/);
  assert.match(hero, /pack\.id === "london"/);
  assert.match(hero, /l\.id === "lon1"/);
  assert.match(hero, /Unpaid visitors still hear Potato Pie/);
  assert.match(hero, /if \(!practiceOpen\) return/);
  assert.match(hero, /whiteOnly=\{coachPack\(pack\.id\)\?\.introStemWhiteOnly === true\}/);
  assert.match(hero, /if \(current\.talk === "intro"\) options\.startPly = SCOTCH_CANAL_PRACTICE_START_PLY/);
  assert.match(board, /playWhiteOnlySan/);
  assert.match(board, /replayWhiteOnly/);
  assert.match(board, /data-coach-white-only/);
  assert.match(audio, /audio\/wav/);
  assert.doesNotMatch(hero, /italian-white/);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      const { Chess } = await import("chess.js");
      const { PACKS } = await import("./src/data/packs.ts");
      const { LONDON_INTRO_STEM, LONDON_INTRO_STEM_AT_SEC, replayWhiteOnly } = await import("./src/lib/london-intro-stem.ts");
      const {
        COACH_PACKS,
        coachAudioPlyCount,
        coachIntroSessionKey,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachTalkAfterPackIntro,
        coachTalkPlies,
      } = await import(${JSON.stringify(compiled)});
      const pack = PACKS.find((item) => item.id === "london");
      if (!pack) throw new Error("london pack missing");
      if (pack.price !== "£1.99") throw new Error("price " + pack.price);
      const coach = COACH_PACKS.london;
      if (!coach) throw new Error("coach missing");
      if (coach.introAudio !== "/coach/london/professor-potato-pie-london-intro.wav") {
        throw new Error("audio " + coach.introAudio);
      }
      if (coach.introAudioFallbackSec !== 57.4) throw new Error("length");
      if (coach.lineTalk !== false) throw new Error("london should not open a line talk");
      if (coach.firstLineAudio) throw new Error("no line clip");
      if (coach.introStemWhiteOnly !== true) throw new Error("white only flag");
      if (!coach.introStem || coach.introStem.join(" ") !== LONDON_INTRO_STEM.join(" ")) {
        throw new Error("stem " + coach.introStem);
      }
      if (!coach.introStemAtSec || coach.introStemAtSec.join(",") !== LONDON_INTRO_STEM_AT_SEC.join(",")) {
        throw new Error("stem times " + coach.introStemAtSec);
      }
      const moves = ["d4", "Nf3", "Bf4", "e3", "c3", "Nbd2", "Bd3", "O-O"];
      if (coach.introStem.join(" ") !== moves.join(" ")) throw new Error("eight moves");
      if (coach.introBeats.length !== 7) throw new Error("beats " + coach.introBeats.length);
      if (!coach.introBeats[0].startsWith("Right then, Professor Potato Pie here")) throw new Error("open");
      if (!coach.introBeats[2].includes("pawn to d4, knight to f3 and bishop to f4")) throw new Error("named moves");
      if (!coach.introBeats[3].includes("king side castling")) throw new Error("castling wording");
      if (coach.introBeats[6] !== "Right, enjoy getting more familiar with the London system and let's see how the pieces fit together.") {
        throw new Error("close");
      }
      if (!coach.introBeatAtSec || coach.introBeatAtSec.join(",") !== "0,9.9,21.2,27.4,36.9,44.1,51.4") {
        throw new Error("beat times " + coach.introBeatAtSec);
      }
      const cues = coach.introStemAtSec;
      if (coachAudioPlyCount(cues, 23.19, 57.4, 57.4) !== 0) throw new Error("d4 not yet");
      if (coachAudioPlyCount(cues, 23.2, 57.4, 57.4) !== 1) throw new Error("d4");
      if (coachAudioPlyCount(cues, 32.29, 57.4, 57.4) !== 5) throw new Error("knight to d2 not yet");
      if (coachAudioPlyCount(cues, 32.3, 57.4, 57.4) !== 6) throw new Error("knight to d2");
      if (coachAudioPlyCount(cues, 35.19, 57.4, 57.4) !== 7) throw new Error("castle not yet");
      if (coachAudioPlyCount(cues, 35.2, 57.4, 57.4) !== 8) throw new Error("castle");
      const game = replayWhiteOnly(coach.introStem, coach.introStem.length);
      if (game.history().length !== 1) throw new Error("history should be the last white move only");
      const fen = game.fen();
      if (!fen.startsWith("rnbqkbnr/pppppppp/")) throw new Error("black moved " + fen);
      if (game.get("d4")?.type !== "p") throw new Error("d4");
      if (game.get("f3")?.type !== "n") throw new Error("f3");
      if (game.get("f4")?.type !== "b") throw new Error("f4");
      if (game.get("e3")?.type !== "p") throw new Error("e3");
      if (game.get("c3")?.type !== "p") throw new Error("c3");
      if (game.get("d2")?.type !== "n") throw new Error("d2");
      if (game.get("d3")?.type !== "b") throw new Error("d3");
      if (game.get("g1")?.type !== "k") throw new Error("king");
      if (game.get("f1")?.type !== "r") throw new Error("rook");
      const plain = new Chess();
      let ambiguous = false;
      try {
        plain.move("d4");
        plain.move("a6");
        plain.move("Nf3");
        plain.move("a5");
        plain.move("Bf4");
        plain.move("h6");
        plain.move("e3");
        plain.move("h5");
        plain.move("c3");
        plain.move("a4");
        plain.move("Nd2");
      } catch {
        ambiguous = true;
      }
      if (!ambiguous) throw new Error("Nd2 should be ambiguous once Nf3 is played");
      if (coachTalkPlies("london", "intro") !== null) throw new Error("intro uses the stem clock");
      if (!coachPackIntroApplies("london")) throw new Error("intro gate");
      if (coachPackLineApplies({ packId: "london", lineId: "lon1" })) throw new Error("no line talk");
      if (coachTalkAfterPackIntro({ packId: "london", lineId: "lon1", lineIndex: 0, skipped: false, lineAlreadySeen: false }) !== null) {
        throw new Error("intro should reset to practice");
      }
      const key = coachIntroSessionKey("london");
      if (key !== "opening-lab:coach-intro:london") throw new Error(key);
      if (COACH_PACKS["italian-white"]) throw new Error("italian gained a coach");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
