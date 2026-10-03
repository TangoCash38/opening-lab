import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Chess } from "chess.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const lib = src("src/lib/grandmaster-vision.ts");
const audio = src("src/lib/grandmaster-vision-audio.ts");
const view = src("src/components/opening-lab/grandmaster-vision.tsx");
const page = src("src/routes/grandmaster-vision.tsx");
const menu = src("src/components/opening-lab/landing-menu.tsx");
const landing = src("src/components/opening-lab/home-intro.tsx");
const hero = src("src/components/opening-lab/home-hero.tsx");
const css = src("src/styles.css");

function pieceCount(fen) {
  return fen.split(" ")[0].replace(/[^pnbrqkPNBRQK]/g, "").length;
}

function positions() {
  const body = lib.slice(lib.indexOf("export const POSITIONS"));
  const blocks = body.split(/\{\s*id:/).slice(1);
  return blocks.map((block) => {
    const id = block.match(/^\s*"([^"]+)"/)?.[1];
    const level = Number(block.match(/level:\s*(\d+)/)?.[1]);
    const kind = block.match(/kind:\s*"([^"]+)"/)?.[1];
    const title = block.match(/title:\s*"([^"]+)"/)?.[1];
    const fen = block.match(/fen:\s*"([^"]+)"/)?.[1];
    assert.ok(id && level && kind && title && fen, block.slice(0, 80));
    return { id, level, kind, title, fen };
  });
}

test("every Grandmaster Vision diagram is a legal chess position in its level band", () => {
  const bounds = [
    null,
    [3, 5],
    [6, 10],
    [12, 16],
    [14, 18],
    [16, 21],
    [18, 23],
    [20, 25],
    [22, 27],
    [24, 30],
    [26, 32],
  ];
  const rows = positions();
  assert.ok(rows.length >= 40);
  const ids = new Set();
  for (const row of rows) {
    assert.equal(ids.has(row.id), false, row.id);
    ids.add(row.id);
    const chess = new Chess(row.fen);
    assert.equal(chess.fen().split(" ")[0], row.fen.split(" ")[0]);
    const board = chess.board();
    let whiteKing = null;
    let blackKing = null;
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (!piece || piece.type !== "k") continue;
        if (piece.color === "w") whiteKing = { rank, file };
        else blackKing = { rank, file };
      }
    }
    assert.ok(whiteKing && blackKing, row.id);
    const apart =
      Math.abs(whiteKing.rank - blackKing.rank) > 1 ||
      Math.abs(whiteKing.file - blackKing.file) > 1;
    assert.equal(apart, true, `${row.id} kings touch`);
    const count = pieceCount(row.fen);
    const [min, max] = bounds[row.level];
    assert.ok(count >= min && count <= max, `${row.id} has ${count}, level ${row.level} wants ${min}-${max}`);
  }
  assert.ok(rows.filter((row) => row.level === 1).every((row) => row.kind === "endgame"));
  assert.ok(rows.filter((row) => row.level === 2).every((row) => row.kind === "opening"));
  assert.ok(rows.some((row) => row.level === 3 && row.kind === "endgame"));
  assert.ok(rows.some((row) => row.level === 3 && row.kind === "middlegame"));
  for (let level = 1; level <= 10; level++) {
    assert.ok(rows.filter((row) => row.level === level).length >= 4, `level ${level}`);
  }
});

test("the page is a five-second rebuild with a tray, a shutter, and a score", () => {
  assert.match(page, /createFileRoute\("\/grandmaster-vision"\)/);
  assert.match(page, /Grandmaster Vision · Opening Lab/);
  assert.match(page, /data-surface="website"/);
  assert.match(view, /SNAPSHOT_MS/);
  assert.match(lib, /SNAPSHOT_MS = 5000/);
  assert.match(view, /data-gmv-countdown/);
  assert.match(view, /data-gmv-tray="\{code\}"|data-gmv-tray=\{code\}/);
  assert.match(view, /Submit Board/);
  assert.match(view, /Next Level/);
  assert.match(view, /Try Again/);
  assert.match(view, /data-gmv-accuracy/);
  assert.match(view, /data-gmv-time/);
  assert.match(view, /is-ok/);
  assert.match(view, /is-bad/);
  assert.match(view, /gmv-ghost/);
  assert.match(view, /HIGH_ACCURACY/);
  assert.match(lib, /HIGH_ACCURACY = 80/);
  assert.match(view, /playShutter\(\)/);
  assert.match(view, /playWoodSnap\(\)/);
  assert.match(view, /playVictoryChord\(\)/);
  assert.match(view, /playErrorTone\(\)/);
  assert.match(view, /unlockGrandmasterAudio\(\)/);
  assert.match(audio, /new Ctor\(\)/);
  assert.match(audio, /bandpass/);
  assert.match(audio, /osc\.type = "triangle"/);
  assert.match(audio, /osc\.type = "sine"/);
  assert.doesNotMatch(`${view}\n${audio}\n${page}`, /new Audio\(|\.mp3|\.wav|speechSynthesis/);
  assert.doesNotMatch(`${view}\n${page}\n${lib}`, /Play on/);
  assert.match(view, /\/pieces\/wP\.svg|ChessPiece/);
  assert.match(css, /\.gmv-sq\.is-light/);
  assert.match(css, /\.gmv-sq\.is-dark/);
  assert.match(css, /\.gmv-sq\.is-ok::after/);
  assert.match(css, /\.gmv-sq\.is-bad::after/);
});

test("Grandmaster Vision is a website menu item and stays off the Square Memory hero", () => {
  assert.match(menu, /data-menu-vision/);
  assert.match(menu, /to="\/grandmaster-vision"/);
  assert.match(menu, /Grandmaster Vision/);
  assert.match(menu, /isPlayApp\(\)/);
  assert.match(menu, /setOnWebsite\(!isPlayApp\(\)\)/);
  assert.doesNotMatch(landing, /grandmaster-vision|Grandmaster Vision/);
  assert.doesNotMatch(hero, /grandmaster-vision|Grandmaster Vision/);
  assert.match(landing, /Square Memory game/);
});
