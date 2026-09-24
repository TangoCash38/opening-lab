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
  assert.doesNotMatch(train, /startScotchCoachNarration|sean-coach-narration/);
});

test("Sean narration plays on the coach card and skip stops it", () => {
  for (const file of [
    "public/scotch-coach/sean-coach-narration.mp3",
    "public/scotch-coach/sean-coach-narration.ogg",
  ]) {
    assert.equal(existsSync(join(root, file)), true, file);
    assert.ok(statSync(join(root, file)).size > 10_000, file);
  }
  assert.match(lib, /SCOTCH_COACH_NARRATION_MP3 = "\/scotch-coach\/sean-coach-narration\.mp3"/);
  assert.match(lib, /SCOTCH_COACH_NARRATION_OGG = "\/scotch-coach\/sean-coach-narration\.ogg"/);
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
  assert.match(ended, /onDoneRef\.current\(\)/);
  const leaveAt = intro.indexOf("const leave");
  const skip = intro.slice(leaveAt, intro.indexOf("return (", leaveAt));
  assert.match(skip, /stopScotchCoachNarration\(\)/);
  assert.match(skip, /onDone\(\)/);
});

test("coach is the seated picture plus Sean's voice, with no mouth overlay", () => {
  assert.doesNotMatch(intro, /scotch-coach-mouth|subscribeScotchCoachMouth/);
  assert.doesNotMatch(css, /\.scotch-coach-mouth/);
  assert.doesNotMatch(audio, /createAnalyser|scotchCoachMouthOpen|AudioContext/);
  assert.doesNotMatch(lib, /scotchCoachMouthOpen/);
  assert.match(intro, /coach-seated-v2\.png/);
  assert.match(audio, /SCOTCH_COACH_NARRATION_MP3/);
  assert.doesNotMatch(intro, /deepfake|speechSynthesis/i);
});

test("coach speaks once per browser until the seen flag is cleared", () => {
  assert.match(lib, /SCOTCH_COACH_SEEN_KEY = "opening-lab:scotch-coach-seen"/);
  assert.match(lib, /localStorage\.getItem\(SCOTCH_COACH_SEEN_KEY\) === "1"/);
  assert.match(lib, /localStorage\.setItem\(SCOTCH_COACH_SEEN_KEY, "1"\)/);
  const gateAt = hero.indexOf("scotchCoachApplies({");
  const branch = hero.slice(gateAt, hero.indexOf("preferInFrame()", gateAt));
  assert.match(branch, /!scotchCoachAlreadySeen\(\)/);
  assert.match(branch, /markScotchCoachSeen\(\)/);
  assert.match(branch, /mode: "learn"/);
  assert.doesNotMatch(train, /scotchCoachAlreadySeen|markScotchCoachSeen|ScotchCoachBoard/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);
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
  assert.doesNotMatch(plate, /position:\s*absolute/);
  assert.doesNotMatch(plate, /vs-computer|playComputer|Play on/i);
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
  assert.match(intro, /onDoneRef\.current\(\)/);
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
