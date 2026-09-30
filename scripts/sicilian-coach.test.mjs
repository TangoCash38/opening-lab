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
  const lineMp3 = "public/coach/sicilian-black/tango-sicilian-line1.mp3";
  const oldMp3 = "public/coach/sicilian-black/sicilian-intro.mp3";
  const portrait = "public/coach/sicilian-black/tango-portrait.png";
  assert.equal(existsSync(join(root, mp3)), true, mp3);
  assert.equal(existsSync(join(root, lineMp3)), true, lineMp3);
  assert.equal(existsSync(join(root, oldMp3)), false, oldMp3);
  assert.ok(statSync(join(root, mp3)).size > 700_000, mp3);
  assert.equal(statSync(join(root, lineMp3)).size, 2_293_292, lineMp3);
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
  assert.match(entry, /firstLineBeats: SICILIAN_LINE/);
  assert.match(entry, /firstLineAudio: SICILIAN_LINE_MP3/);
  assert.match(entry, /firstLineAudioFallbackSec: SICILIAN_LINE_SEC/);
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
        SICILIAN_LINE_MP3,
        SICILIAN_LINE_SEC,
        coachAudioPlyCount,
        coachLinePlyCues,
        coachPackIntroApplies,
        coachPackLineApplies,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
        coachTextPlayedSans,
      } = await import(${JSON.stringify(compiled)});
      const pack = PACKS.find((item) => item.id === "sicilian-black");
      if (!pack) throw new Error("pack missing");
      if (pack.price !== "£1.99") throw new Error("price " + pack.price);
      if (pack.lines.length !== 10) throw new Error("lines " + pack.lines.length);
      const sib1 = pack.lines.find((item) => item.id === "sib1");
      if (!sib1) throw new Error("sib1");
      const book = "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7 g4 b5";
      if (sib1.plies.join(" ") !== book) throw new Error("book changed " + sib1.plies.join(" "));
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
      if (coach.firstLineAudio !== SICILIAN_LINE_MP3) throw new Error("line audio " + coach.firstLineAudio);
      if (coach.firstLineAudio !== "/coach/sicilian-black/tango-sicilian-line1.mp3") throw new Error("line path");
      if (coach.firstLineAudio === coach.introAudio) throw new Error("line reuses intro");
      if (coach.firstLineAudioFallbackSec !== SICILIAN_LINE_SEC || SICILIAN_LINE_SEC !== 143.3) {
        throw new Error("line length " + coach.firstLineAudioFallbackSec);
      }
      if (!coachTalkHasAudio("sicilian-black", "line")) throw new Error("line clip");
      if (!coachTalkHasAudio("sicilian-black", "intro")) throw new Error("intro clip");
      if (!coachPackIntroApplies("sicilian-black")) throw new Error("intro gate");
      if (!coachPackLineApplies({ packId: "sicilian-black", lineId: "sib1" })) throw new Error("sib1 talk");
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
      const lineCaps = [
        "Right then, welcome to Line 1 of the Sicilian, the Najdorf.",
        "This is one of Black's most ambitious answers to pawn to e4.",
        "White opens with pawn to e4, and Black immediately strikes with pawn to c5.",
        "White develops knight to f3.",
        "Black plays pawn to d6, and White opens the centre with pawn to d4.",
        "Black takes on d4 with the c-pawn, White recaptures with knight takes d4.",
        "Black develops knight to f6, and White brings the other knight to c3.",
        "Now comes the famous Najdorf move, pawn to a6, a flexible little move with a great deal of venom behind it.",
        "Black keeps the position adaptable and prepares to expand on the queenside.",
        "The first part of the line is pawn to e4, pawn to c5, knight to f3, pawn to d6, pawn to d4, pawn takes d4, knight takes d4, knight to f6, knight to c3, pawn to a6, bishop to e3, pawn to e5, knight to b3, bishop to e6.",
        "Now the line continues, pawn to f3, bishop to e7, queen to d2, castle kingside, castle queenside, knight to bd7, pawn to g4, pawn to b5.",
        "White prepares a kingside assault with pawn to f3.",
        "Black calmly develops bishop to e7, then White brings the queen to d2.",
        "Black castles kingside and White castles queenside.",
        "Now the battle lines are drawn.",
        "Black develops knight to bd7 and White begins the famous pawn storm with pawn to g4.",
        "Black answers with pawn to b5 and there it is, the Najdorf has burst into life.",
        "White is gathering forces on the kingside, Black is charging down the queenside, and both players are preparing something rather dangerous.",
        "Right then, follow the moves closely, keep your wits about you and enjoy this cracking Sicilian line.",
      ];
      if (coach.firstLineBeats.length !== lineCaps.length) throw new Error("line beats " + coach.firstLineBeats.length);
      if (coach.firstLineBeats.map((beat) => beat.caption).join("\\n") !== lineCaps.join("\\n")) {
        throw new Error("line captions\\n" + coach.firstLineBeats.map((beat) => beat.caption).join("\\n"));
      }
      const lineSpoken = lineCaps.join(" ");
      if (/Nade Off|Nade-Off|learning pack|Tango/i.test(lineSpoken)) throw new Error("hearing leftover");
      if (!lineSpoken.includes("Najdorf")) throw new Error("najdorf name");
      if (!lineCaps[7].includes("pawn to a6") || lineCaps[7].includes("e6")) throw new Error("famous pawn");
      const recapBeforeBishop = lineCaps[9].slice(0, lineCaps[9].indexOf("bishop to e3"));
      if (!recapBeforeBishop.includes("pawn to a6") || recapBeforeBishop.includes("e6")) throw new Error("recap pawn");
      if (!lineCaps[9].includes("bishop to e6")) throw new Error("later e6");
      const lineScript = coachTalkPlies("sicilian-black", "line");
      if (!lineScript) throw new Error("line script");
      const played = coachTextPlayedSans(lineScript, lineScript.length - 1);
      if (played.join(" ") !== book) throw new Error("script " + played.join(" "));
      const najdorf = new Chess();
      for (const san of played) {
        if (!najdorf.move(san)) throw new Error("illegal line ply " + san);
      }
      if (najdorf.history().join(" ") !== book) throw new Error("history drifted");
      const lineCues = coachLinePlyCues("sicilian-black");
      if (!lineCues || lineCues.length !== played.length) throw new Error("cues " + lineCues);
      for (let i = 0; i < lineCues.length; i += 1) {
        if (i > 0 && !(lineCues[i] > lineCues[i - 1])) throw new Error("cue order " + i);
        if (lineCues[i] >= SICILIAN_LINE_SEC) throw new Error("cue past end " + i);
        if (coachAudioPlyCount(lineCues, lineCues[i] - 0.01, SICILIAN_LINE_SEC, SICILIAN_LINE_SEC) !== i) {
          throw new Error("ply early " + i);
        }
        if (coachAudioPlyCount(lineCues, lineCues[i], SICILIAN_LINE_SEC, SICILIAN_LINE_SEC) !== i + 1) {
          throw new Error("ply late " + i);
        }
      }
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
