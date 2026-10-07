import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Chess } from "chess.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function packBlock(packs, id) {
  const start = packs.indexOf(`id: "${id}"`);
  assert.ok(start >= 0, `${id} missing`);
  const next = packs.indexOf('\n  {\n    id: "', start + 1);
  return next >= 0 ? packs.slice(start, next) : packs.slice(start);
}

function lineBlock(pack, id) {
  const from = pack.indexOf(`id: "${id}"`);
  assert.ok(from >= 0, `${id} missing`);
  const to = pack.indexOf('id: "', from + 10);
  return pack.slice(from, to >= 0 ? to : undefined);
}

function linePlies(pack, id) {
  const line = lineBlock(pack, id);
  const m = line.match(/plies: \[([^\]]+)\]/);
  assert.ok(m, `${id} plies missing`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

const EXPECTED = {
  "rlw1": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Ba4",
    "Nf6",
    "O-O",
    "Be7",
    "Re1",
    "b5",
    "Bb3",
    "d6",
    "c3",
    "O-O",
    "h3",
    "Nb8",
    "d4",
    "Nbd7",
    "Nbd2",
    "Bb7",
    "Bc2",
    "Re8",
    "Nf1"
  ],
  "rlw2": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Ba4",
    "Nf6",
    "O-O",
    "b5",
    "Bb3",
    "Bb7",
    "d3",
    "Be7",
    "a4",
    "O-O",
    "Re1",
    "d6",
    "Nbd2",
    "Na5",
    "Ba2"
  ],
  "rlw3": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "Nf6",
    "O-O",
    "Nxe4",
    "d4",
    "Nd6",
    "Bxc6",
    "dxc6",
    "dxe5",
    "Nf5",
    "Qxd8+",
    "Kxd8",
    "Nc3",
    "Ke8",
    "h3",
    "Be6",
    "Rd1",
    "Be7",
    "Ne4"
  ],
  "rlw4": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Ba4",
    "Nf6",
    "O-O",
    "Nxe4",
    "d4",
    "b5",
    "Bb3",
    "d5",
    "dxe5",
    "Be6",
    "c3",
    "Bc5",
    "Nbd2",
    "O-O",
    "Bc2",
    "Nxd2",
    "Qxd2"
  ],
  "rlw5": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Bxc6",
    "dxc6",
    "O-O",
    "f6",
    "d4",
    "Bg4",
    "dxe5",
    "Qxd1",
    "Rxd1",
    "fxe5",
    "Rd3",
    "Bd6",
    "Nbd2",
    "Nf6",
    "Nc4"
  ],
  "rlw6": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "f5",
    "Nc3",
    "fxe4",
    "Nxe4",
    "Nf6",
    "Qe2",
    "d5",
    "Nxf6+",
    "gxf6",
    "d4",
    "Bg7",
    "dxe5",
    "O-O",
    "Bxc6",
    "bxc6",
    "O-O"
  ],
  "rlw7": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "Bc5",
    "c3",
    "Nf6",
    "O-O",
    "O-O",
    "d4",
    "Bb6",
    "dxe5",
    "Nxe4",
    "Qd5",
    "Nc5",
    "Bg5",
    "Ne7",
    "Qd1"
  ],
  "rlw8": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "d6",
    "d4",
    "Bd7",
    "Nc3",
    "Nf6",
    "O-O",
    "Be7",
    "Re1",
    "exd4",
    "Nxd4",
    "O-O",
    "Bf1",
    "Re8",
    "Nf3"
  ],
  "rlw9": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "Nd4",
    "Nxd4",
    "exd4",
    "O-O",
    "c6",
    "Bc4",
    "Nf6",
    "Re1",
    "d6",
    "c3",
    "Be7",
    "cxd4",
    "O-O",
    "Nc3"
  ],
  "rlw10": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Ba4",
    "Nf6",
    "O-O",
    "Be7",
    "Re1",
    "b5",
    "Bb3",
    "O-O",
    "c3",
    "d5",
    "exd5",
    "Nxd5",
    "Nxe5",
    "Nxe5",
    "Rxe5",
    "c6",
    "d4",
    "Bd6",
    "Re1",
    "Qh4",
    "g3",
    "Qh3",
    "Be3",
    "Bg4",
    "Qd3",
    "Rae8",
    "Nbd2"
  ]
};

const NAMES = {
  "rlw1": "Line 1",
  "rlw2": "Line 2",
  "rlw3": "Line 3",
  "rlw4": "Line 4",
  "rlw5": "Line 5",
  "rlw6": "Line 6",
  "rlw7": "Line 7",
  "rlw8": "Line 8",
  "rlw9": "Line 9",
  "rlw10": "Line 10"
};

const LIVE = '["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black", "ruy-lopez-white", "sicilian-black", "qgd-black", "slav-defence"]';

test("Ruy Lopez for White is the signed ruy-lopez-white pack: rlw1–rlw10 book, £1.99, locked until purchase", () => {
  const packs = src("src/data/packs.ts");
  const catalog = src("src/lib/catalog.ts");
  const skus = src("src/lib/play-skus.ts");
  const intro = src("src/lib/pack-intro.ts");
  const billing = src("android/app/src/main/java/uk/co/openinglab/PlayBilling.java");
  const rlw = packBlock(packs, "ruy-lopez-white");

  assert.match(rlw, /name: "Ruy Lopez for White"/);
  assert.match(rlw, /side: "White"/);
  assert.match(rlw, /section: "white"/);
  assert.match(rlw, /isFree: false/);
  assert.match(rlw, /isPremium: true/);
  assert.match(rlw, /price: "£1\.99"/);
  assert.match(rlw, /blurb: "10 lines from Opening Lab"/);
  assert.match(rlw, /10 lines from Opening Lab/);
  assert.match(rlw, /Practice the book moves with the green hint/);
  assert.match(rlw, /Then Test with none to prove you remember them/);
  assert.match(rlw, /eco: "C60–C99"/);
  assert.doesNotMatch(rlw, /5 book/);
  assert.doesNotMatch(rlw, /punish/i);
  assert.doesNotMatch(rlw, /Play on/);
  assert.doesNotMatch(rlw, /vs computer|versus the computer/i);
  assert.doesNotMatch(rlw, /trap:\s*true/);
  assert.doesNotMatch(rlw, /id: "rlw11"/);

  assert.match(catalog, /"ruy-lopez-white"/);
  assert.match(catalog, new RegExp("LIVE_PACK_IDS = " + LIVE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const sampleBlock = catalog.slice(
    catalog.indexOf("FREE_SAMPLE_LINE_IDS"),
    catalog.indexOf("export function playableLines"),
  );
  assert.doesNotMatch(sampleBlock, /ruy-lopez-white/);

  const playList = skus.slice(
    skus.indexOf("PLAY_PATH_B_PACK_IDS"),
    skus.indexOf("export type PlayProduct"),
  );
  assert.equal(playList.includes('"ruy-lopez-white"'), false);

  const pathB = billing.slice(
    billing.indexOf("PATH_B_PACK_IDS"),
    billing.indexOf("LIVE_SALE_PACK_IDS"),
  );
  const liveSale = billing.slice(
    billing.indexOf("LIVE_SALE_PACK_IDS"),
    billing.indexOf("private static final Set"),
  );
  assert.equal(pathB.includes('"ruy-lopez-white"'), false);
  assert.equal(liveSale.includes('"ruy-lopez-white"'), false);

  const opening = intro.slice(intro.indexOf('"ruy-lopez-white"'), intro.indexOf("};"));
  assert.match(opening, /10 lines from Opening Lab\. Practice with the green hint, then Test with none\./);
  assert.doesNotMatch(opening, /punish/i);
  assert.doesNotMatch(opening, /5 book/);

  const lineIds = [...rlw.matchAll(/id: "(rlw\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, Object.keys(EXPECTED));

  const sides = [...rlw.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.equal(sides.length, 10);
  assert.ok(sides.every((s) => s === "w"), "every line side must be w");

  const names = Object.fromEntries(
    [...rlw.matchAll(/id: "(rlw\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );

  for (const id of lineIds) {
    const plies = linePlies(rlw, id);
    assert.deepEqual(plies, EXPECTED[id], id);
    assert.equal(names[id], NAMES[id], id);
    assert.match(names[id], /^Line \d+$/);
    assert.equal(plies.length % 2, 1, `${id} must end after a White move`);
    assert.equal(lineBlock(rlw, id).includes('side: "w"'), true);
    const idea = lineBlock(rlw, id).match(/idea: "([^"]+)"/);
    assert.ok(idea && idea[1].trim().length > 0, `${id} idea`);
    const game = new Chess();
    for (const san of plies) {
      const moved = game.move(san);
      assert.ok(moved, `${id} illegal SAN ${san}`);
    }
    assert.equal(game.turn(), "b", `${id} must end after White`);
  }

  const allPlies = lineIds.map((id) => ({ id, plies: linePlies(rlw, id) }));
  for (let i = 0; i < allPlies.length; i++) {
    for (let j = 0; j < allPlies.length; j++) {
      if (i === j) continue;
      const a = allPlies[i].plies;
      const b = allPlies[j].plies;
      if (a.length < b.length && a.every((p, k) => p === b[k])) {
        assert.fail(`${allPlies[i].id} is a ply-prefix of ${allPlies[j].id}`);
      }
    }
  }
});

test("Big Red introduces Ruy Lopez for White; Potato Pie stays the other packs' portrait", () => {
  const coach = src("src/lib/coach-packs.ts");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const figure = src("src/components/opening-lab/scotch-coach-intro.tsx");
  const wav = "public/coach/ruy-lopez-white/big-red-ruy-intro.wav";
  const lineWav = "public/coach/ruy-lopez-white/big-red-ruy-line1.wav";
  const portrait = "public/coach/ruy-lopez-white/big-red-portrait.png";
  assert.equal(existsSync(join(root, wav)), true, wav);
  assert.ok(statSync(join(root, wav)).size > 10_000, wav);
  assert.equal(existsSync(join(root, lineWav)), true, lineWav);
  assert.ok(statSync(join(root, lineWav)).size > 10_000, lineWav);
  assert.equal(existsSync(join(root, portrait)), true, portrait);

  const start = coach.indexOf('[RUY_LOPEZ_WHITE_PACK_ID]');
  assert.ok(start >= 0, "coach entry missing");
  const entry = coach.slice(start, coach.indexOf("};", start));
  assert.match(entry, /coachName: "Big Red"/);
  assert.match(entry, /portrait: RUY_LOPEZ_PORTRAIT/);
  assert.match(entry, /introTitle: "Big Red · Ruy Lopez"/);
  assert.match(entry, /introAudio: RUY_LOPEZ_INTRO_WAV/);
  assert.match(entry, /introAudioFallbackSec: RUY_LOPEZ_INTRO_SEC/);
  assert.match(entry, /firstLineId: "rlw1"/);
  assert.match(entry, /firstLineTitle: "Line 1"/);
  assert.match(entry, /lineTalkOnTapOnly: true/);
  assert.match(entry, /firstLineBeats: RUY_LOPEZ_LINE/);
  assert.match(entry, /firstLineAudio: RUY_LOPEZ_LINE_WAV/);
  assert.match(entry, /firstLineAudioFallbackSec: RUY_LOPEZ_LINE_SEC/);
  assert.match(coach, /RUY_LOPEZ_LINE_WAV = "\/coach\/ruy-lopez-white\/big-red-ruy-line1\.wav"/);
  assert.match(coach, /RUY_LOPEZ_LINE_SEC = 181\.12/);
  assert.match(coach, /RUY_LOPEZ_INTRO_SEC = 82\.84/);
  assert.match(coach, /RUY_LOPEZ_INTRO_STEM = \["e4", "e5", "Nf3", "Nc6", "Bb5"\]/);
  assert.match(coach, /RUY_LOPEZ_PORTRAIT = "\/coach\/ruy-lopez-white\/big-red-portrait\.png"/);
  assert.match(coach, /RUY_LOPEZ_INTRO_WAV = "\/coach\/ruy-lopez-white\/big-red-ruy-intro\.wav"/);
  assert.match(coach, /Big Red will see you round/);
  assert.doesNotMatch(entry, /Professor Potato Pie/);
  assert.match(hero, /pack\.id === "ruy-lopez-white"/);
  assert.match(hero, /l\.id === "rlw1"/);
  assert.match(hero, /lineTalkOnTapOnly/);
  assert.match(hero, /hearsLineTalk/);
  assert.match(hero, /portrait=\{coachPack\(pack\.id\)\?\.portrait\}/);
  assert.doesNotMatch(hero, /Play on|vs-computer|playComputer/i);
  assert.match(figure, /portrait \?\? "\/scotch-coach\/coach-seated-v2\.png"/);
  assert.match(figure, /name \?\? SCOTCH_COACH_NAME/);
  assert.match(coach, /opening-lab:coach-intro:\$\{packId\}/);
});

function compileCoachPacks(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const dir = join(root, "scripts", ".generated-ruy-line");
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
  return "./scripts/.generated-ruy-line/coach-packs.mjs";
}

test("Ruy Lopez Line 1 audio plays the Closed Breyer on an rlw1 tap, not after the intro", (t) => {
  const compiled = compileCoachPacks(t);
  if (!compiled) return;
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
        RUY_LOPEZ_INTRO_SEC,
        RUY_LOPEZ_INTRO_WAV,
        RUY_LOPEZ_LINE_SEC,
        RUY_LOPEZ_LINE_WAV,
        RUY_LOPEZ_PORTRAIT,
        coachAudioPlyCount,
        coachLinePlyCues,
        coachPackLineApplies,
        coachTalkAfterPackIntro,
        coachTalkHasAudio,
        coachTalkPlies,
        coachTextPlayedSans,
      } = await import(${JSON.stringify(compiled)});
      const pack = PACKS.find((item) => item.id === "ruy-lopez-white");
      const rlw1 = pack.lines.find((item) => item.id === "rlw1");
      const san = "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7 Nbd2 Bb7 Bc2 Re8 Nf1";
      if (rlw1.plies.join(" ") !== san) throw new Error("rlw1 book " + rlw1.plies.join(" "));
      const coach = COACH_PACKS["ruy-lopez-white"];
      if (coach.coachName !== "Big Red") throw new Error("name");
      if (coach.portrait !== RUY_LOPEZ_PORTRAIT) throw new Error("portrait");
      if (coach.introAudio !== RUY_LOPEZ_INTRO_WAV) throw new Error("intro moved");
      if (coach.introAudioFallbackSec !== RUY_LOPEZ_INTRO_SEC || RUY_LOPEZ_INTRO_SEC !== 82.84) {
        throw new Error("intro length");
      }
      if (!coach.introBeats[0].startsWith("Right there my loves")) throw new Error("intro open");
      if (!coach.introBeats.at(-1).includes("Big Red will see you round")) throw new Error("intro close");
      if (coach.lineTalkOnTapOnly !== true) throw new Error("tap only");
      if (coach.firstLineAudio !== RUY_LOPEZ_LINE_WAV) throw new Error("line audio " + coach.firstLineAudio);
      if (coach.firstLineAudio !== "/coach/ruy-lopez-white/big-red-ruy-line1.wav") throw new Error("line path");
      if (coach.firstLineAudioFallbackSec !== RUY_LOPEZ_LINE_SEC || RUY_LOPEZ_LINE_SEC !== 181.12) {
        throw new Error("line length " + coach.firstLineAudioFallbackSec);
      }
      if (!coachTalkHasAudio("ruy-lopez-white", "line")) throw new Error("line audio missing");
      if (!coachTalkHasAudio("ruy-lopez-white", "intro")) throw new Error("intro audio missing");
      if (coach.firstLineBeats.length !== 24) throw new Error("beats " + coach.firstLineBeats.length);
      if (!coach.firstLineBeats[0].caption.includes("Morphy Defense Closed Breyer")) throw new Error("open");
      if (coach.firstLineBeats.at(-1).caption !== "your way around London.") throw new Error("close");
      const plan = coach.firstLineBeats.find((beat) => beat.caption.startsWith("preparing the grand central advance"));
      if (!plan || plan.ply !== "O-O" || plan.extraPlies.map((move) => move.ply).join(" ") !== "h3") {
        throw new Error("early d4 must stay plan-talk " + JSON.stringify(plan));
      }
      const strike = coach.firstLineBeats.find((beat) => beat.ply === "d4");
      if (!strike || strike.plyAtSec !== 100.12) throw new Error("d4 cue " + strike?.plyAtSec);
      if (strike.atSec <= plan.atSec) throw new Error("d4 spoken before the plan caption");
      for (const input of [
        { packId: "ruy-lopez-white", lineId: "rlw1", lineIndex: 0, skipped: false, lineAlreadySeen: false },
        { packId: "ruy-lopez-white", lineId: "rlw1", lineIndex: 0, skipped: true, lineAlreadySeen: false },
      ]) {
        if (coachTalkAfterPackIntro(input) !== null) throw new Error("intro handed off " + input.skipped);
      }
      if (!coachPackLineApplies({ packId: "ruy-lopez-white", lineId: "rlw1" })) throw new Error("rlw1 tap");
      if (coachPackLineApplies({ packId: "ruy-lopez-white", lineId: "rlw2" })) throw new Error("rlw2 talk");
      const cues = coachLinePlyCues("ruy-lopez-white");
      const expected = [19.1, 21.96, 23.32, 27.2, 29.78, 34.94, 42.42, 44.68, 46.72, 49.58, 51.48, 59.16, 61.42, 63.34, 68.1, 73.7, 76.52, 89.16, 100.12, 106.62, 115.44, 118.2, 121.94, 129.48, 135.86];
      if (!cues || cues.join(",") !== expected.join(",")) throw new Error("cues " + cues);
      const dur = 181.12;
      for (let i = 0; i < cues.length; i += 1) {
        if (i > 0 && !(cues[i] > cues[i - 1])) throw new Error("cue order " + i);
        if (coachAudioPlyCount(cues, cues[i] - 0.01, dur, dur) !== i) throw new Error("early " + i);
        if (coachAudioPlyCount(cues, cues[i], dur, dur) !== i + 1) throw new Error("late " + i);
      }
      if (coachAudioPlyCount(cues, 69, dur, dur) !== 15) throw new Error("plan-talk moved d4");
      if (coachAudioPlyCount(cues, 100.11, dur, dur) !== 18) throw new Error("d4 early");
      if (coachAudioPlyCount(cues, 100.12, dur, dur) !== 19) throw new Error("d4 late");
      const script = coachTalkPlies("ruy-lopez-white", "line");
      const played = coachTextPlayedSans(script, script.length - 1);
      if (played.join(" ") !== san) throw new Error("script " + played.join(" "));
      const game = new Chess();
      for (const move of played) {
        if (!game.move(move)) throw new Error("illegal " + move);
      }
      if (game.history().join(" ") !== san) throw new Error("history");
      if (game.get("f1")?.type !== "n" || game.get("f1")?.color !== "w") throw new Error("Nf1");
      if (game.get("d7")?.type !== "n" || game.get("d7")?.color !== "b") throw new Error("Nbd7");
      if (game.get("b8")) throw new Error("knight still on b8");
      if (game.get("d4")?.type !== "p" || game.get("d4")?.color !== "w") throw new Error("d4");
      if (game.get("b7")?.type !== "b" || game.get("c2")?.type !== "b") throw new Error("bishops");
      if (game.get("e8")?.type !== "r" || game.get("e8")?.color !== "b") throw new Error("Re8");
      const beforeD4 = new Chess();
      for (const move of played.slice(0, 18)) beforeD4.move(move);
      if (beforeD4.get("d2")?.type !== "p" || beforeD4.get("d4")) throw new Error("d-pawn moved during plan-talk");
      if (beforeD4.get("b8")?.type !== "n") throw new Error("Nb8 missing before d4");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
