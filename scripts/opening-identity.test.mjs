import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

const identitySrc = src("src/lib/opening-identity.ts");
const dataSrc = src("src/lib/opening-identity-data.ts");
const gymSrc = src("src/lib/gym-line.ts");
const author = src("src/components/opening-lab/create-own-view.tsx");
const train = src("src/components/opening-lab/train-view.tsx");
const packs = src("src/data/packs.ts");
const evalClient = src("src/lib/practice-review-eval.ts");
const evalServer = src("src/lib/practice-review-eval.server.ts");

const ITALIAN_FEN = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3";
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const KINGS_ONLY_FEN = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";

async function loadIdentity(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }

  const dir = join(root, "scripts", ".generated-opening-identity");
  mkdirSync(dir, { recursive: true });
  const opts = {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  };
  writeFileSync(
    join(dir, "opening-identity-data.mjs"),
    ts.transpileModule(dataSrc, opts).outputText,
  );
  const js = ts
    .transpileModule(identitySrc, opts)
    .outputText.replaceAll("./opening-identity-data", "./opening-identity-data.mjs");
  writeFileSync(join(dir, "opening-identity.mjs"), js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(join(dir, "opening-identity.mjs")).href);
}

test("module is a local book helper for Create-your-own authoring identity", () => {
  assert.match(identitySrc, /Local opening book only/);
  assert.match(identitySrc, /Unknown position → null/);
  assert.match(identitySrc, /Create-your-own authoring identity chip/);
  assert.match(identitySrc, /export type OpeningIdentity/);
  assert.match(identitySrc, /export function lookupOpeningIdentity/);
  assert.doesNotMatch(
    identitySrc,
    /lichess\.org|explorer\.lichess|stockfish|from ["']stockfish|WebAssembly|fetch\(/i,
  );
  assert.doesNotMatch(dataSrc, /lichess\.org|explorer\.lichess|stockfish|WebAssembly|fetch\(/i);
  assert.doesNotMatch(identitySrc, /from ["']@\/data\/packs/);
  assert.doesNotMatch(dataSrc, /Italian Game Mastery|My line/);
  assert.doesNotMatch(gymSrc, /lookupOpeningIdentity/);
  assert.match(author, /lookupOpeningIdentityPrefix/);
  assert.match(author, /data-create-own-identity/);
  assert.match(train, /lookupOpeningIdentityPrefix/);
  assert.match(train, /data-create-own-train-identity/);
  assert.doesNotMatch(train, /data-create-own-eval-bar/);
  assert.doesNotMatch(packs, /lookupOpeningIdentity/);
  assert.doesNotMatch(evalClient, /opening-identity/);
  assert.doesNotMatch(evalServer, /opening-identity/);
});

test("known early openings map to name + ECO; clocks do not matter", async (t) => {
  const mod = await loadIdentity(t);
  if (!mod) return;

  assert.deepEqual(mod.lookupOpeningIdentity(ITALIAN_FEN), {
    name: "Italian Game",
    eco: "C50",
  });
  assert.equal(
    mod.formatOpeningIdentity({ name: "Italian Game", eco: "C50" }),
    "Italian Game · C50",
  );

  const italianClockless = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1";
  assert.deepEqual(mod.lookupOpeningIdentity(italianClockless), {
    name: "Italian Game",
    eco: "C50",
  });

  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["e4", "e5", "Nf3", "Nc6", "Bc4"]), {
    name: "Italian Game",
    eco: "C50",
  });
  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["e4", "e5", "Nf3", "Nc6", "Bb5"]), {
    name: "Ruy Lopez",
    eco: "C60",
  });
  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["e4", "e5", "Nf3", "Nf6"]), {
    name: "Petroff Defence",
    eco: "C42",
  });
  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["e4", "c5"]), {
    name: "Sicilian Defence",
    eco: "B20",
  });
  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["e4", "e6"]), {
    name: "French Defence",
    eco: "C00",
  });
  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["e4", "c6"]), {
    name: "Caro-Kann Defence",
    eco: "B10",
  });
  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["d4", "d5", "c4", "e6"]), {
    name: "Queen's Gambit Declined",
    eco: "D30",
  });
  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["c4"]), {
    name: "English Opening",
    eco: "A10",
  });
  assert.deepEqual(
    mod.lookupOpeningIdentityFromPlies(["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4"]),
    { name: "Scotch Game", eco: "C45" },
  );
});

test("deepest book hit wins; unknown and start return null", async (t) => {
  const mod = await loadIdentity(t);
  if (!mod) return;

  assert.equal(mod.lookupOpeningIdentity(START_FEN), null);
  assert.equal(mod.lookupOpeningIdentity(""), null);
  assert.equal(mod.lookupOpeningIdentity("not-a-fen"), null);
  assert.equal(mod.lookupOpeningIdentity(KINGS_ONLY_FEN), null);
  assert.equal(mod.lookupOpeningIdentityFromPlies([]), null);
  assert.equal(mod.lookupOpeningIdentityFromPlies(["e4", "e5", "Nf3", "Nc6", "Bc4", "a5"]), null);
  assert.deepEqual(
    mod.lookupOpeningIdentityPrefix(["e4", "e5", "Nf3", "Nc6", "Bc4", "a5"]),
    { name: "Italian Game", eco: "C50" },
  );
  assert.equal(mod.lookupOpeningIdentityPrefix([]), null);
  assert.equal(mod.lookupOpeningIdentityPrefix(["a3"]), null);
  assert.equal(mod.lookupOpeningIdentityFromPlies(["e4", "zzzz"]), null);

  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"]), {
    name: "Giuoco Piano",
    eco: "C50",
  });
  assert.deepEqual(mod.lookupOpeningIdentityFromPlies(["e4", "e5", "Nf3", "Nc6", "Bc4"]), {
    name: "Italian Game",
    eco: "C50",
  });
});

test("every embedded ECO row is a legal SAN path from the start", async (t) => {
  const mod = await loadIdentity(t);
  if (!mod) return;

  const dir = join(root, "scripts", ".generated-opening-identity");
  const dataMod = await import(pathToFileURL(join(dir, "opening-identity-data.mjs")).href);
  const { Chess } = require("chess.js");
  const book = dataMod.OPENING_IDENTITY_BOOK;
  assert.ok(book.length >= 40, "book should cover a club-sized subset");

  const seen = new Set();
  for (const row of book) {
    const game = new Chess();
    const plies = row.moves.trim().split(/\s+/).filter(Boolean);
    assert.ok(plies.length > 0, `${row.eco} ${row.name} has no moves`);
    for (const san of plies) {
      let played = null;
      try {
        played = game.move(san);
      } catch {
        played = null;
      }
      assert.ok(played, `${row.eco} ${row.name}: illegal ${san} in "${row.moves}"`);
    }
    const key = mod.openingFenKey(game.fen());
    assert.ok(key, `${row.eco} ${row.name} produced no FEN key`);
    seen.add(`${row.eco}|${row.moves}`);
    const hit = mod.lookupOpeningIdentity(game.fen());
    assert.ok(hit, `${row.eco} ${row.name} must look up after its own moves`);
    assert.equal(typeof hit.name, "string");
    assert.equal(typeof hit.eco, "string");
  }
  assert.equal(seen.size, book.length);
});
