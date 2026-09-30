import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
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
  const dir = join(root, "scripts", ".generated-sicilian-coach");
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
  return "./scripts/.generated-sicilian-coach/coach-packs.mjs";
}

test("Tango introduces Sicilian for Black; Skip stays on the line list", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
  const mp3 = "public/coach/sicilian-black/tango-sicilian-intro.mp3";
  const oldMp3 = "public/coach/sicilian-black/sicilian-intro.mp3";
  const portrait = "public/coach/sicilian-black/tango-portrait.png";
  assert.equal(existsSync(join(root, mp3)), true, mp3);
  assert.equal(existsSync(join(root, oldMp3)), false, oldMp3);
  assert.ok(statSync(join(root, mp3)).size > 700_000, mp3);
  assert.equal(existsSync(join(root, portrait)), true, portrait);
  assert.ok(statSync(join(root, portrait)).size > 10_000, portrait);

  const coachSrc = src("src/lib/coach-packs.ts");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const catalog = src("src/lib/catalog.ts");
  const packs = src("src/data/packs.ts");
  const pricing = src("src/data/pricing.ts");
  assert.match(
    catalog,
    /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black", "ruy-lopez-white", "sicilian-black"\]/,
  );
  const sib = packs.slice(packs.indexOf('id: "sicilian-black"'), packs.indexOf('id: "sicilian-black"') + 900);
  assert.match(sib, /name: "Sicilian for Black"/);
  assert.match(sib, /price: "£1\.99"/);
  assert.match(sib, /blurb: "10 lines from Opening Lab"/);
  assert.doesNotMatch(sib, /Tango|sicilian-intro/);
  assert.doesNotMatch(pricing, /sicilian-intro|tango-portrait/);
  assert.match(hero, /pack\.id === "sicilian-black"/);
  assert.match(hero, /l\.id === "sib1"/);
  assert.match(hero, /Unpaid visitors still hear Tango/);
  assert.match(hero, /lineTalkOnTapOnly/);
  assert.match(hero, /portrait=\{coachPack\(pack\.id\)\?\.portrait\}/);
  assert.match(hero, /name=\{coachPack\(pack\.id\)\?\.coachName\}/);
  assert.doesNotMatch(hero, /Play on|vs-computer|playComputer/i);

  const start = coachSrc.indexOf("[SICILIAN_BLACK_PACK_ID]");
  assert.ok(start >= 0, "coach entry missing");
  const entry = coachSrc.slice(start, coachSrc.indexOf("};", start));
  assert.match(entry, /coachName: "Tango"/);
  assert.match(entry, /portrait: SICILIAN_PORTRAIT/);
  assert.match(entry, /introTitle: "Tango · Sicilian"/);
  assert.match(entry, /introAudio: SICILIAN_INTRO_MP3/);
  assert.match(entry, /lineTalkOnTapOnly: true/);
  assert.match(entry, /firstLineId: "sib1"/);
  assert.match(entry, /firstLineBeats: \[\]/);
  assert.doesNotMatch(entry, /firstLineAudio/);
  assert.doesNotMatch(entry, /Professor Potato Pie|Big Red/);
  const french = coachSrc.slice(
    coachSrc.indexOf("[FRENCH_BLACK_PACK_ID]"),
    coachSrc.indexOf("[RUY_LOPEZ_WHITE_PACK_ID]"),
  );
  assert.doesNotMatch(french, /Tango|SICILIAN_/);
  const ruy = coachSrc.slice(
    coachSrc.indexOf("[RUY_LOPEZ_WHITE_PACK_ID]"),
    coachSrc.indexOf("[SICILIAN_BLACK_PACK_ID]"),
  );
  assert.match(ruy, /coachName: "Big Red"/);
  assert.doesNotMatch(ruy, /Tango|SICILIAN_/);

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
        SICILIAN_INTRO_MP3,
        SICILIAN_INTRO_SEC,
        SICILIAN_INTRO_STEM,
        SICILIAN_INTRO_STEM_AT_SEC,
        SICILIAN_PORTRAIT,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
      } = await import(${JSON.stringify(compiled)});
      const pack = PACKS.find((item) => item.id === "sicilian-black");
      if (!pack) throw new Error("pack missing");
      if (pack.price !== "£1.99") throw new Error("price " + pack.price);
      if (pack.lines.length !== 10) throw new Error("lines " + pack.lines.length);
      const sib1 = pack.lines.find((item) => item.id === "sib1");
      if (!sib1) throw new Error("sib1");
      if (sib1.plies.slice(0, 4).join(" ") !== "e4 c5 Nf3 d6") throw new Error("book changed " + sib1.plies.slice(0, 4).join(" "));
      const coach = COACH_PACKS["sicilian-black"];
      if (!coach) throw new Error("coach missing");
      if (coach.coachName !== "Tango") throw new Error("name " + coach.coachName);
      if (coach.portrait !== SICILIAN_PORTRAIT) throw new Error("portrait");
      if (coach.portrait !== "/coach/sicilian-black/tango-portrait.png") throw new Error("portrait path");
      if (coach.introAudio !== SICILIAN_INTRO_MP3) throw new Error("audio");
      if (coach.introAudio !== "/coach/sicilian-black/tango-sicilian-intro.mp3") throw new Error("audio path");
      if (coach.introAudio.includes("sicilian-intro.mp3") && !coach.introAudio.endsWith("tango-sicilian-intro.mp3")) {
        throw new Error("old audio path");
      }
      if (coach.introAudioFallbackSec !== SICILIAN_INTRO_SEC || SICILIAN_INTRO_SEC !== 50.21) {
        throw new Error("length " + coach.introAudioFallbackSec);
      }
      if (coach.introTitle !== "Tango · Sicilian") throw new Error("title");
      if (coach.lineTalkOnTapOnly !== true) throw new Error("tap only");
      if (coach.firstLineId !== "sib1") throw new Error("line id");
      if (coach.firstLineBeats.length !== 0) throw new Error("line beats");
      if (coach.firstLineAudio) throw new Error("line audio " + coach.firstLineAudio);
      if (coachTalkHasAudio("sicilian-black", "line")) throw new Error("line clip");
      if (!coachTalkHasAudio("sicilian-black", "intro")) throw new Error("intro clip");
      if (!coachPackIntroApplies("sicilian-black")) throw new Error("intro gate");
      if (coachPackLineApplies({ packId: "sicilian-black", lineId: "sib1" })) throw new Error("sib1 talk");
      if (coachPackLineApplies({ packId: "sicilian-black", lineId: "sib2" })) throw new Error("sib2 talk");
      for (const skipped of [false, true]) {
        const next = coachTalkAfterPackIntro({
          packId: "sicilian-black",
          lineId: "sib1",
          lineIndex: 0,
          skipped,
          lineAlreadySeen: false,
        });
        if (next !== null) throw new Error("handoff " + skipped + " " + next);
      }
      if (coach.introBeats.length !== 6) throw new Error("beats " + coach.introBeats.length);
      const captions = [
        "Right then, the Sicilian Defence for Black.",
        "White starts with 1. e4, claiming the centre.",
        "Black replies 1... c5, striking from the side rather than copying White directly.",
        "The idea is to challenge White's central ambitions, develop actively, and create counterplay from the very beginning.",
        "A common route is 1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nf6.",
        "There you are, a sharp, flexible defence with plenty of bite.",
      ];
      if (coach.introBeats.join("\\n") !== captions.join("\\n")) throw new Error("captions\\n" + coach.introBeats.join("\\n"));
      const spoken = coach.introBeats.join(" ");
      if (/one point|Now let's see|builds the position|Tango/i.test(spoken)) throw new Error("cut or old words");
      if (!spoken.endsWith("plenty of bite.")) throw new Error("closer");
      if (!coach.introBeatAtSec || coach.introBeatAtSec.length !== coach.introBeats.length) throw new Error("beat clock");
      if (coach.introStem.join(" ") !== SICILIAN_INTRO_STEM.join(" ")) throw new Error("stem");
      if (coach.introStem.join(" ") !== "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nf6") throw new Error("spoken stem");
      if (coach.introStemAtSec.join(",") !== SICILIAN_INTRO_STEM_AT_SEC.join(",")) throw new Error("stem clock");
      const game = new Chess();
      for (const san of coach.introStem) {
        if (!game.move(san)) throw new Error("illegal " + san);
      }
      if (coachTalkPlies("sicilian-black", "intro") !== null) throw new Error("intro uses the stem clock");
      if (COACH_PACKS["french-black"].coachName) throw new Error("french name drifted");
      if (COACH_PACKS["french-black"].portrait) throw new Error("french portrait drifted");
      if (COACH_PACKS["ruy-lopez-white"].coachName !== "Big Red") throw new Error("big red");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  if (run.status !== 0) {
    assert.fail(run.stderr || run.stdout || "sicilian coach check failed");
  }
});
