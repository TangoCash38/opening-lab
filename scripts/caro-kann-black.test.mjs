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
  const dir = join(root, "scripts", ".generated-caro-coach");
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
  const js = ts
    .transpileModule(src("src/lib/coach-packs.ts"), options)
    .outputText.replaceAll("@/lib/scotch-coach", "./scotch-coach.mjs")
    .replaceAll("@/lib/caro-intro-stem", "./caro-intro-stem.mjs")
    .replaceAll("@/lib/london-intro-stem", "./london-intro-stem.mjs");
  writeFileSync(join(dir, "coach-packs.mjs"), js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return "./scripts/.generated-caro-coach/coach-packs.mjs";
}

test("caro-kann-black has 10 legal lines titled Line 1 to Line 10 and a Potato Pie coach", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  assert.equal(
    existsSync(join(root, "public/coach/caro-kann-black/professor-potato-pie-caro-intro.mp3")),
    true,
  );
  assert.equal(
    existsSync(join(root, "public/coach/caro-kann-black/professor-potato-pie-caro-line1.mp3")),
    true,
  );
  const packs = src("src/data/packs.ts");
  const catalog = src("src/lib/catalog.ts");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const train = src("src/components/opening-lab/train-view.tsx");
  assert.match(catalog, /"caro-kann-black": \["ckb1", "ckb3", "ckb5"\]/);
  assert.match(catalog, /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white"\]/);
  assert.match(hero, /if \(current\.talk === "line"\) options\.startPly = SCOTCH_CANAL_PRACTICE_START_PLY/);
  assert.match(hero, /if \(current\.talk === "intro"\) options\.startPly = SCOTCH_CANAL_PRACTICE_START_PLY/);
  const introBoard = hero.slice(
    hero.indexOf('coach.talk === "intro" && !textScript'),
    hero.indexOf('coach.talk === "canal"'),
  );
  assert.match(introBoard, /flip=\{pack\.side === "Black"\}/);
  assert.match(introBoard, /stemSans=\{coachPack\(pack\.id\)\?\.introStem\}/);
  assert.match(introBoard, /stemAtSec=\{coachPack\(pack\.id\)\?\.introStemAtSec\}/);
  assert.match(introBoard, /plyFallbackSec=\{coachPack\(pack\.id\)\?\.introAudioFallbackSec\}/);
  assert.match(hero, /plyAtSec=\{linePlyCues\}/);
  assert.doesNotMatch(train, /startCoachPackNarration/);
  assert.doesNotMatch(packs, /id: "ckb1[1-9]"/);
  assert.doesNotMatch(packs, /Play on/);

  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      let Chess = null;
      try {
        ({ Chess } = await import("chess.js"));
      } catch {
        Chess = null;
      }
      const { PACKS } = await import("./src/data/packs.ts");
      const {
        CARO_LINE_PROGRESS_REVISION,
        migrateProgressLines,
      } = await import("./src/lib/progress.ts");
      const {
        COACH_PACKS,
        coachAudioPlyCount,
        coachIntroAlreadySeen,
        coachIntroSessionKey,
        coachLineAlreadySeen,
        coachLinePlyCues,
        coachLineSessionKey,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachTalkPlies,
        coachTextPlayedSans,
        lineBeatAtSec,
        markCoachIntroSeen,
        markCoachLineSeen,
      } = await import(${JSON.stringify(compiled)});
      const { SCOTCH_CANAL_PRACTICE_START_PLY } = await import("./src/lib/scotch-coach.ts");

      if (SCOTCH_CANAL_PRACTICE_START_PLY !== 0) throw new Error("practice must start at ply 0");
      const pack = PACKS.find((item) => item.id === "caro-kann-black");
      if (!pack) throw new Error("pack missing");
      if (pack.lines.length !== 10) throw new Error("line count " + pack.lines.length);
      if (pack.price !== null) throw new Error("price changed");
      if (pack.isFree !== true) throw new Error("free flag changed");
      pack.lines.forEach((line, index) => {
        const n = index + 1;
        if (line.id !== "ckb" + n) throw new Error("id " + line.id);
        if (line.name !== "Line " + n) throw new Error("title " + line.name);
        if (line.side !== "b") throw new Error("side " + line.id);
        if (!line.idea || !line.next) throw new Error("copy " + line.id);
        if (line.name.includes("·")) throw new Error("variation name " + line.name);
        if (!Chess) return;
        const game = new Chess();
        for (const san of line.plies) {
          let played;
          try {
            played = game.move(san);
          } catch (error) {
            throw new Error(line.id + " " + san + " " + error.message);
          }
          if (!played) throw new Error(line.id + " illegal " + san);
        }
      });

      const coach = COACH_PACKS["caro-kann-black"];
      if (!coach) throw new Error("coach entry missing");
      if (coach.firstLineId !== "ckb1") throw new Error("first line " + coach.firstLineId);
      if (coach.firstLineTitle !== "Line 1") throw new Error("coach title " + coach.firstLineTitle);
      if (coach.introAudio !== "/coach/caro-kann-black/professor-potato-pie-caro-intro.mp3") {
        throw new Error("intro audio");
      }
      if (coach.firstLineAudio !== "/coach/caro-kann-black/professor-potato-pie-caro-line1.mp3") {
        throw new Error("line audio");
      }
      if (coach.introAudioFallbackSec !== 112.8) throw new Error("intro length");
      if (coach.firstLineAudioFallbackSec !== 135) throw new Error("line length");
      if (coach.introBeats.length !== 10) throw new Error("intro beats");
      if (coach.introBeats[0].startsWith("Ah, hello again.") !== true) throw new Error("intro open");
      if (coach.introBeats[9] !== "Right then. Tea settled, pieces ready. Let's begin.") {
        throw new Error("intro close");
      }
      if (coach.introBeats.some((beat) => beat.includes("["))) throw new Error("bracket in intro");
      const introAt = coach.introBeatAtSec;
      if (!introAt || introAt.join(",") !== "0,17.4,31.9,45.9,62.3,74.3,85,94,100.4,109") {
        throw new Error("intro times " + introAt);
      }
      if (coach.firstLineBeats.length !== 20) throw new Error("line beats " + coach.firstLineBeats.length);
      if (coach.firstLineBeats.some((beat) => beat.caption.includes("["))) throw new Error("bracket in line");
      const lineAt = lineBeatAtSec(coach.firstLineBeats);
      if (!lineAt || lineAt.join(",") !== "0,8.1,13.3,20.2,24,37,44.7,53.3,58.9,64.4,67.7,74.7,82.3,87.8,91.7,100.3,104.4,111.7,120.7,128.7") {
        throw new Error("line beat times " + lineAt);
      }
      const cues = coachLinePlyCues("caro-kann-black");
      const expectedCues = "7.1,8.7,15.9,18.8,21.4,28.1,37.2,38.9,47.4,54.1,59.3,61,66.5,69.2,70.4,76.5,83.1,86.2,89.2,94.4,96.7,101.5,105.8,108.8";
      if (!cues || cues.join(",") !== expectedCues) throw new Error("spoken moves " + cues);
      if (coachAudioPlyCount(cues, 7.09, 135, 135) !== 0) throw new Error("e4 not yet");
      if (coachAudioPlyCount(cues, 7.1, 135, 135) !== 1) throw new Error("e4");
      if (coachAudioPlyCount(cues, 18.8, 135, 135) !== 4) throw new Error("d5");
      if (coachAudioPlyCount(cues, 108.79, 135, 135) !== 23) throw new Error("Be7 not yet");
      if (coachAudioPlyCount(cues, 108.8, 135, 135) !== 24) throw new Error("Be7");
      const script = coachTalkPlies("caro-kann-black", "line");
      const played = coachTextPlayedSans(script, 99);
      if (played.join(" ") !== pack.lines[0].plies.join(" ")) {
        throw new Error("script plies\\n" + played.join(" ") + "\\npack\\n" + pack.lines[0].plies.join(" "));
      }
      const introPlies = coachTalkPlies("caro-kann-black", "intro");
      if (introPlies !== null) throw new Error("caro intro uses the stem clock");
      if (!coach.introStem || coach.introStem.join(" ") !== "e4 c6") {
        throw new Error("intro stem " + coach.introStem);
      }
      if (!coach.introStemAtSec || coach.introStemAtSec.join(",") !== "18.5,19.7") {
        throw new Error("intro stem times " + coach.introStemAtSec);
      }
      if (coachAudioPlyCount(coach.introStemAtSec, 18.49, 112.8, 112.8) !== 0) {
        throw new Error("e4 not yet");
      }
      if (coachAudioPlyCount(coach.introStemAtSec, 18.5, 112.8, 112.8) !== 1) {
        throw new Error("e4");
      }
      if (coachAudioPlyCount(coach.introStemAtSec, 19.69, 112.8, 112.8) !== 1) {
        throw new Error("c6 not yet");
      }
      if (coachAudioPlyCount(coach.introStemAtSec, 19.7, 112.8, 112.8) !== 2) {
        throw new Error("c6");
      }
      if (Chess) {
        const stemGame = new Chess();
        for (const san of coach.introStem) {
          if (!stemGame.move(san)) throw new Error("illegal stem " + san);
        }
      }
      const {
        SCOTCH_COACH_STEM_AT_SEC,
        SCOTCH_COACH_NARRATION_FALLBACK_SEC,
        scotchCoachStemPlyCount,
      } = await import("./src/lib/scotch-coach.ts");
      for (const time of [0, 5.28, 6.28, 7.42, 7.92, 10.25, 12.95, 16.25, 20, 44]) {
        const scotchCount = scotchCoachStemPlyCount(time, 44.016);
        const shared = coachAudioPlyCount(
          SCOTCH_COACH_STEM_AT_SEC,
          time,
          44.016,
          SCOTCH_COACH_NARRATION_FALLBACK_SEC,
        );
        if (scotchCount !== shared) {
          throw new Error("scotch stem drift " + time + " " + scotchCount + " " + shared);
        }
      }
      if (!coachPackIntroApplies("caro-kann-black")) throw new Error("intro gate");
      if (!coachPackLineApplies({ packId: "caro-kann-black", lineId: "ckb1" })) throw new Error("ckb1");
      if (coachPackLineApplies({ packId: "caro-kann-black", lineId: "ckb2" })) throw new Error("ckb2");
      if (coachPackLineApplies({ packId: "caro-kann-black", lineId: "Line 1" })) throw new Error("title");
      const introKey = coachIntroSessionKey("caro-kann-black");
      const lineKey = coachLineSessionKey("caro-kann-black", "ckb1");
      if (introKey === lineKey) throw new Error("shared session key");
      if (!introKey.includes("caro-kann-black") || !lineKey.includes("ckb1")) throw new Error("session key");
      if (typeof sessionStorage === "undefined") {
        globalThis.sessionStorage = {
          data: new Map(),
          getItem(key) { return this.data.has(key) ? this.data.get(key) : null; },
          setItem(key, value) { this.data.set(key, String(value)); },
        };
      }
      markCoachIntroSeen("caro-kann-black");
      if (!coachIntroAlreadySeen("caro-kann-black")) throw new Error("intro not marked");
      if (coachLineAlreadySeen("caro-kann-black", "ckb1")) throw new Error("intro marked the line");
      markCoachLineSeen("caro-kann-black", "ckb1");
      if (!coachLineAlreadySeen("caro-kann-black", "ckb1")) throw new Error("line not marked");

      const stale = {
        ckb1: { cleanPractice: true, testBestPly: 12 },
        ckb99: { cleanPractice: true, testBestPly: 4 },
        sg1: { cleanPractice: true, testBestPly: 3 },
        "gym-1": { cleanPractice: true, testBestPly: 2 },
      };
      const wiped = migrateProgressLines(stale, 0);
      if (wiped.revision !== CARO_LINE_PROGRESS_REVISION) throw new Error("revision");
      if (wiped.lines.ckb1 || wiped.lines.ckb99) throw new Error("old caro progress kept");
      if (!wiped.lines.sg1 || !wiped.lines["gym-1"]) throw new Error("other progress dropped");
      const kept = migrateProgressLines({ ...wiped.lines, ckb1: stale.ckb1, ckb99: stale.ckb99 }, wiped.revision);
      if (!kept.lines.ckb1) throw new Error("new ckb1 progress dropped");
      if (kept.lines.ckb99) throw new Error("unknown ckb id kept");
      if (!kept.lines.sg1) throw new Error("scotch dropped on the second pass");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
