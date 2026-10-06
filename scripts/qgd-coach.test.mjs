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
  const dir = join(root, "scripts", ".generated-qgd-coach");
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
  return "./scripts/.generated-qgd-coach/coach-packs.mjs";
}

test("Queen's Gambit Declined coach is text-only, with no character voice", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  assert.equal(existsSync(join(root, "public/coach/qgd-black")), false);
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const intro = src("src/components/opening-lab/scotch-coach-intro.tsx");
  const coachSrc = src("src/lib/coach-packs.ts");
  const qgdCoach = coachSrc.slice(coachSrc.indexOf("const QGD_BLACK_INTRO"), coachSrc.indexOf("export const COACH_PACKS"));
  assert.doesNotMatch(qgdCoach, /Potato|Big Red|King Cedar|kettle|my loves|mp3|wav/i);
  assert.match(hero, /pack\.id === "qgd-black"/);
  assert.match(hero, /l\.id === "qgdb1"/);
  assert.match(hero, /text-only intro/);
  assert.match(hero, /data-coach-plain=\{coachPack\(pack\.id\)\?\.plain \? "true" : undefined\}/);
  assert.match(hero, /coachPack\(pack\.id\)\?\.plain \? null/);
  assert.match(intro, /data-coach-plain=\{plain \? "true" : undefined\}/);
  assert.match(intro, /plain \? null/);
  assert.match(intro, /textOnly \? null/);
  assert.match(coachSrc, /plain: true/);
  assert.match(coachSrc, /firstLineId: "qgdb1"/);
  assert.match(coachSrc, /lineTalkOnTapOnly: true/);
  assert.doesNotMatch(
    coachSrc.slice(coachSrc.indexOf("[QGD_BLACK_PACK_ID]"), coachSrc.indexOf("[QGD_BLACK_PACK_ID]") + 500),
    /introAudio|firstLineAudio|portrait|coachName/,
  );

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
        coachPackIntroApplies,
        coachPackLineApplies,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
        coachTextPlayedSans,
        isCoachTextOnly,
      } = await import(${JSON.stringify(compiled)});
      const pack = PACKS.find((item) => item.id === "qgd-black");
      if (!pack) throw new Error("qgd pack missing");
      if (pack.side !== "Black") throw new Error("side " + pack.side);
      if (pack.name !== "Queen's Gambit Declined") throw new Error("name " + pack.name);
      if (pack.blurb !== "10 lines from Opening Lab") throw new Error("blurb " + pack.blurb);
      if (pack.lines.length !== 10) throw new Error("lines " + pack.lines.length);
      const qgdb1 = pack.lines.find((item) => item.id === "qgdb1");
      if (!qgdb1 || qgdb1.side !== "b") throw new Error("qgdb1");
      const coach = COACH_PACKS["qgd-black"];
      if (!coach) throw new Error("coach missing");
      if (coach.plain !== true) throw new Error("plain");
      if (coach.coachName) throw new Error("character name " + coach.coachName);
      if (coach.portrait) throw new Error("portrait");
      if (coach.introAudio || coach.firstLineAudio) throw new Error("audio");
      if (coach.introTitle !== "Queen's Gambit Declined") throw new Error("title");
      if (coach.firstLineId !== "qgdb1") throw new Error("first line");
      if (coach.firstLineTitle !== "Orthodox setup") throw new Error("line title");
      if (coach.lineTalkOnTapOnly !== true) throw new Error("tap only");
      if (!isCoachTextOnly("qgd-black", "intro") || !isCoachTextOnly("qgd-black", "line")) {
        throw new Error("expected text-only");
      }
      if (coachTalkHasAudio("qgd-black", "intro") || coachTalkHasAudio("qgd-black", "line")) {
        throw new Error("audio flag");
      }
      if (!coachPackIntroApplies("qgd-black")) throw new Error("intro should apply");
      if (!coachPackLineApplies({ packId: "qgd-black", lineId: "qgdb1" })) throw new Error("qgdb1 talk");
      if (coachPackLineApplies({ packId: "qgd-black", lineId: "qgdb2" })) throw new Error("qgdb2 talk");
      if (coachTalkAfterPackIntro({
        packId: "qgd-black",
        lineId: "qgdb1",
        lineIndex: 0,
        skipped: false,
        lineAlreadySeen: false,
      }) !== null) throw new Error("intro should stay on the line list");
      const played = coachTextPlayedSans(
        coach.firstLineBeats.map((beat) => beat.ply),
        coach.firstLineBeats.length - 1,
      );
      if (played.join(" ") !== qgdb1.plies.join(" ")) {
        throw new Error("script\\n" + played.join(" ") + "\\npack\\n" + qgdb1.plies.join(" "));
      }
      const game = new Chess();
      for (const san of played) {
        if (!game.move(san)) throw new Error("illegal " + san);
      }
      if (game.turn() !== "w") throw new Error("must end on Black");
      const why = coach.firstLineBeats.at(-1).caption;
      if (why !== qgdb1.idea) throw new Error("last caption is not the signed why");
      const introPlies = coachTalkPlies("qgd-black", "intro");
      if (!introPlies || introPlies.some(Boolean)) throw new Error("intro should hold the start position");
      const joined = [...coach.introBeats, ...coach.firstLineBeats.map((beat) => beat.caption)].join("\\n");
      if (/potato|big red|king cedar|my loves|kettle/i.test(joined)) throw new Error("character voice");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
