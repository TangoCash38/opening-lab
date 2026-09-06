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
const css = readFileSync(join(root, "src/styles.css"), "utf8");

test("phone board centering trial markers exist and stay CSS-only", () => {
  assert.match(train, /className="train-layout"/);
  assert.match(train, /className="train-top-chrome"/);
  assert.match(train, /className="train-board-band"/);
  assert.match(train, /className="train-below"/);
  assert.match(train, /train-idea/);
  assert.doesNotMatch(train, /scrollIntoView/);

  assert.match(
    css,
    /\/\* trial: phone-centered board — revert if Sean dislikes \*\//,
  );
  const trialIdx = css.indexOf(
    "/* trial: phone-centered board — revert if Sean dislikes */",
  );
  assert.ok(trialIdx > 0, "trial comment present");
  const trialBlock = css.slice(trialIdx, trialIdx + 1200);
  assert.match(trialBlock, /@media\s*\(max-width:\s*640px\)/);
  assert.match(trialBlock, /\.train-layout/);
  assert.match(trialBlock, /min-height:\s*calc\(100dvh/);
  assert.match(trialBlock, /\.train-board-band/);
  assert.match(trialBlock, /justify-content:\s*center/);
  assert.match(trialBlock, /-webkit-line-clamp:\s*2/);
  // Wide website desktop unchanged — trial is phone-only.
  assert.doesNotMatch(trialBlock, /min-width:\s*960px/);
});
