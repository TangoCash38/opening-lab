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
const css = src("src/styles.css");
const train = src("src/components/opening-lab/train-view.tsx");

test("scotch coach is flag- and pack-gated to website desktop practice", () => {
  assert.match(lib, /SCOTCH_PACK_ID = "scotch"/);
  assert.match(lib, /SCOTCH_COACH_ENABLED = true/);
  assert.match(lib, /if \(!SCOTCH_COACH_ENABLED\) return false/);
  assert.match(lib, /input\.packId !== SCOTCH_PACK_ID/);
  assert.match(lib, /if \(input\.playApp\) return false/);
  assert.match(lib, /if \(!input\.websiteDesktop\) return false/);
  assert.match(hero, /scotchCoachApplies\(\{/);
  assert.match(hero, /playApp: Boolean\(playApp\)/);
  assert.match(hero, /websiteDesktop: websiteDesktopFrame\(\)/);
  assert.match(hero, /onStartLine\(pack, line, "learn"\)/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);
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
  assert.doesNotMatch(ended, /onDone/);
  const leaveAt = intro.indexOf("const leave");
  const skip = intro.slice(leaveAt, intro.indexOf("return (", leaveAt));
  assert.match(skip, /stopScotchCoachNarration\(\)/);
  assert.match(skip, /onDone\(\)/);
});

test("cartoon mouth follows narration level and shuts when silent", () => {
  assert.match(intro, /data-scotch-coach-mouth/);
  assert.match(intro, /subscribeScotchCoachMouth/);
  assert.match(intro, /coach-seated-v2\.png/);
  assert.match(css, /\.scotch-coach-mouth/);
  assert.match(audio, /createAnalyser/);
  assert.match(audio, /getByteTimeDomainData/);
  assert.match(audio, /scotchCoachMouthOpen/);
  assert.doesNotMatch(intro, /deepfake|speechSynthesis/i);
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      import { scotchCoachMouthOpen } from "./src/lib/scotch-coach.ts";
      const live = { paused: false, muted: false, ended: false };
      if (scotchCoachMouthOpen(0.2, live) <= 0.5) throw new Error("loud should open");
      if (scotchCoachMouthOpen(0.2, live) > 1) throw new Error("capped");
      if (scotchCoachMouthOpen(0.004, live) !== 0) throw new Error("quiet stays shut");
      if (scotchCoachMouthOpen(0.2, { ...live, muted: true }) !== 0) throw new Error("muted");
      if (scotchCoachMouthOpen(0.2, { ...live, paused: true }) !== 0) throw new Error("paused");
      if (scotchCoachMouthOpen(0.2, { ...live, ended: true }) !== 0) throw new Error("ended");
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
