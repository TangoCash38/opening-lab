import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "src/components/opening-lab/pack-lines.tsx"),
  "utf8",
);

test("locked lines are red, unfinished are natural, Test-passed are green", () => {
  assert.match(src, /border-danger bg-danger-soft text-fg/);
  assert.match(src, /bg-danger text-white/);
  assert.match(src, /border-success\/35 bg-success-soft\/55/);
  assert.match(src, /border-border bg-bg-elevated active:scale-\[0\.99\]/);
  assert.match(src, /bg-bg-subtle text-fg/);
  assert.doesNotMatch(src, /red until a clean Test/);
});
