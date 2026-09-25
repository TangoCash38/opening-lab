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
  const dir = join(root, "scripts", ".generated-qg-coach");
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
  return "./scripts/.generated-qg-coach/coach-packs.mjs";
}

test("Queen's Gambit Potato Pie intro plays two White moves and returns to the line list", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  const wav = "public/coach/qg-white/professor-potato-pie-qg-intro.wav";
  assert.equal(existsSync(join(root, wav)), true);
  assert.equal(
    existsSync(join(root, "public/coach/qg-white/professor-potato-pie-qg-line1.wav")),
    false,
  );
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const board = src("src/components/opening-lab/scotch-coach-board.tsx");
  const audio = src("src/lib/scotch-coach-audio.ts");
  const catalog = src("src/lib/catalog.ts");
  const packs = src("src/data/packs.ts");
  const intro = src("src/lib/pack-intro.ts");
  const copy = src("src/lib/coach-packs.ts");
  assert.match(catalog, /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white"\]/);
  assert.match(packs, /id: "qg-white"[\s\S]{0,240}price: "£1\.99"/);
  assert.doesNotMatch(catalog, /"qg-white":\s*\[/);
  assert.match(hero, /pack\.id === "qg-white"/);
  assert.match(hero, /l\.id === "qg1"/);
  assert.match(hero, /Unpaid visitors still hear Potato Pie/);
  assert.match(hero, /if \(!practiceOpen\) return/);
  assert.match(hero, /whiteOnly=\{coachPack\(pack\.id\)\?\.introStemWhiteOnly === true\}/);
  assert.match(hero, /coachIntroEndsOnLineList\(pack\.id\)/);
  const stop = hero.slice(
    hero.indexOf("coachIntroEndsOnLineList(pack.id)"),
    hero.indexOf("const nextTalk"),
  );
  assert.match(stop, /if \(queued\) launchLine\(queued\)/);
  assert.match(stop, /return;/);
  assert.match(board, /playWhiteOnlySan/);
  assert.match(board, /replayWhiteOnly/);
  assert.match(board, /data-coach-white-only/);
  assert.match(audio, /audio\/wav/);
  assert.match(intro, /"qg-white": \[[\s\S]*10 lines from Opening Lab/);
  assert.doesNotMatch(intro, /5 book|5 punish/);
  assert.doesNotMatch(copy, /human voice|voice actor|recorded by/i);
  assert.doesNotMatch(copy, /firstLineAudio: QG_WHITE|QG_WHITE_LINE/);
  assert.match(copy, /introEndsOnLineList: true/);
  assert.doesNotMatch(hero, /Play on|vs-computer|playComputer/i);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      const { PACKS } = await import("./src/data/packs.ts");
      const { QG_INTRO_STEM, QG_INTRO_STEM_AT_SEC } = await import("./src/lib/qg-intro-stem.ts");
      const { replayWhiteOnly } = await import("./src/lib/london-intro-stem.ts");
      const {
        COACH_PACKS,
        coachAudioPlyCount,
        coachIntroSessionKey,
        coachLinePlyCues,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachIntroEndsOnLineList,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
      } = await import(${JSON.stringify(compiled)});
      const pack = PACKS.find((item) => item.id === "qg-white");
      if (!pack) throw new Error("qg-white pack missing");
      if (pack.price !== "£1.99") throw new Error("price " + pack.price);
      if (pack.lines.length !== 10) throw new Error("lines " + pack.lines.length);
      if (pack.lines[0].id !== "qg1") throw new Error("first id");
      const coach = COACH_PACKS["qg-white"];
      if (!coach) throw new Error("coach missing");
      if (coach.introTitle !== "Queen’s Gambit") throw new Error("title " + coach.introTitle);
      if (coach.introAudio !== "/coach/qg-white/professor-potato-pie-qg-intro.wav") {
        throw new Error("audio " + coach.introAudio);
      }
      if (coach.introAudioFallbackSec !== 61.52) throw new Error("length " + coach.introAudioFallbackSec);
      if (coach.firstLineAudio) throw new Error("line audio should be absent");
      if (coach.firstLineBeats.length !== 0) throw new Error("line beats " + coach.firstLineBeats.length);
      if (coach.firstLineId !== "qg1") throw new Error("first line id " + coach.firstLineId);
      if (coach.introStemWhiteOnly !== true) throw new Error("white only flag");
      if (coach.introEndsOnLineList !== true) throw new Error("intro should stop on the line list");
      if (coachIntroEndsOnLineList("qg-white") !== true) throw new Error("qg list gate");
      if (coachIntroEndsOnLineList("caro-kann-black") || coachIntroEndsOnLineList("opening-traps") || coachIntroEndsOnLineList("scotch")) {
        throw new Error("other packs must still chain");
      }
      if (!coach.introStem || coach.introStem.join(" ") !== QG_INTRO_STEM.join(" ")) {
        throw new Error("stem " + coach.introStem);
      }
      if (!coach.introStemAtSec || coach.introStemAtSec.join(",") !== QG_INTRO_STEM_AT_SEC.join(",")) {
        throw new Error("stem times " + coach.introStemAtSec);
      }
      if (coach.introStem.join(" ") !== "d4 c4") throw new Error("two white moves");
      if (coach.introBeats.length !== 8) throw new Error("beats " + coach.introBeats.length);
      if (!coach.introBeats[0].startsWith("Right then, Professor Potato Pie here")) throw new Error("open");
      if (!coach.introBeats[0].includes("tea properly brewed")) throw new Error("tea");
      if (!coach.introBeats[0].includes("the Queen's Gambit")) throw new Error("name");
      if (!coach.introBeats[1].includes("late fifteenth century")) throw new Error("century");
      if (!coach.introBeats[2].includes("pawn to d4, and black answers pawn to d5")) throw new Error("d4 d5");
      if (!coach.introBeats[3].includes("pawn to c4")) throw new Error("c4");
      if (!coach.introBeats[3].includes("offering the c-pawn")) throw new Error("offer");
      if (!coach.introBeats[5].includes("strategic invitation")) throw new Error("invitation");
      if (coach.introBeats[7] !== "Right, enjoy getting more familiar with the Queen's Gambit and let's see what that adventurous little c-pawn can persuade black to do.") {
        throw new Error("close");
      }
      if (!coach.introBeatAtSec || coach.introBeatAtSec.join(",") !== "0,11.8,21.2,26.2,33,38.2,47.3,53.3") {
        throw new Error("beat times " + coach.introBeatAtSec);
      }
      const cues = coach.introStemAtSec;
      if (coachAudioPlyCount(cues, 22.59, 61.52, 61.52) !== 0) throw new Error("d4 not yet");
      if (coachAudioPlyCount(cues, 22.6, 61.52, 61.52) !== 1) throw new Error("d4");
      if (coachAudioPlyCount(cues, 27.69, 61.52, 61.52) !== 1) throw new Error("c4 not yet");
      if (coachAudioPlyCount(cues, 27.7, 61.52, 61.52) !== 2) throw new Error("c4");
      const game = replayWhiteOnly(coach.introStem, coach.introStem.length);
      if (game.history().length !== 1) throw new Error("history should be the last white move only");
      const fen = game.fen();
      if (!fen.startsWith("rnbqkbnr/pppppppp/8/8/2PP")) throw new Error("shell " + fen);
      if (game.get("d4")?.type !== "p" || game.get("d4")?.color !== "w") throw new Error("d4");
      if (game.get("c4")?.type !== "p" || game.get("c4")?.color !== "w") throw new Error("c4");
      if (game.get("d5")) throw new Error("black d5 moved");
      if (game.get("d7")?.type !== "p" || game.get("d7")?.color !== "b") throw new Error("d7 home");
      if (game.get("d2")) throw new Error("d2 still occupied");
      if (game.get("c2")) throw new Error("c2 still occupied");
      if (coachTalkPlies("qg-white", "intro") !== null) throw new Error("intro uses the stem clock");
      if (!coachPackIntroApplies("qg-white")) throw new Error("intro gate");
      if (coachPackLineApplies({ packId: "qg-white", lineId: "qg1" })) throw new Error("qg1 must not open a missing talk");
      if (coachPackLineApplies({ packId: "qg-white", lineId: "qg2" })) throw new Error("qg2");
      if (coachTalkHasAudio("qg-white", "intro") !== true) throw new Error("intro audio");
      if (coachTalkHasAudio("qg-white", "line")) throw new Error("no line audio");
      if (coachLinePlyCues("qg-white") != null) throw new Error("no line cues");
      if (coachTalkAfterPackIntro({ packId: "qg-white", lineId: "qg1", lineIndex: 0, skipped: false, lineAlreadySeen: false }) !== null) {
        throw new Error("finishing the intro must stay on the line list");
      }
      if (coachTalkAfterPackIntro({ packId: "qg-white", lineId: "qg1", lineIndex: 0, skipped: true, lineAlreadySeen: false }) !== null) {
        throw new Error("skip stays on the intro");
      }
      const key = coachIntroSessionKey("qg-white");
      if (key !== "opening-lab:coach-intro:qg-white") throw new Error(key);
      if (COACH_PACKS.london?.introEndsOnLineList !== true) throw new Error("london lock");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
