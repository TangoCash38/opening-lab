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
const modal = readFileSync(
  join(root, "src/components/opening-lab/line-result-modal.tsx"),
  "utf8",
);

test("wrong-move popup names the book SAN only", () => {
  assert.match(train, /The book move is \$\{exp\.san\}/);
  assert.match(train, /kind: "wrong"/);
  assert.doesNotMatch(train, /because the engine/);
});

test("end-of-line popup uses the catalog idea, not new theory", () => {
  assert.match(train, /body: \(line\.idea \?\? ""\)\.trim\(\)/);
  assert.match(train, /kind: "end"/);
  assert.match(modal, /data-result-kind/);
  assert.match(modal, /z-\[80\]/);
});
