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

test("Queen's Gambit Potato Pie intro returns to the line list and Line 1 waits for a tap", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  const wav = "public/coach/qg-white/professor-potato-pie-qg-intro.wav";
  assert.equal(existsSync(join(root, wav)), true);
  assert.equal(
    existsSync(join(root, "public/coach/qg-white/professor-potato-pie-qg-line1.wav")),
    true,
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
  assert.match(copy, /firstLineAudio: QG_WHITE_LINE_WAV/);
  assert.match(copy, /firstLineBeats: QG_WHITE_LINE/);
  assert.match(copy, /introEndsOnLineList: true/);
  assert.doesNotMatch(hero, /Play on|vs-computer|playComputer/i);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      const { Chess } = await import("chess.js");
      const { PACKS } = await import("./src/data/packs.ts");
      const { QG_INTRO_STEM, QG_INTRO_STEM_AT_SEC } = await import("./src/lib/qg-intro-stem.ts");
      const { replayWhiteOnly } = await import("./src/lib/london-intro-stem.ts");
      const {
        COACH_PACKS,
        coachAudioPlyCount,
        coachIntroSessionKey,
        coachLinePlyCues,
        coachLineSessionKey,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachIntroEndsOnLineList,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
        coachTextPlayedSans,
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
      if (coach.firstLineAudio !== "/coach/qg-white/professor-potato-pie-qg-line1.wav") {
        throw new Error("line audio " + coach.firstLineAudio);
      }
      if (coach.firstLineAudioFallbackSec !== 101.48) throw new Error("line length " + coach.firstLineAudioFallbackSec);
      if (coach.firstLineBeats.length !== 16) throw new Error("line beats " + coach.firstLineBeats.length);
      if (!coach.firstLineBeats[0].caption.startsWith("Right then, welcome to Line 1")) throw new Error("line open");
      if (coach.firstLineBeats[15].caption !== "Very civilised and quietly ambitious.") throw new Error("line close");
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
      if (!coachPackLineApplies({ packId: "qg-white", lineId: "qg1" })) throw new Error("qg1 tap opens the talk");
      if (coachPackLineApplies({ packId: "qg-white", lineId: "qg2" })) throw new Error("qg2");
      if (coachTalkHasAudio("qg-white", "intro") !== true) throw new Error("intro audio");
      if (coachTalkHasAudio("qg-white", "line") !== true) throw new Error("line audio");
      const qg1 = pack.lines.find((item) => item.id === "qg1");
      if (!qg1) throw new Error("qg1 missing");
      const script = coachTalkPlies("qg-white", "line");
      if (!script) throw new Error("line script");
      const played = coachTextPlayedSans(script, script.length);
      if (played.join(" ") !== qg1.plies.join(" ")) throw new Error("script " + played.join(" "));
      if (played.join(" ") !== "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4 Bxc4 Nd5 Bxe7 Qxe7") {
        throw new Error("live qg1 " + played.join(" "));
      }
      const lineCues = coachLinePlyCues("qg-white");
      if (!lineCues || lineCues.length !== qg1.plies.length) throw new Error("cues " + (lineCues && lineCues.length));
      if (lineCues.join(",") !== "15.9,18.7,20.7,24.8,34.3,35.8,37.7,42.2,44.6,46,48.8,50.3,52.1,56.7,61.1,66.1,68.5,73.6,79.2,82.1") {
        throw new Error("cue times " + lineCues.join(","));
      }
      if (coachAudioPlyCount(lineCues, 15.89, 101.48, 101.48) !== 0) throw new Error("d4 not yet");
      if (coachAudioPlyCount(lineCues, 15.9, 101.48, 101.48) !== 1) throw new Error("d4");
      if (coachAudioPlyCount(lineCues, 66.09, 101.48, 101.48) !== 15) throw new Error("dxc4 not yet");
      if (coachAudioPlyCount(lineCues, 66.1, 101.48, 101.48) !== 16) throw new Error("dxc4");
      if (coachAudioPlyCount(lineCues, 82.09, 101.48, 101.48) !== 19) throw new Error("Qxe7 not yet");
      if (coachAudioPlyCount(lineCues, 82.1, 101.48, 101.48) !== 20) throw new Error("Qxe7");
      const line = new Chess();
      for (const san of played) {
        const move = line.move(san);
        if (!move) throw new Error("illegal " + san);
      }
      if (line.history().join(" ") !== played.join(" ")) throw new Error("history");
      if (line.get("e7")?.type !== "q" || line.get("e7")?.color !== "b") throw new Error("queen e7");
      if (line.get("d5")?.type !== "n" || line.get("d5")?.color !== "b") throw new Error("knight d5");
      if (line.get("g8")?.type !== "k" || line.get("g8")?.color !== "b") throw new Error("black king");
      if (line.get("e1")?.type !== "k" || line.get("e1")?.color !== "w") throw new Error("white king");
      if (line.get("c4")?.type !== "b" || line.get("c4")?.color !== "w") throw new Error("bishop c4");
      if (coachTalkAfterPackIntro({ packId: "qg-white", lineId: "qg1", lineIndex: 0, skipped: false, lineAlreadySeen: false }) !== null) {
        throw new Error("finishing the intro must stay on the line list");
      }
      if (coachTalkAfterPackIntro({ packId: "qg-white", lineId: "qg1", lineIndex: 0, skipped: true, lineAlreadySeen: false }) !== null) {
        throw new Error("skip stays on the intro");
      }
      const key = coachIntroSessionKey("qg-white");
      if (key !== "opening-lab:coach-intro:qg-white") throw new Error(key);
      const lineKey = coachLineSessionKey("qg-white", "qg1");
      if (lineKey !== "opening-lab:coach-line:qg-white:qg1") throw new Error(lineKey);
      if (COACH_PACKS.london?.introEndsOnLineList !== true) throw new Error("london lock");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
