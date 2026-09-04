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

test("trainer has Expand that opens a full-screen board overlay", () => {
  assert.match(train, /Expand/);
  assert.match(train, /boardExpanded/);
  assert.match(train, /board-fs-overlay/);
  assert.match(train, /Close full screen/);
  assert.match(train, /Escape/);
  assert.doesNotMatch(train, /BoardThemePicker/);
  assert.doesNotMatch(train, /board-theme-picker/);
  assert.match(board, /expanded\?: boolean/);
  assert.match(css, /\.board-fs-overlay/);
  assert.match(css, /position: fixed/);
});

test("finish popup keeps Expand; Test yourself stays expanded", () => {
  // Finish sheet is fixed overlay — no scrollIntoView / pad when resultCard opens.
  assert.doesNotMatch(train, /boardWrapRef/);
  assert.doesNotMatch(train, /scrollIntoView/);
  assert.doesNotMatch(train, /train-result-pad/);

  const expandEsc = train.match(
    /useEffect\(\(\) => \{\s*if \(!boardExpanded\) return;[\s\S]*?\}, \[boardExpanded, resultCard\]\);/,
  );
  assert.ok(expandEsc, "board Expand Escape effect present");
  assert.match(expandEsc[0], /if \(resultCard\) return/);

  const resetLine = train.match(
    /const resetLine = useCallback\(\s*\(nextMode\?: Mode\) => \{[\s\S]*?\},\s*\[[^\]]*\]\s*\);/,
  );
  assert.ok(resetLine, "resetLine present");
  assert.doesNotMatch(resetLine[0], /setBoardExpanded/);

  assert.match(
    train,
    /resultCard\.nextAction === "testYourself"[\s\S]*?changeMode\("practice"\)/,
  );
  assert.match(train, /boardExpanded=\{boardExpanded\}/);
  assert.match(css, /\.line-result-dim--board-fs/);
});

test("expanded overlay shows Practice/Test and Reset without collapsing Expand", () => {
  assert.match(train, /board-fs-modes/);
  assert.match(train, /board-fs-actions/);
  assert.match(train, /board-fs-action/);
  // Mode tabs appear inside the fullscreen overlay chrome
  const fsModes = train.match(
    /board-fs-modes[\s\S]*?Practice[\s\S]*?Test[\s\S]*?board-fs-hint/,
  );
  assert.ok(fsModes, "Practice/Test ModeTabs inside board-fs overlay");
  assert.match(fsModes[0], /changeMode\("learn"\)/);
  assert.match(fsModes[0], /changeMode\("practice"\)/);
  assert.match(train, /board-fs-actions[\s\S]*?Reset[\s\S]*?stepBack/);
  // changeMode / resetLine must leave boardExpanded alone
  const changeMode = train.match(/const changeMode = \(m: Mode\) => \{[\s\S]*?\};/);
  assert.ok(changeMode);
  assert.doesNotMatch(changeMode[0], /setBoardExpanded/);
  assert.match(css, /\.board-fs-modes/);
  assert.match(css, /\.board-fs-actions/);
  assert.match(css, /calc\(100dvh - 13\.5rem\)/);
  // Close is absolute; overlay packs from the top so modes sit under Close (no cream band).
  assert.match(css, /\.board-fs-overlay\s*\{[\s\S]*?justify-content:\s*flex-start/);
  assert.match(css, /\.board-fs-overlay\s*\{[\s\S]*?padding-top:\s*max\(3\.55rem/);
});
