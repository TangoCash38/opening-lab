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
  const dir = join(root, "scripts", ".generated-french-coach");
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
  return "./scripts/.generated-french-coach/coach-packs.mjs";
}

test("French Defence Potato Pie intro is audio-only and does not open Line 1 speech", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  const wav = "public/coach/french-black/professor-potato-pie-french-intro.wav";
  assert.equal(existsSync(join(root, wav)), true);
  assert.equal(
    existsSync(join(root, "public/coach/french-black/professor-potato-pie-french-line1.wav")),
    false,
  );
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const board = src("src/components/opening-lab/scotch-coach-board.tsx");
  const catalog = src("src/lib/catalog.ts");
  const packs = src("src/data/packs.ts");
  const intro = src("src/lib/pack-intro.ts");
  const skus = src("src/lib/play-skus.ts");
  assert.match(
    catalog,
    /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black"\]/,
  );
  assert.doesNotMatch(catalog, /"french-black":\s*\[/);
  assert.match(packs, /id: "french-black"[\s\S]{0,400}blurb: "10 lines from Opening Lab"/);
  assert.doesNotMatch(packs.slice(packs.indexOf('id: "french-black"'), packs.indexOf('id: "french-black"') + 1200), /5 book/);
  assert.doesNotMatch(packs.slice(packs.indexOf('id: "french-black"'), packs.indexOf('id: "french-black"') + 1200), /punish/i);
  const opening = intro.slice(intro.indexOf('"french-black"'), intro.indexOf("};"));
  assert.match(opening, /10 lines from Opening Lab\. Practice with the green hint, then Test with none\./);
  const playList = skus.slice(skus.indexOf("PLAY_PATH_B_PACK_IDS"), skus.indexOf("export type PlayProduct"));
  assert.equal(playList.includes('"french-black"'), false);
  assert.match(hero, /pack\.id === "french-black"/);
  assert.match(hero, /l\.id === "frb1"/);
  assert.match(hero, /Unpaid visitors still hear Potato Pie/);
  assert.match(hero, /flip=\{pack\.side === "Black"\}/);
  assert.match(hero, /introArrows=\{coachPack\(pack\.id\)\?\.introArrows\}/);
  assert.match(hero, /CoachPackReading packId=\{pack\.id\}/);
  assert.match(board, /from: cue\.from as Square/);
  assert.doesNotMatch(src("src/lib/coach-packs.ts"), /firstLineAudio: FRENCH/);

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
        FRENCH_INTRO_ARROWS,
        FRENCH_INTRO_SEC,
        FRENCH_INTRO_STEM,
        FRENCH_INTRO_STEM_AT_SEC,
        FRENCH_INTRO_WAV,
        coachAudioBeatIndex,
        coachAudioPlyCount,
        coachIntroArrowsAt,
        coachIntroSessionKey,
        coachLinePlyCues,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
      } = await import(${JSON.stringify(compiled)});
      const pack = PACKS.find((item) => item.id === "french-black");
      if (!pack) throw new Error("french pack missing");
      if (pack.side !== "Black") throw new Error("side " + pack.side);
      if (pack.blurb !== "10 lines from Opening Lab") throw new Error("blurb " + pack.blurb);
      if (pack.lines.length !== 10) throw new Error("lines " + pack.lines.length);
      const frb1 = pack.lines.find((item) => item.id === "frb1");
      if (!frb1 || frb1.side !== "b") throw new Error("frb1");
      if (frb1.plies.slice(0, 4).join(" ") !== "e4 e6 d4 d5") throw new Error("frb1 stem changed");
      const coach = COACH_PACKS["french-black"];
      if (!coach) throw new Error("coach missing");
      if (coach.introTitle !== "French Defence") throw new Error("title " + coach.introTitle);
      if (coach.introAudio !== FRENCH_INTRO_WAV) throw new Error("audio " + coach.introAudio);
      if (coach.introAudio !== "/coach/french-black/professor-potato-pie-french-intro.wav") {
        throw new Error("public path");
      }
      if (coach.introAudioFallbackSec !== FRENCH_INTRO_SEC || FRENCH_INTRO_SEC !== 75.52) {
        throw new Error("length " + coach.introAudioFallbackSec);
      }
      if (coach.firstLineId !== "frb1") throw new Error("first line " + coach.firstLineId);
      if (coach.firstLineTitle !== "Line 1") throw new Error("line title");
      if (coach.firstLineBeats.length !== 0) throw new Error("line beats must stay empty");
      if (coach.firstLineAudio) throw new Error("intro-only: no line audio");
      if (coachLinePlyCues("french-black") != null) throw new Error("no line cues");
      if (coachTalkHasAudio("french-black", "line")) throw new Error("line talk must stay silent");
      if (!coachTalkHasAudio("french-black", "intro")) throw new Error("intro audio");
      if (coach.introStemWhiteOnly === true) throw new Error("french stem plays black replies");
      if (!coach.introStem || coach.introStem.join(" ") !== FRENCH_INTRO_STEM.join(" ")) {
        throw new Error("stem " + coach.introStem);
      }
      if (coach.introStem.join(" ") !== "e4 e6 d4 d5") throw new Error("french stem");
      if (!coach.introStemAtSec || coach.introStemAtSec.join(",") !== FRENCH_INTRO_STEM_AT_SEC.join(",")) {
        throw new Error("stem times " + coach.introStemAtSec);
      }
      if (coach.introStemAtSec.join(",") !== "13.34,15.56,19.4,22.56") throw new Error("stem clock");
      if (!coach.introArrows || JSON.stringify(coach.introArrows) !== JSON.stringify(FRENCH_INTRO_ARROWS)) {
        throw new Error("arrows " + JSON.stringify(coach.introArrows));
      }
      if (coach.introBeats.length !== 10) throw new Error("beats " + coach.introBeats.length);
      if (!coach.introBeats[0].includes("set you at the ready")) throw new Error("tea line");
      if (coach.introBeats[0].includes("see you at the ready")) throw new Error("whisper leftover");
      if (!coach.introBeats[1].includes("e4") || !coach.introBeats[1].includes("e6")) throw new Error("e-pawns");
      if (!coach.introBeats[5].includes("c5") || !coach.introBeats[5].includes("f6")) throw new Error("breaks");
      if (!coach.introBeatAtSec || coach.introBeatAtSec.join(",") !== "0,12.1,17.64,24.72,34.56,38.28,50.98,58.6,62.62,68.52") {
        throw new Error("beat times " + coach.introBeatAtSec);
      }
      const beats = coach.introBeatAtSec;
      const dur = 75.52;
      if (coachAudioBeatIndex(beats, 12.09, dur, 10, dur) !== 0) throw new Error("beat 1 holds");
      if (coachAudioBeatIndex(beats, 12.1, dur, 10, dur) !== 1) throw new Error("e4 caption");
      if (coachAudioBeatIndex(beats, 17.64, dur, 10, dur) !== 2) throw new Error("d4 caption");
      if (coachAudioBeatIndex(beats, 46.4, dur, 10, dur) !== 5) throw new Error("breaks caption");
      if (coachAudioBeatIndex(beats, 68.52, dur, 10, dur) !== 9) throw new Error("close");
      const cues = coach.introStemAtSec;
      if (coachAudioPlyCount(cues, 13.33, dur, dur) !== 0) throw new Error("e4 not yet");
      if (coachAudioPlyCount(cues, 13.34, dur, dur) !== 1) throw new Error("e4");
      if (coachAudioPlyCount(cues, 15.55, dur, dur) !== 1) throw new Error("e6 not yet");
      if (coachAudioPlyCount(cues, 15.56, dur, dur) !== 2) throw new Error("e6");
      if (coachAudioPlyCount(cues, 19.39, dur, dur) !== 2) throw new Error("d4 not yet");
      if (coachAudioPlyCount(cues, 19.4, dur, dur) !== 3) throw new Error("d4");
      if (coachAudioPlyCount(cues, 22.55, dur, dur) !== 3) throw new Error("d5 not yet");
      if (coachAudioPlyCount(cues, 22.56, dur, dur) !== 4) throw new Error("d5");
      if (coachAudioPlyCount(cues, 47, dur, dur) !== 4) throw new Error("arrows must not add plies");
      const game = new Chess();
      for (const san of coach.introStem) {
        if (!game.move(san)) throw new Error("stem illegal " + san);
      }
      if (game.history().join(" ") !== "e4 e6 d4 d5") throw new Error("history");
      if (game.get("e4")?.color !== "w" || game.get("e6")?.color !== "b") throw new Error("e-pawns");
      if (game.get("d4")?.color !== "w" || game.get("d5")?.color !== "b") throw new Error("d-pawns");
      if (game.get("c7")?.type !== "p" || game.get("c7")?.color !== "b") throw new Error("c7 stays");
      if (game.get("f7")?.type !== "p" || game.get("f7")?.color !== "b") throw new Error("f7 stays");
      if (game.turn() !== "w") throw new Error("stem ends on White's turn");
      if (!game.move("Nf3")) throw new Error("hand the move to Black");
      const blackMoves = game.moves({ verbose: true });
      if (!blackMoves.some((move) => move.from === "c7" && move.to === "c5")) {
        throw new Error("c7-c5 is Black's c-pawn break");
      }
      if (!blackMoves.some((move) => move.from === "f7" && move.to === "f6")) {
        throw new Error("f7-f6 is Black's f-pawn break");
      }
      game.undo();
      if (game.get("c7")?.type !== "p" || game.get("f7")?.type !== "p") throw new Error("breaks stay unplayed");
      const arrowAt = (time) => coachIntroArrowsAt(coach.introArrows, time, dur, dur);
      if (arrowAt(46.33).length !== 0) throw new Error("arrow early");
      const c5 = arrowAt(46.34);
      if (c5.length !== 1 || c5[0].from !== "c7" || c5[0].to !== "c5") throw new Error("c5 " + JSON.stringify(c5));
      if (arrowAt(48.09)[0]?.to !== "c5") throw new Error("c5 should hold");
      if (arrowAt(48.1).length !== 0) throw new Error("c5 should clear");
      const f6 = arrowAt(49.62);
      if (f6.length !== 1 || f6[0].from !== "f7" || f6[0].to !== "f6") throw new Error("f6 " + JSON.stringify(f6));
      if (arrowAt(50.99)[0]?.to !== "f6") throw new Error("f6 should hold");
      if (arrowAt(51).length !== 0) throw new Error("f6 should clear");
      if (coachTalkPlies("french-black", "intro") !== null) throw new Error("intro uses the stem clock");
      if (!coachPackIntroApplies("french-black")) throw new Error("intro gate");
      if (coachPackLineApplies({ packId: "french-black", lineId: "frb1" })) {
        throw new Error("intro-only must not open Line 1 speech");
      }
      if (coachPackLineApplies({ packId: "french-black", lineId: "frb2" })) throw new Error("frb2");
      const handoff = { packId: "french-black", lineId: "frb1", lineIndex: 0, lineAlreadySeen: false };
      if (coachTalkAfterPackIntro({ ...handoff, skipped: false }) !== null) {
        throw new Error("finishing the intro must not open Line 1");
      }
      if (coachTalkAfterPackIntro({ ...handoff, skipped: true }) !== null) {
        throw new Error("skip must not open Line 1");
      }
      const key = coachIntroSessionKey("french-black");
      if (key !== "opening-lab:coach-intro:french-black") throw new Error(key);
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
