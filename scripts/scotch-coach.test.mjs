import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const lib = src("src/lib/scotch-coach.ts");
const audio = src("src/lib/scotch-coach-audio.ts");
const hero = src("src/components/opening-lab/home-hero.tsx");
const intro = src("src/components/opening-lab/scotch-coach-intro.tsx");
const board = src("src/components/opening-lab/scotch-coach-board.tsx");
const css = src("src/styles.css");
const train = src("src/components/opening-lab/train-view.tsx");

test("scotch coach is flag- and pack-gated to Practice entry on phone and Play", () => {
  assert.match(lib, /SCOTCH_PACK_ID = "scotch"/);
  assert.match(lib, /SCOTCH_COACH_ENABLED = true/);
  assert.match(lib, /if \(!SCOTCH_COACH_ENABLED\) return false/);
  assert.match(lib, /input\.packId !== SCOTCH_PACK_ID/);
  assert.match(lib, /if \(!input\.practiceEntry\) return false/);
  assert.doesNotMatch(lib, /if \(input\.playApp\) return false/);
  assert.doesNotMatch(lib, /if \(!input\.websiteDesktop\) return false/);
  assert.match(hero, /scotchCoachApplies\(\{/);
  assert.match(hero, /practiceEntry,/);
  assert.match(hero, /launchLine\(line, undefined, true\)/);
  assert.match(hero, /onStartLine\(pack, line, "learn"\)/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);
  assert.match(hero, /practiceEntry = false/);
  assert.match(hero, /practiceEntry &&/);
  const advanceAt = hero.indexOf("const startAdvance");
  const advance = hero.slice(advanceAt, hero.indexOf("const openIntroThenPractice"));
  assert.match(advance, /launchLine\(line, undefined, true\)/);
  assert.match(hero, /else launchLine\(item\)/);
  assert.match(hero, /if \(line\) launchLine\(line\)/);
  assert.equal(hero.split("launchLine(line, undefined, true)").length - 1, 1);
  const nextAt = hero.indexOf("onPracticeNext=");
  const next = hero.slice(nextAt, nextAt + 140);
  assert.match(next, /setFrame\(\{ line: nextLine, mode: "learn" \}\)/);
  assert.doesNotMatch(next, /launchLine|setCoach|scotchCoach/);
  const modeAt = hero.indexOf("onModeChange=");
  const mode = hero.slice(modeAt, modeAt + 160);
  assert.doesNotMatch(mode, /launchLine|setCoach|scotchCoach/);
});

test("coach narrates the scotch gambit then starts book practice", () => {
  assert.match(lib, /Scotch Gambit · a cuppa and the open board/);
  assert.match(lib, /Right — Scotch Gambit\. It starts like a proper open game/);
  assert.match(lib, /plant the bishop on c4/);
  assert.match(lib, /Edinburgh–London correspondence matches in the eighteen-twenties/);
  assert.match(lib, /Grab your tea\. Practice the book moves with me/);
  assert.doesNotMatch(lib, /placeholder|Opening Expert can replace/);
  assert.match(intro, /SCOTCH_COACH_TITLE/);
  assert.match(intro, /data-scotch-coach-skip/);
  assert.match(intro, /data-scotch-coach-next/);
  assert.match(intro, /onDone/);
  assert.match(hero, /finishCoach/);
  assert.match(hero, /mode: "learn"/);
  assert.match(intro, /coach-seated-v2\.png/);
  assert.match(css, /scotch-coach-emerge/);
  assert.match(css, /#fbf6ea/);
  assert.doesNotMatch(intro, /vs-computer|playComputer|Play on/i);
  assert.match(train, /Test/);
  assert.doesNotMatch(train, /startScotchCoachNarration|coach-narration/);
});

test("narration plays on the coach card and skip stops it", () => {
  for (const file of [
    "public/scotch-coach/coach-narration.mp3",
    "public/scotch-coach/coach-narration.ogg",
  ]) {
    assert.equal(existsSync(join(root, file)), true, file);
    assert.ok(statSync(join(root, file)).size > 10_000, file);
  }
  assert.match(lib, /SCOTCH_COACH_NARRATION_MP3 = "\/scotch-coach\/coach-narration\.mp3"/);
  assert.match(lib, /SCOTCH_COACH_NARRATION_OGG = "\/scotch-coach\/coach-narration\.ogg"/);
  assert.match(lib, /SCOTCH_COACH_NARRATION_FALLBACK_SEC = 44/);
  assert.match(audio, /SCOTCH_COACH_NARRATION_MP3/);
  assert.match(audio, /SCOTCH_COACH_NARRATION_OGG/);
  assert.match(audio, /type = "audio\/mpeg"/);
  assert.match(audio, /type = "audio\/ogg"/);
  assert.match(audio, /data-scotch-coach-audio/);
  assert.match(audio, /audio\.pause\(\)/);
  assert.doesNotMatch(`${lib}\n${audio}\n${intro}`, /speechSynthesis|SpeechSynthesisUtterance|text-to-speech|\btts\b/i);

  const gateAt = hero.indexOf("scotchCoachApplies({");
  const branch = hero.slice(gateAt, hero.indexOf("preferInFrame()", gateAt));
  assert.match(branch, /startScotchCoachNarration\(\)/);
  assert.equal(hero.split("startScotchCoachNarration()").length - 1, 1);
  assert.match(hero, /stopScotchCoachNarration\(\)/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);

  assert.match(intro, /startScotchCoachNarration\(\)/);
  assert.match(intro, /scotchCoachBeatIndex\(audio\.currentTime, audio\.duration\)/);
  assert.match(intro, /data-scotch-coach-mute/);
  assert.match(intro, /data-scotch-coach-skip/);
  assert.match(intro, /stopScotchCoachNarration\(\)/);
  const ended = intro.slice(
    intro.indexOf("const onNarrationEnded"),
    intro.indexOf('audio.addEventListener("ended"'),
  );
  assert.match(ended, /setBeat\(SCOTCH_COACH_BEATS\.length - 1\)/);
  assert.match(ended, /leaveRef\.current\(\)/);
  const once = intro.slice(intro.indexOf("function useOnceCoachLeave"), intro.indexOf("type CardProps"));
  assert.match(once, /if \(left\) return/);
  assert.match(once, /stopScotchCoachNarration\(\)/);
  assert.match(once, /onDoneRef\.current\(reason\)/);
  assert.match(intro, /onSkip=\{\(\) => leave\("skip"\)\}/);
});

test("coach is the seated picture plus playback, with no mouth overlay", () => {
  assert.doesNotMatch(intro, /scotch-coach-mouth|subscribeScotchCoachMouth/);
  assert.doesNotMatch(css, /\.scotch-coach-mouth/);
  assert.doesNotMatch(audio, /createAnalyser|scotchCoachMouthOpen|AudioContext/);
  assert.doesNotMatch(lib, /scotchCoachMouthOpen/);
  assert.match(intro, /coach-seated-v2\.png/);
  assert.match(audio, /SCOTCH_COACH_NARRATION_MP3/);
  assert.doesNotMatch(intro, /deepfake|speechSynthesis/i);
});

test("coach speaks once per session, not from a forever localStorage flag", () => {
  assert.match(lib, /SCOTCH_COACH_SESSION_KEY = "opening-lab:scotch-coach-session"/);
  assert.match(lib, /sessionStorage\.getItem\(SCOTCH_COACH_SESSION_KEY\) === "1"/);
  assert.match(lib, /sessionStorage\.setItem\(SCOTCH_COACH_SESSION_KEY, "1"\)/);
  assert.match(lib, /"opening-lab:scotch-coach-seen"/);
  assert.match(lib, /"opening-lab:scotch-coach-dock-seen"/);
  assert.match(lib, /localStorage\.removeItem\(key\)/);
  assert.doesNotMatch(lib, /localStorage\.setItem/);
  assert.doesNotMatch(lib, /localStorage\.getItem/);
  const gateAt = hero.indexOf("scotchCoachApplies({");
  const branch = hero.slice(gateAt, hero.indexOf("preferInFrame()", gateAt));
  assert.match(branch, /!scotchCoachAlreadySeen\(\)/);
  assert.match(branch, /markScotchCoachSeen\(\)/);
  assert.match(branch, /mode: "learn"/);
  assert.doesNotMatch(train, /scotchCoachAlreadySeen|markScotchCoachSeen|ScotchCoachBoard/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);

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
      localStorage.setItem("opening-lab:scotch-coach-seen", "1");
      localStorage.setItem("opening-lab:scotch-coach-dock-seen", "1");
      const { scotchCoachAlreadySeen, markScotchCoachSeen, SCOTCH_COACH_SESSION_KEY } = await import("./src/lib/scotch-coach.ts");
      if (scotchCoachAlreadySeen()) throw new Error("forever flag still gates");
      if (localStorage.getItem("opening-lab:scotch-coach-seen") !== null) throw new Error("seen key remains");
      if (localStorage.getItem("opening-lab:scotch-coach-dock-seen") !== null) throw new Error("dock key remains");
      markScotchCoachSeen();
      if (!scotchCoachAlreadySeen()) throw new Error("session not marked");
      if (sessionStorage.getItem(SCOTCH_COACH_SESSION_KEY) !== "1") throw new Error("session value");
      if (localStorage.getItem("opening-lab:scotch-coach-seen") !== null) throw new Error("seen rewritten");
      sessionStorage.removeItem(SCOTCH_COACH_SESSION_KEY);
      if (scotchCoachAlreadySeen()) throw new Error("new visit still seen");
      markScotchCoachSeen();
      if (sessionStorage.getItem(SCOTCH_COACH_SESSION_KEY) !== "1") throw new Error("remark");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("book practice can open the coach transcript without covering the board", () => {
  assert.match(train, /ScotchCoachReading/);
  assert.match(train, /pack\.id === SCOTCH_PACK_ID/);
  assert.match(intro, /function ScotchCoachReading/);
  assert.match(intro, /data-scotch-coach-read/);
  assert.match(intro, /data-scotch-coach-transcript/);
  assert.match(intro, /aria-expanded=\{open\}/);
  assert.match(intro, /useState\(false\)/);
  assert.match(intro, /Read the intro/);
  assert.match(intro, /Hide the intro/);
  assert.match(intro, /SCOTCH_COACH_BEATS\.map/);
  assert.match(intro, /scotchCoachAlreadySeen\(\)/);
  assert.doesNotMatch(intro, /role="dialog"|fixed inset-0/);
  const reading = css.slice(css.indexOf(".scotch-coach-reading {"));
  assert.match(reading, /position:\s*static/);
  assert.doesNotMatch(reading, /position:\s*fixed|position:\s*absolute/);
  assert.match(reading, /#fbf6ea/);
  assert.doesNotMatch(train, /startScotchCoachNarration|coach-narration/);
});

test("phone and Play seat the coach on a cream plate above the wood", () => {
  assert.match(lib, /SCOTCH_COACH_DOCK_MIN_PX = 960/);
  assert.match(lib, /function scotchCoachPlateLayout/);
  assert.match(lib, /if \(input\.playApp\) return true/);
  assert.match(lib, /input\.viewportWidthPx < SCOTCH_COACH_DOCK_MIN_PX/);
  const plate = css.slice(css.indexOf("Phone column and the Play wrap"));
  assert.match(plate, /@media \(max-width: 959px\)/);
  assert.match(plate, /\[data-surface="play"\] \.home-coach-practice/);
  assert.match(plate, /flex-direction:\s*column/);
  assert.match(plate, /height:\s*12\.25rem/);
  assert.match(plate, /#fbf6ea/);
  assert.match(plate, /#e4d2b0/);
  assert.match(plate, /margin-left:\s*auto/);
  assert.match(plate, /margin-right:\s*auto/);
  assert.match(plate, /\.scotch-coach-plate[\s\S]*flex-direction:\s*row/);
  assert.match(plate, /background:\s*transparent/);
  assert.doesNotMatch(plate, /position:\s*absolute/);
  assert.doesNotMatch(plate, /vs-computer|playComputer|Play on/i);
  assert.equal(hero.split("<ScotchCoachCard").length - 1, 1);
  const dockAt = hero.indexOf("data-scotch-coach-dock");
  const dock = hero.slice(dockAt, hero.indexOf(") : (", dockAt));
  assert.match(dock, /data-scotch-coach-plate/);
  const beside = dock.slice(dock.indexOf("scotch-coach-plate"), dock.indexOf("home-board"));
  assert.match(beside, /ScotchCoachFigure/);
  assert.match(beside, /ScotchCoachCard/);
  assert.match(css, /\.scotch-coach-plate\s*\{[^}]*display:\s*contents/);
  const stage = css.slice(css.indexOf(".scotch-coach-stage {"), css.indexOf(".scotch-coach-figure"));
  assert.match(stage, /position:\s*relative/);
  assert.match(stage, /width:\s*10\.75rem/);
  assert.match(css, /flex-direction:\s*row/);
  assert.match(css, /home-hero--coach/);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      import { scotchCoachApplies, scotchCoachPlateLayout } from "./src/lib/scotch-coach.ts";
      const cases = [
        [{ packId: "scotch", practiceEntry: true }, true],
        [{ packId: "scotch", practiceEntry: false }, false],
        [{ packId: "caro-kann-black", practiceEntry: true }, false],
        [{ packId: "london", practiceEntry: true }, false],
        [{ packId: "italian-white", practiceEntry: false }, false],
      ];
      for (const [input, expected] of cases) {
        const got = scotchCoachApplies(input);
        if (got !== expected) throw new Error(JSON.stringify(input) + " -> " + got);
      }
      const plates = [
        [{ playApp: true, viewportWidthPx: 1280 }, true],
        [{ playApp: true, viewportWidthPx: 390 }, true],
        [{ playApp: false, viewportWidthPx: 390 }, true],
        [{ playApp: false, viewportWidthPx: 959 }, true],
        [{ playApp: false, viewportWidthPx: 960 }, false],
        [{ playApp: false, viewportWidthPx: 1440 }, false],
      ];
      for (const [input, expected] of plates) {
        const got = scotchCoachPlateLayout(input);
        if (got !== expected) throw new Error(JSON.stringify(input) + " plate " + got);
      }
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("practice board auto-plays the scotch gambit stem during the intro", () => {
  assert.match(lib, /SCOTCH_COACH_STEM = \["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4"\]/);
  assert.match(lib, /SCOTCH_COACH_STEM_AT_SEC = \[5\.28, 6\.28, 7\.42, 7\.92, 10\.25, 12\.95, 16\.25\]/);
  assert.match(lib, /function scotchCoachStemPlyCount/);
  assert.match(board, /data-scotch-coach-stem/);
  assert.match(board, /scotchCoachStemPlyCount/);
  assert.match(board, /scotchCoachNarration\(\)/);
  assert.match(board, /onSlideComplete/);
  assert.match(hero, /ScotchCoachBoard/);
  assert.match(hero, /data-scotch-coach-dock/);
  assert.match(hero, /home-coach-practice/);
  assert.match(intro, /onDoneRef\.current\(reason\)/);
  assert.match(css, /\.home-coach-practice\s*\{[^}]*display:\s*flex/);
  const stage = css.slice(css.indexOf(".scotch-coach-stage {"), css.indexOf(".scotch-coach-figure"));
  assert.match(stage, /position:\s*relative/);
  assert.doesNotMatch(stage, /position:\s*absolute/);
  assert.doesNotMatch(stage, /top:\s*0\.2rem/);
  assert.match(css, /home-hero--coach/);
  assert.doesNotMatch(board, /vs-computer|playComputer|Play on/i);
  assert.doesNotMatch(train, /SCOTCH_COACH_STEM|scotchCoachStemPlyCount/);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      import { Chess } from "chess.js";
      import {
        SCOTCH_COACH_STEM,
        SCOTCH_COACH_STEM_AT_SEC,
        SCOTCH_COACH_NARRATION_FALLBACK_SEC,
        scotchCoachStemPlyCount,
      } from "./src/lib/scotch-coach.ts";
      const game = new Chess();
      for (const san of SCOTCH_COACH_STEM) {
        if (!game.move(san)) throw new Error("illegal " + san);
      }
      if (SCOTCH_COACH_STEM.length !== 7) throw new Error("stem length");
      if (SCOTCH_COACH_STEM_AT_SEC.length !== SCOTCH_COACH_STEM.length) throw new Error("cues");
      const duration = 44;
      const cases = [
        [0, 0],
        [5.27, 0],
        [5.28, 1],
        [6.28, 2],
        [7.42, 3],
        [7.92, 4],
        [10.25, 5],
        [12.95, 6],
        [16.25, 7],
        [duration, 7],
      ];
      for (const [time, expected] of cases) {
        const got = scotchCoachStemPlyCount(time, duration);
        if (got !== expected) throw new Error(time + " -> " + got + " expected " + expected);
      }
      if (scotchCoachStemPlyCount(5.28, 0) !== 1) throw new Error("fallback scale");
      if (scotchCoachStemPlyCount(5.28, Number.NaN) !== 1) throw new Error("nan duration");
      const doubled = SCOTCH_COACH_NARRATION_FALLBACK_SEC * 2;
      if (scotchCoachStemPlyCount(5.28, doubled) !== 0) throw new Error("scaled early");
      if (scotchCoachStemPlyCount(10.56, doubled) !== 1) throw new Error("scaled e4");
      if (scotchCoachStemPlyCount(-1, duration) !== 0) throw new Error("negative");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("Professor Potato Pie names the scotch coach on the plate and in alt text", () => {
  assert.match(lib, /SCOTCH_COACH_NAME = "Professor Potato Pie"/);
  assert.match(intro, /SCOTCH_COACH_NAME/);
  assert.match(intro, /data-scotch-coach-name/);
  assert.match(intro, /aria-label=\{t\(SCOTCH_COACH_NAME\)\}/);
  assert.match(intro, /alt=\{t\(SCOTCH_COACH_NAME\)\}/);
  assert.match(intro, /coach-seated-v2\.png/);
  assert.match(css, /\.scotch-coach-name/);
  assert.doesNotMatch(intro, /aria-label=\{t\("Scotch coach"\)\}/);
  assert.doesNotMatch(`${intro}\n${hero}\n${lib}`, /Play on|vs-computer|playComputer/i);
});

test("Line 1 (sg1) opens the pack-recipe talk once per session, not other lines", () => {
  assert.match(lib, /SCOTCH_CANAL_LINE_ID = "sg1"/);
  assert.match(lib, /SCOTCH_CANAL_TITLE = "Line 1 · ten lines from the gambit"/);
  assert.match(lib, /welcome to Line 1/);
  assert.doesNotMatch(lib, /Canal Variation|Dubois/);
  assert.doesNotMatch(lib, /line\.name|input\.lineName/);
  assert.match(lib, /ten carefully selected lines/);
  assert.match(lib, /principled book moves you'd expect from somebody who knows the opening/);
  assert.match(lib, /stay firmly in the game/);
  assert.match(lib, /less accurate replies an opponent may try/);
  assert.match(lib, /clear advantage and, on occasion, a rather exquisite checkmate/);
  assert.match(lib, /SCOTCH_CANAL_NARRATION_MP3 = "\/scotch-coach\/professor-potato-pie-canal\.mp3"/);
  assert.match(lib, /SCOTCH_CANAL_NARRATION_FALLBACK_SEC = 95/);
  assert.match(lib, /function scotchCanalBeatIndex/);
  assert.doesNotMatch(lib, /coach-narration\.mp3".*professor-potato-pie-canal/);
  assert.match(lib, /SCOTCH_CANAL_SESSION_KEY = "opening-lab:scotch-canal-coach-session"/);
  assert.match(lib, /sessionStorage\.getItem\(SCOTCH_CANAL_SESSION_KEY\) === "1"/);
  assert.match(lib, /sessionStorage\.setItem\(SCOTCH_CANAL_SESSION_KEY, "1"\)/);
  assert.match(lib, /if \(input\.practiceEntry\) return false/);
  assert.match(lib, /if \(input\.lineIndex !== 0\) return false/);
  assert.match(lib, /if \(input\.lineId !== SCOTCH_CANAL_LINE_ID\) return false/);
  assert.equal(existsSync(join(root, "public/scotch-coach/professor-potato-pie-canal.mp3")), true);
  assert.ok(
    statSync(join(root, "public/scotch-coach/professor-potato-pie-canal.mp3")).size > 10_000,
  );
  assert.equal(existsSync(join(root, "public/scotch-coach/professor-potato-pie-canal.wav")), false);
  assert.match(audio, /startScotchCanalNarration/);
  assert.match(audio, /mountNarration\(SCOTCH_CANAL_NARRATION_MP3, null, "canal"\)/);
  assert.match(audio, /SCOTCH_COACH_NARRATION_MP3, SCOTCH_COACH_NARRATION_OGG, "intro"/);
  assert.doesNotMatch(audio, /SCOTCH_CANAL_NARRATION_READY/);
  assert.doesNotMatch(`${lib}\n${audio}\n${intro}`, /speechSynthesis|SpeechSynthesisUtterance|text-to-speech|\btts\b/i);

  assert.match(hero, /scotchCanalCoachApplies\(\{/);
  assert.match(hero, /!scotchCanalCoachAlreadySeen\(\)/);
  assert.match(hero, /markScotchCanalCoachSeen\(\)/);
  assert.match(hero, /startScotchCanalNarration\(\)/);
  assert.match(hero, /talk: "canal"/);
  assert.match(hero, /talk=\{coach\.talk\}/);
  assert.match(intro, /talk === "canal"/);
  assert.match(intro, /SCOTCH_CANAL_BEATS/);
  assert.match(intro, /data-scotch-coach-talk=\{talk\}/);
  assert.match(intro, /data-scotch-coach-mute/);
  assert.match(intro, /data-scotch-coach-skip/);
  assert.match(intro, /data-scotch-coach-next/);
  assert.equal(hero.split("launchLine(line, undefined, true)").length - 1, 1);
  assert.match(hero, /else launchLine\(item\)/);
  const nextAt = hero.indexOf("onPracticeNext=");
  const next = hero.slice(nextAt, nextAt + 140);
  assert.doesNotMatch(next, /launchLine|setCoach|scotchCanal|startScotch/);
  assert.doesNotMatch(train, /startScotchCanalNarration|sean-canal-narration|ScotchCoachCard/);
  assert.match(intro, /scotchCanalCoachAlreadySeen\(\)/);
  assert.match(intro, /SCOTCH_CANAL_BEATS\.map/);

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
      const {
        scotchCoachApplies,
        scotchCanalCoachApplies,
        scotchCoachAlreadySeen,
        scotchCanalCoachAlreadySeen,
        markScotchCoachSeen,
        markScotchCanalCoachSeen,
        SCOTCH_COACH_SESSION_KEY,
        SCOTCH_CANAL_SESSION_KEY,
        SCOTCH_CANAL_BEATS,
        SCOTCH_CANAL_BEAT_AT_SEC,
        SCOTCH_CANAL_NARRATION_FALLBACK_SEC,
        scotchCanalBeatIndex,
      } = await import("./src/lib/scotch-coach.ts");
      const { PACKS } = await import("./src/data/packs.ts");
      const scotch = PACKS.find((pack) => pack.id === "scotch");
      if (!scotch) throw new Error("missing scotch pack");
      if (scotch.lines[0]?.id !== "sg1" || scotch.lines[0]?.name !== "Line 1") {
        throw new Error("first variation is not sg1 Line 1");
      }
      if (SCOTCH_CANAL_BEATS.length !== 9) throw new Error("canal beats");
      if (SCOTCH_CANAL_BEAT_AT_SEC.length !== SCOTCH_CANAL_BEATS.length) throw new Error("canal cues");
      if (SCOTCH_CANAL_NARRATION_FALLBACK_SEC !== 95) throw new Error("canal duration");
      const canalDuration = 95;
      const canalCases = [
        [0, 0],
        [7.91, 0],
        [7.92, 1],
        [13.86, 2],
        [20.32, 3],
        [31.52, 4],
        [40.62, 5],
        [56.98, 6],
        [77.56, 7],
        [89.94, 8],
        [canalDuration, 8],
        [-1, 0],
      ];
      for (const [time, expected] of canalCases) {
        const got = scotchCanalBeatIndex(time, canalDuration);
        if (got !== expected) throw new Error(time + " canal -> " + got + " expected " + expected);
      }
      if (scotchCanalBeatIndex(7.92, 0) !== 1) throw new Error("canal fallback");
      if (scotchCanalBeatIndex(15.84, SCOTCH_CANAL_NARRATION_FALLBACK_SEC * 2) !== 1) {
        throw new Error("canal scaled");
      }
      const canal = { packId: "scotch", lineId: "sg1", lineIndex: 0, practiceEntry: false };
      if (!scotchCanalCoachApplies(canal)) throw new Error("canal should apply");
      if (scotchCanalCoachApplies({ ...canal, practiceEntry: true })) throw new Error("practice entry is the cuppa intro");
      if (scotchCanalCoachApplies({ ...canal, lineId: "sg2", lineIndex: 1 })) throw new Error("later line");
      if (scotchCanalCoachApplies({ ...canal, lineIndex: 1 })) throw new Error("canal moved off first");
      if (scotchCanalCoachApplies({ ...canal, packId: "italian" })) throw new Error("other pack");
      if (!scotchCoachApplies({ packId: "scotch", practiceEntry: true })) throw new Error("cuppa intro");
      if (scotchCoachApplies({ packId: "scotch", practiceEntry: false })) throw new Error("line tap is not the cuppa intro");
      markScotchCoachSeen();
      if (!scotchCoachAlreadySeen()) throw new Error("intro not marked");
      if (scotchCanalCoachAlreadySeen()) throw new Error("intro marked canal");
      if (sessionStorage.getItem(SCOTCH_CANAL_SESSION_KEY) !== null) throw new Error("canal key set early");
      markScotchCanalCoachSeen();
      if (!scotchCanalCoachAlreadySeen()) throw new Error("canal not marked");
      if (sessionStorage.getItem(SCOTCH_COACH_SESSION_KEY) !== "1") throw new Error("intro key cleared");
      sessionStorage.removeItem(SCOTCH_CANAL_SESSION_KEY);
      if (scotchCanalCoachAlreadySeen()) throw new Error("new visit still seen");
      if (!scotchCoachAlreadySeen()) throw new Error("intro should survive canal reset");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("canal board plays sg1 in order, finishes before the clip, then Practice starts at ply 0", () => {
  assert.match(lib, /SCOTCH_CANAL_LINE_END_LEAD_SEC = 5/);
  assert.match(lib, /SCOTCH_CANAL_PRACTICE_START_PLY = 0/);
  assert.match(lib, /function scotchCanalLinePlyCount/);
  assert.match(lib, /function scotchCanalLineFinishSec/);
  assert.match(lib, /function scotchCanalLinePlayed/);
  assert.match(board, /SCOTCH_CANAL_LINE_ID/);
  assert.match(board, /PACKS\.find/);
  assert.match(board, /item\.id === SCOTCH_CANAL_LINE_ID/);
  assert.match(board, /line\?\.plies/);
  assert.match(board, /scotchCanalLinePlyCount/);
  assert.match(board, /SCOTCH_CANAL_NARRATION_FALLBACK_SEC/);
  assert.match(board, /data-scotch-canal-ply/);
  assert.match(board, /showHints=\{false\}/);
  assert.match(board, /interactive=\{false\}/);
  assert.match(board, /lastMove=\{lastMove\}/);
  assert.match(board, /slide=\{slide\}/);
  assert.doesNotMatch(board, /arrows=|hintMoves/);
  assert.doesNotMatch(board, /Bxd5|cxb2|Qxd1|Nxe4/);
  assert.doesNotMatch(lib, /Bxd5|cxb2|Qxd1/);
  const dockStart = hero.indexOf("data-scotch-coach-dock");
  const dock = hero.slice(dockStart, hero.indexOf("home-board pointer-events-none px-2", dockStart));
  assert.match(dock, /talk="canal"/);
  assert.match(dock, /flip=\{pack\.side === "Black"\}/);
  assert.match(dock, /ScotchCoachBoard/);
  assert.doesNotMatch(dock, /<ChessBoard/);
  const finish = hero.slice(hero.indexOf("const finishCoach"), hero.indexOf("const activeLineId"));
  assert.match(finish, /coachTalkAfterPackIntro/);
  assert.match(finish, /skipped: reason === "skip"/);
  assert.match(finish, /launchLine\(\s*current\.line,/);
  assert.match(finish, /current\.talk === "canal" \? SCOTCH_CANAL_PRACTICE_START_PLY/);
  assert.match(finish, /mode: "learn"|openInFrame\(current\.line, options, "learn"\)/);
  assert.doesNotMatch(finish, /data-scotch-canal-ply|canalPly|playedRef/);
  assert.match(train, /startPly = 0/);
  assert.doesNotMatch(train, /scotchCanalLinePlyCount|SCOTCH_CANAL_LINE_ID/);
  assert.doesNotMatch(`${board}\n${hero}`, /vs-computer|playComputer|Play on/i);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      import { Chess } from "chess.js";
      import { PACKS } from "./src/data/packs.ts";
      import {
        SCOTCH_CANAL_LINE_END_LEAD_SEC,
        SCOTCH_CANAL_NARRATION_FALLBACK_SEC,
        SCOTCH_CANAL_PRACTICE_START_PLY,
        scotchCanalLineCueSec,
        scotchCanalLineFinishSec,
        scotchCanalLinePlayed,
        scotchCanalLinePlyCount,
      } from "./src/lib/scotch-coach.ts";
      const scotch = PACKS.find((pack) => pack.id === "scotch");
      const sg1 = scotch?.lines.find((line) => line.id === "sg1");
      const sg2 = scotch?.lines.find((line) => line.id === "sg2");
      if (!sg1 || sg1.name !== "Line 1") throw new Error("sg1 missing");
      if (!sg2) throw new Error("sg2 missing");
      const sans = sg1.plies;
      if (sans.length < 8) throw new Error("sg1 too short");
      const game = new Chess();
      for (const san of sans) {
        if (!game.move(san)) throw new Error("illegal " + san);
      }
      if (SCOTCH_CANAL_PRACTICE_START_PLY !== 0) throw new Error("practice must restart at ply 0");
      const duration = SCOTCH_CANAL_NARRATION_FALLBACK_SEC;
      const finish = scotchCanalLineFinishSec(duration);
      if (!(finish < duration - 3)) throw new Error("finish " + finish + " is not a few seconds early");
      if (Math.abs(duration - finish - SCOTCH_CANAL_LINE_END_LEAD_SEC) > 1e-9) {
        throw new Error("lead " + (duration - finish));
      }
      if (scotchCanalLinePlyCount(0, duration, sans.length) !== 0) throw new Error("start empty");
      if (scotchCanalLinePlyCount(-1, duration, sans.length) !== 0) throw new Error("negative");
      let previous = 0;
      for (let ply = 1; ply <= sans.length; ply += 1) {
        const cue = scotchCanalLineCueSec(ply, duration, sans.length);
        if (!(cue > 0 && cue <= finish)) throw new Error("cue out of window " + ply);
        const justBefore = scotchCanalLinePlyCount(cue - 0.02, duration, sans.length);
        const atCue = scotchCanalLinePlyCount(cue, duration, sans.length);
        if (justBefore !== ply - 1) throw new Error("before " + ply + " -> " + justBefore);
        if (atCue !== ply) throw new Error("at " + ply + " -> " + atCue);
        if (atCue < previous) throw new Error("rewound");
        previous = atCue;
        const played = scotchCanalLinePlayed(sans, cue, duration);
        if (played.length !== ply) throw new Error("prefix " + ply);
        if (played[ply - 1] !== sans[ply - 1]) throw new Error("order " + played[ply - 1]);
        if (played.some((san, index) => san !== sans[index])) throw new Error("reordered");
      }
      const lastCue = scotchCanalLineCueSec(sans.length, duration, sans.length);
      if (!(lastCue < duration)) throw new Error("last move at clip end");
      if (scotchCanalLinePlyCount(duration, duration, sans.length) !== sans.length) {
        throw new Error("clip end should hold the full line");
      }
      const full = scotchCanalLinePlayed(sans, duration, duration);
      if (full.length !== sans.length || full.some((san, index) => san !== sans[index])) {
        throw new Error("full line mismatch");
      }
      if (scotchCanalLinePlyCount(lastCue, 0, sans.length) !== sans.length) throw new Error("fallback duration");
      if (scotchCanalLinePlyCount(lastCue, Number.NaN, sans.length) !== sans.length) throw new Error("nan duration");
      const doubled = duration * 2;
      const doubledFinish = scotchCanalLineFinishSec(doubled);
      if (!(doubledFinish < doubled - 3)) throw new Error("scaled finish");
      if (scotchCanalLinePlyCount(lastCue, doubled, sans.length) >= sans.length) {
        throw new Error("longer clip should still be mid-line at the short-clip finish");
      }
      if (scotchCanalLinePlyCount(doubledFinish, doubled, sans.length) !== sans.length) {
        throw new Error("longer clip should finish on its own clock");
      }
      if (!(scotchCanalLineCueSec(sans.length, doubled, sans.length) < doubled)) {
        throw new Error("longer clip last move at the end");
      }
      if (scotchCanalLinePlayed(sg2.plies, duration, duration).join(" ") === sans.join(" ")) {
        throw new Error("sg2 must not be the canal line");
      }
      const practice = new Chess();
      if (practice.history().length !== SCOTCH_CANAL_PRACTICE_START_PLY) {
        throw new Error("practice board not at ply 0");
      }
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("canal plate mounts a single coach figure", () => {
  const dockAt = hero.indexOf("data-scotch-coach-dock");
  const dock = hero.slice(dockAt, hero.indexOf("home-board pointer-events-none px-2", dockAt));
  const plate = dock.slice(dock.indexOf("scotch-coach-plate"), dock.indexOf("home-board"));
  assert.equal(plate.split("ScotchCoachFigure").length - 1, 1);
  assert.equal(plate.split("<img").length - 1, 0);
  assert.match(plate, /key=\{`figure-\$\{coach\.talk\}-\$\{coach\.line\.id\}`\}/);
  assert.match(plate, /key=\{`card-\$\{coach\.talk\}-\$\{coach\.line\.id\}`\}/);
  assert.doesNotMatch(plate, /key=\{`\$\{coach\.talk\}-\$\{coach\.line\.id\}`\}/);
  assert.match(dock, /talk="canal"/);
  const canalFn = intro.slice(
    intro.indexOf("function ScotchCoachCanalCard"),
    intro.indexOf("export function ScotchCoachCard"),
  );
  assert.doesNotMatch(canalFn, /ScotchCoachFigure|coach-seated|<img/);
  const introFn = intro.slice(
    intro.indexOf("function ScotchCoachIntroCard"),
    intro.indexOf("function ScotchCoachCanalCard"),
  );
  assert.doesNotMatch(introFn, /ScotchCoachFigure|coach-seated|<img/);
  const phone = css.slice(css.indexOf("Phone column and the Play wrap"));
  assert.match(phone, /\.home-coach-practice \.scotch-coach-actions\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(
    phone,
    /\[data-surface="play"\] \.home-coach-practice \.scotch-coach-actions\s*\{[^}]*flex-wrap:\s*wrap/,
  );
  assert.match(phone, /min-width:\s*min\(100%,\s*5\.6rem\)/);
});

test("narration quarters land on the four cream beats", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      import { scotchCoachBeatIndex, SCOTCH_COACH_BEATS, SCOTCH_COACH_NARRATION_FALLBACK_SEC } from "./src/lib/scotch-coach.ts";
      const beats = SCOTCH_COACH_BEATS.length;
      const duration = 44.016;
      const quarter = duration / beats;
      const cases = [
        [0, 0],
        [quarter - 0.001, 0],
        [quarter, 1],
        [quarter * 2 - 0.001, 1],
        [quarter * 2, 2],
        [quarter * 3, 3],
        [duration, 3],
        [duration + 5, 3],
      ];
      for (const [time, expected] of cases) {
        const got = scotchCoachBeatIndex(time, duration);
        if (got !== expected) throw new Error(time + " -> " + got + " expected " + expected);
      }
      if (scotchCoachBeatIndex(0, Number.NaN) !== 0) throw new Error("nan start");
      if (scotchCoachBeatIndex(SCOTCH_COACH_NARRATION_FALLBACK_SEC / beats, 0) !== 1) {
        throw new Error("fallback quarter");
      }
      if (scotchCoachBeatIndex(SCOTCH_COACH_NARRATION_FALLBACK_SEC, Number.POSITIVE_INFINITY) !== beats - 1) {
        throw new Error("infinite duration");
      }
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
