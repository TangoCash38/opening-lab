import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const train = readFileSync(
  join(root, "src/components/opening-lab/train-view.tsx"),
  "utf8",
);
const board = readFileSync(
  join(root, "src/components/opening-lab/chess-board.tsx"),
  "utf8",
);
const css = readFileSync(join(root, "src/styles.css"), "utf8");

test("Play-on promotion sets pendingPromo instead of auto-queening", () => {
  assert.match(train, /const \[pendingPromo, setPendingPromo\]/);
  assert.match(
    train,
    /if \(playingOn && legalMoves\.some\(\(m\) => m\.to === to && m\.promotion\)\)/,
  );
  assert.match(train, /setPendingPromo\(\{ from, to \}\)/);
  // Hinted promoting moves still require the picker (no auto hint.promotion).
  const promoGate = train.match(
    /if \(playingOn && legalMoves\.some\(\(m\) => m\.to === to && m\.promotion\)\) \{[\s\S]*?return;\s*\}/,
  );
  assert.ok(promoGate, "Play-on promotion gate present");
  assert.match(promoGate[0], /setPendingPromo/);
  assert.doesNotMatch(promoGate[0], /tryPlay\(/);
  assert.doesNotMatch(
    promoGate[0],
    /tryPlay\([^)]*playHint|tryPlay\([^)]*hint\.promotion/,
  );
});

test("ChessBoard receives promotion prop wired to pendingPromo + game.turn()", () => {
  assert.match(board, /promotion\?: PromotionPrompt \| null/);
  assert.match(board, /className="promo-picker"/);
  assert.match(board, /onPick/);

  const promoProp = train.match(
    /promotion=\{\s*pendingPromo\s*\?[\s\S]*?:\s*null\s*\}/,
  );
  assert.ok(promoProp, "promotion prop bound to pendingPromo");
  assert.match(promoProp[0], /color:\s*game\.turn\(\)/);
  assert.doesNotMatch(promoProp[0], /color:\s*line\.side/);
  assert.match(promoProp[0], /onPick:\s*\(piece: PromotionPiece\)\s*=>/);
  assert.match(promoProp[0], /tryPlay\(dest\.from,\s*dest\.to,\s*piece\)/);
  assert.match(promoProp[0], /onCancel:/);
  assert.match(promoProp[0], /setPendingPromo\(null\)/);
});

test("promo-picker is centered inside .board-play above pieces", () => {
  // Picker must be a child of .board-play (not a sibling of .board-frame).
  const play = board.match(
    /className=\{`board-play[\s\S]*?\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>/,
  );
  assert.ok(play, "board-play block present");
  assert.match(play[0], /className="promo-picker"/);
  assert.match(play[0], /pointer-events-none absolute inset-0 z-10/);

  assert.match(css, /\.promo-picker\s*\{[^}]*z-index:\s*40/);
  assert.match(css, /\.promo-picker\s*\{[^}]*pointer-events:\s*auto/);
  assert.match(css, /\.promo-picker-btn\s*\{[^}]*pointer-events:\s*auto/);
});

test("Book Practice/Test stay auto-queen (no pendingPromo outside Play on)", () => {
  // Book path still commits with promotion || exp.promotion || "q".
  assert.match(
    train,
    /promotion:\s*promotion \|\| exp\.promotion \|\| "q"/,
  );
  // pendingPromo is only set inside the playingOn gate.
  const sets = [...train.matchAll(/setPendingPromo\(\{ from, to \}\)/g)];
  assert.equal(sets.length, 1, "only one place opens the promo picker");
  const idx = train.indexOf("setPendingPromo({ from, to })");
  const window = train.slice(Math.max(0, idx - 280), idx);
  assert.match(window, /playingOn/);
});

test("status shows Choose a piece while the promo picker is open", () => {
  assert.match(train, /pendingPromo \? \(\s*t\("Choose a piece"\)/);
  assert.match(train, /setStatus\(\{ text: t\("Choose a piece"\), cls: "" \}\)/);
  const i18n = readFileSync(join(root, "src/lib/i18n.ts"), "utf8");
  assert.match(i18n, /"Choose a piece": "Choose a piece"/);
});

test("Play-on promo picker is history-backed so Back cancels", () => {
  assert.match(train, /useOverlayHistory\(/);
  assert.match(train, /Boolean\(pendingPromo\)/);
  assert.match(train, /"promo"/);
  assert.match(train, /from "@\/hooks\/use-overlay-history"/);
});

