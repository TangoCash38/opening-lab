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
  const dir = join(root, "scripts", ".generated-coach-packs");
  mkdirSync(dir, { recursive: true });
  const options = {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  };
  const scotchJs = ts.transpileModule(src("src/lib/scotch-coach.ts"), options).outputText;
  writeFileSync(join(dir, "scotch-coach.mjs"), scotchJs);
  const stemJs = ts.transpileModule(src("src/lib/caro-intro-stem.ts"), options).outputText;
  writeFileSync(join(dir, "caro-intro-stem.mjs"), stemJs);
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
  return "./scripts/.generated-coach-packs/coach-packs.mjs";
}

const packs = src("src/lib/coach-packs.ts");
const hero = src("src/components/opening-lab/home-hero.tsx");
const intro = src("src/components/opening-lab/scotch-coach-intro.tsx");
const board = src("src/components/opening-lab/scotch-coach-board.tsx");
const catalog = src("src/lib/catalog.ts");
const audio = src("src/lib/scotch-coach-audio.ts");

test("coach config is keyed by pack id and keeps the Scotch recordings", () => {
  assert.match(packs, /COACH_PACKS/);
  assert.match(packs, /introBeats/);
  assert.match(packs, /firstLineId/);
  assert.match(packs, /firstLineBeats/);
  assert.match(packs, /introAudio/);
  assert.match(packs, /firstLineAudio/);
  assert.match(packs, /SCOTCH_COACH_NARRATION_MP3/);
  assert.match(packs, /SCOTCH_CANAL_NARRATION_MP3/);
  assert.match(packs, /firstLineId: SCOTCH_CANAL_LINE_ID/);
  assert.match(packs, /firstLinePlaysPackLine: true/);
  assert.match(catalog, /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white"\]/);
  assert.doesNotMatch(packs, /Play on|vs-computer|playComputer/i);
});

test("opening traps mounts on ot1 by line id, with narration clips and per-pack session keys", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  assert.match(packs, /firstLineId: "ot1"/);
  assert.match(packs, /Legal's Mate/);
  assert.match(packs, /Monsieur de Légal/);
  assert.match(packs, /ply: "Nd5#"/);
  assert.match(packs, /professor-potato-pie-traps-intro\.mp3/);
  assert.match(packs, /professor-potato-pie-traps-legals-mate\.mp3/);
  assert.match(hero, /startCoachPackNarration/);
  assert.match(board, /coachAudioPlyCount/);
  assert.match(board, /plyAtSec/);
  assert.equal(
    existsSync(join(root, "public/coach/opening-traps/professor-potato-pie-traps-intro.mp3")),
    true,
  );
  assert.equal(
    existsSync(join(root, "public/coach/opening-traps/professor-potato-pie-traps-legals-mate.mp3")),
    true,
  );
  assert.match(packs, /COACH_TEXT_BEAT_SEC = 5/);
  assert.match(packs, /opening-lab:coach-intro:\$\{packId\}/);
  assert.match(packs, /opening-lab:coach-line:\$\{packId\}:\$\{lineId\}/);
  assert.match(packs, /if \(packId === SCOTCH_PACK_ID\) return SCOTCH_COACH_SESSION_KEY/);
  assert.match(packs, /return SCOTCH_CANAL_SESSION_KEY/);
  assert.match(packs, /input\.lineId === pack\.firstLineId/);
  assert.doesNotMatch(packs, /line\.name|lineName|input\.title/);
  assert.match(hero, /coachPackLineApplies\(\{ packId: pack\.id, lineId: line\.id \}\)/);
  assert.match(hero, /coachPackIntroApplies\(pack\.id\)/);
  assert.match(hero, /talk: "line"/);
  assert.match(hero, /current\.talk === "line"\) options\.startPly = SCOTCH_CANAL_PRACTICE_START_PLY/);
  assert.doesNotMatch(hero, /line\.name/);

  const textOnly = intro.slice(
    intro.indexOf("function TextOnlyCoachCard"),
    intro.indexOf("function AudioPackCoachCard"),
  );
  assert.match(textOnly, /COACH_TEXT_BEAT_SEC/);
  assert.match(textOnly, /textOnly/);
  assert.doesNotMatch(textOnly, /data-scotch-coach-mute|startCoachPackNarration|startScotch/);
  const audioCard = intro.slice(
    intro.indexOf("function AudioPackCoachCard"),
    intro.indexOf("function PackCoachCard"),
  );
  assert.match(audioCard, /startCoachPackNarration/);
  assert.match(audioCard, /coachAudioBeatIndex/);
  assert.match(audioCard, /data-scotch-coach-mute|onMute/);
  assert.match(intro, /data-coach-text-only=\{textOnly \? "true" : undefined\}/);
  assert.match(intro, /if \(!audio\)/);
  assert.match(audio, /export function startCoachPackNarration/);
  assert.match(board, /coachTextPlyCount/);
  assert.match(board, /beatPlies/);
  assert.doesNotMatch(`${intro}\n${board}\n${hero}`, /Play on|vs-computer|playComputer/i);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      function memory() {
        const data = new Map();
        return {
          getItem: (key) => (data.has(key) ? data.get(key) : null),
          setItem: (key, value) => data.set(key, String(value)),
          removeItem: (key) => data.delete(key),
        };
      }
      globalThis.localStorage = memory();
      globalThis.sessionStorage = memory();
      const { Chess } = await import("chess.js");
      const { PACKS } = await import("./src/data/packs.ts");
      const {
        COACH_PACKS,
        COACH_TEXT_BEAT_SEC,
        coachAudioBeatIndex,
        coachIntroAlreadySeen,
        coachIntroSessionKey,
        coachLineAlreadySeen,
        coachLineSessionKey,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachAudioPlyCount,
        coachLinePlyCues,
        coachTalkPlies,
        coachTextPlayedSans,
        coachTextPlyCount,
        isCoachTextOnly,
        lineBeatAtSec,
        markCoachIntroSeen,
        markCoachLineSeen,
      } = await import(${JSON.stringify(compiled)});
      const {
        SCOTCH_CANAL_SESSION_KEY,
        SCOTCH_COACH_SESSION_KEY,
        scotchCanalCoachAlreadySeen,
        scotchCoachAlreadySeen,
      } = await import("./src/lib/scotch-coach.ts");

      if (COACH_TEXT_BEAT_SEC < 4 || COACH_TEXT_BEAT_SEC > 6) {
        throw new Error("text beat dwell " + COACH_TEXT_BEAT_SEC);
      }
      const scotch = COACH_PACKS.scotch;
      const traps = COACH_PACKS["opening-traps"];
      if (!scotch || !traps) throw new Error("missing coach packs");
      if (!scotch.introAudio || !scotch.firstLineAudio) throw new Error("scotch audio");
      if (scotch.introAudioOgg == null) throw new Error("scotch ogg");
      if (scotch.firstLineId !== "sg1") throw new Error("scotch line");
      if (scotch.firstLinePlaysPackLine !== true) throw new Error("scotch plays the pack line");
      if (isCoachTextOnly("scotch", "intro") || isCoachTextOnly("scotch", "line")) {
        throw new Error("scotch is not text-only");
      }
      if (isCoachTextOnly("opening-traps", "intro") || isCoachTextOnly("opening-traps", "line")) {
        throw new Error("traps clips are missing");
      }
      if (traps.introAudio !== "/coach/opening-traps/professor-potato-pie-traps-intro.mp3") {
        throw new Error("traps intro audio " + traps.introAudio);
      }
      if (traps.firstLineAudio !== "/coach/opening-traps/professor-potato-pie-traps-legals-mate.mp3") {
        throw new Error("traps line audio " + traps.firstLineAudio);
      }
      if (traps.introAudioFallbackSec !== 46.4) throw new Error("intro length");
      if (traps.firstLineAudioFallbackSec !== 92.7) throw new Error("line length");
      if (traps.firstLineId !== "ot1") throw new Error("traps line id");
      if (traps.introBeats.length !== 5) throw new Error("intro beats " + traps.introBeats.length);
      if (traps.introBeats[0] !== "Right then, now for the opening traps. These lines are great fun, and on occasion they can catch an unsuspecting opponent completely off guard. That alone makes them worth knowing.") {
        throw new Error("intro 1");
      }
      if (traps.introBeats[4] !== "Have a go, have some fun, and now I think it's time for a potato pie. Enjoy.") {
        throw new Error("intro 5");
      }
      const introAt = traps.introBeatAtSec;
      if (!introAt || introAt.join(",") !== "0,13.6,22.5,29.5,38.2") throw new Error("intro times " + introAt);
      if (traps.firstLineBeats.length !== 17) throw new Error("line beats " + traps.firstLineBeats.length);
      if (traps.introBeats[0].includes("[")) throw new Error("bracket leaked into intro");
      const lineAt = lineBeatAtSec(traps.firstLineBeats);
      if (!lineAt || lineAt.join(",") !== "0,10.4,14,17.3,20.5,25.4,31,35.6,39.6,45.3,53.4,60.4,63.5,67.2,70.6,81.1,88.6") {
        throw new Error("line beat times " + lineAt);
      }
      const cues = coachLinePlyCues("opening-traps");
      if (!cues || cues.join(",") !== "12.7,15.7,18,21.7,26.9,32.2,38.1,40.3,46.2,56.1,61.2,65.7,67.8") {
        throw new Error("spoken moves " + cues);
      }
      if (coachLinePlyCues("scotch") != null) throw new Error("scotch line uses the pack clock");
      if (coachAudioPlyCount(cues, 12.69, 92.7, 92.7) !== 0) throw new Error("e4 not yet");
      if (coachAudioPlyCount(cues, 12.7, 92.7, 92.7) !== 1) throw new Error("e4 spoken");
      if (coachAudioPlyCount(cues, 15.7, 92.7, 92.7) !== 2) throw new Error("e5 spoken");
      if (coachAudioPlyCount(cues, 67.79, 92.7, 92.7) !== 12) throw new Error("mate not yet");
      if (coachAudioPlyCount(cues, 67.8, 92.7, 92.7) !== 13) throw new Error("mate spoken");
      if (coachAudioPlyCount(cues, 0, 0, 92.7) !== 0) throw new Error("clip start");
      if (lineBeatAtSec(scotch.firstLineBeats)?.length !== scotch.firstLineBeats.length) {
        throw new Error("scotch beat timings");
      }

      const pack = PACKS.find((item) => item.id === "opening-traps");
      const ot1 = pack?.lines.find((line) => line.id === "ot1");
      const ot2 = pack?.lines.find((line) => line.id === "ot2");
      if (!ot1 || ot1.name !== "Trap · Legal’s Mate") throw new Error("ot1 title changed");
      if (!ot2) throw new Error("ot2 missing");
      const played = coachTextPlayedSans(
        traps.firstLineBeats.map((beat) => beat.ply),
        traps.firstLineBeats.length - 1,
      );
      if (played.join(" ") !== ot1.plies.join(" ")) {
        throw new Error("script plies\\n" + played.join(" ") + "\\npack\\n" + ot1.plies.join(" "));
      }
      const game = new Chess();
      for (const san of played) {
        if (!game.move(san)) throw new Error("illegal " + san);
      }
      if (!game.isCheckmate()) throw new Error("Legal's Mate did not end in mate");
      if (coachTextPlyCount(traps.firstLineBeats.map((beat) => beat.ply), 0) !== 0) {
        throw new Error("welcome beat plays a move");
      }
      if (coachTextPlyCount(traps.firstLineBeats.map((beat) => beat.ply), 1) !== 1) {
        throw new Error("e4 beat");
      }
      const plies = traps.firstLineBeats.map((beat) => beat.ply);
      let moves = 0;
      for (let beat = 0; beat < plies.length; beat += 1) {
        if (plies[beat]) moves += 1;
        const got = coachTextPlyCount(plies, beat);
        if (got !== moves) throw new Error("beat " + beat + " -> " + got);
        const prefix = coachTextPlayedSans(plies, beat);
        if (prefix.length !== moves) throw new Error("prefix " + beat);
        if (prefix.some((san, index) => san !== played[index])) throw new Error("order " + beat);
      }
      if (coachTextPlyCount(plies, -1) !== 0) throw new Error("negative beat");
      const introPlies = coachTalkPlies("opening-traps", "intro");
      if (!introPlies || introPlies.some(Boolean)) throw new Error("intro should hold the start position");
      const linePlies = coachTalkPlies("opening-traps", "line");
      if (!linePlies || coachTextPlayedSans(linePlies, 99).join(" ") !== played.join(" ")) {
        throw new Error("line script");
      }
      if (coachTalkPlies("opening-traps", "line") !== linePlies) throw new Error("script not stable");
      if (coachTalkPlies("scotch", "intro") !== null) throw new Error("scotch intro uses the stem clock");
      if (coachTalkPlies("scotch", "canal") !== null) throw new Error("canal uses the clip clock");
      if (coachTalkPlies("scotch", "line") !== null) throw new Error("scotch line uses the clip clock");

      if (coachPackIntroApplies("scotch")) throw new Error("scotch intro uses its own gate");
      if (!coachPackIntroApplies("opening-traps")) throw new Error("traps intro");
      if (coachPackIntroApplies("qgd-black")) throw new Error("uncoached pack");
      const line = { packId: "opening-traps", lineId: "ot1" };
      if (!coachPackLineApplies(line)) throw new Error("ot1 should mount");
      if (coachPackLineApplies({ ...line, lineId: "ot2" })) throw new Error("ot2 must not mount");
      if (coachPackLineApplies({ packId: "opening-traps", lineId: ot1.name })) {
        throw new Error("title must not mount the talk");
      }
      if (coachPackLineApplies({ packId: "scotch", lineId: "sg1" })) {
        throw new Error("sg1 stays on the canal gate");
      }
      if (coachPackLineApplies({ packId: "italian-white", lineId: "ot1" })) {
        throw new Error("other pack");
      }

      if (coachIntroSessionKey("scotch") !== SCOTCH_COACH_SESSION_KEY) throw new Error("scotch intro key");
      if (coachLineSessionKey("scotch", "sg1") !== SCOTCH_CANAL_SESSION_KEY) throw new Error("scotch line key");
      const trapsIntroKey = coachIntroSessionKey("opening-traps");
      const trapsLineKey = coachLineSessionKey("opening-traps", "ot1");
      if (trapsIntroKey === SCOTCH_COACH_SESSION_KEY || trapsLineKey === SCOTCH_CANAL_SESSION_KEY) {
        throw new Error("traps reused a scotch key");
      }
      if (trapsIntroKey === trapsLineKey) throw new Error("intro and line share a key");
      if (!trapsIntroKey.includes("opening-traps") || !trapsLineKey.includes("opening-traps")) {
        throw new Error("keys are not per pack");
      }
      if (!trapsLineKey.includes("ot1")) throw new Error("line key omits ot1");
      markCoachIntroSeen("opening-traps");
      if (!coachIntroAlreadySeen("opening-traps")) throw new Error("traps intro not marked");
      if (coachLineAlreadySeen("opening-traps", "ot1")) throw new Error("intro marked the line");
      if (scotchCoachAlreadySeen() || scotchCanalCoachAlreadySeen()) throw new Error("traps marked scotch");
      markCoachLineSeen("opening-traps", "ot1");
      if (!coachLineAlreadySeen("opening-traps", "ot1")) throw new Error("ot1 not marked");
      if (coachLineAlreadySeen("opening-traps", "ot2")) throw new Error("ot2 marked");
      sessionStorage.removeItem(trapsLineKey);
      if (coachLineAlreadySeen("opening-traps", "ot1")) throw new Error("new visit still seen");
      if (!coachIntroAlreadySeen("opening-traps")) throw new Error("intro should survive the line reset");

      const indexed = coachAudioBeatIndex([0, 4, 9], 4, 12, 3, 12);
      if (indexed !== 1) throw new Error("audio beat " + indexed);
      const quarters = coachAudioBeatIndex(undefined, 6, 12, 4, 12);
      if (quarters !== 2) throw new Error("quarter beat " + quarters);
      if (coachAudioBeatIndex([0, 7.92], 0, 0, 2, 95) !== 0) throw new Error("audio start");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("finishing the pack intro opens the first-line talk; Skip and the gym pages do not", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  const modal = src("src/components/opening-lab/pack-about-modal.tsx");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const card = src("src/components/opening-lab/scotch-coach-intro.tsx");
  assert.doesNotMatch(modal, /markScotchCoachSeen|markCoachIntroSeen|markCoachLineSeen|coach-intro|scotch-coach-session/);
  assert.match(card, /onSkip=\{\(\) => leave\("skip"\)\}/);
  assert.match(card, /if \(last\) leave\(\)/);
  assert.match(card, /function useOnceCoachLeave/);
  assert.match(card, /if \(left\) return/);
  assert.doesNotMatch(card, /onSkip=\{leave\}/);
  const finish = hero.slice(hero.indexOf("const finishCoach"), hero.indexOf("const activeLineId"));
  assert.match(finish, /coachTalkAfterPackIntro/);
  assert.match(finish, /launchLine\(\s*current\.line,/);
  assert.match(hero, /else startAdvance\(\)/);
  assert.match(hero, /if \(line\) launchLine\(line\)/);
  assert.match(hero, /else launchLine\(item\)/);
  assert.equal(hero.split("launchLine(line, undefined, true)").length - 1, 1);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      const { coachTalkAfterPackIntro } = await import(${JSON.stringify(compiled)});
      const cases = [
        [{ packId: "scotch", lineId: "sg1", lineIndex: 0, skipped: false, lineAlreadySeen: false }, "canal"],
        [{ packId: "scotch", lineId: "sg1", lineIndex: 0, skipped: true, lineAlreadySeen: false }, null],
        [{ packId: "scotch", lineId: "sg1", lineIndex: 0, skipped: false, lineAlreadySeen: true }, null],
        [{ packId: "scotch", lineId: "sg2", lineIndex: 1, skipped: false, lineAlreadySeen: false }, null],
        [{ packId: "opening-traps", lineId: "ot1", lineIndex: 0, skipped: false, lineAlreadySeen: false }, "line"],
        [{ packId: "opening-traps", lineId: "ot1", lineIndex: 0, skipped: true, lineAlreadySeen: false }, null],
        [{ packId: "opening-traps", lineId: "ot2", lineIndex: 1, skipped: false, lineAlreadySeen: false }, null],
        [{ packId: "caro-kann-black", lineId: "ckb1", lineIndex: 0, skipped: false, lineAlreadySeen: false }, "line"],
        [{ packId: "caro-kann-black", lineId: "ckb1", lineIndex: 0, skipped: true, lineAlreadySeen: false }, null],
        [{ packId: "london", lineId: "lon1", lineIndex: 0, skipped: false, lineAlreadySeen: false }, null],
        [{ packId: "london", lineId: "lon1", lineIndex: 0, skipped: true, lineAlreadySeen: false }, null],
        [{ packId: "italian-white", lineId: "it1", lineIndex: 0, skipped: false, lineAlreadySeen: false }, null],
        [{ packId: "italian-white", lineId: "it1", lineIndex: 0, skipped: true, lineAlreadySeen: false }, null],
        [{ packId: "qg-white", lineId: "qg1", lineIndex: 0, skipped: false, lineAlreadySeen: false }, null],
        [{ packId: "qg-white", lineId: "qg1", lineIndex: 0, skipped: true, lineAlreadySeen: false }, null],
      ];
      for (const [input, expected] of cases) {
        const got = coachTalkAfterPackIntro(input);
        if (got !== expected) throw new Error(input.packId + " " + input.lineId + " skip=" + input.skipped + " -> " + got);
      }
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
