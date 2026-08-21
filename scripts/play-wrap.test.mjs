import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Play wrap gate ignores website Stripe packs and website Lab+", () => {
  const unlocks = src("src/lib/unlocks.ts");
  assert.match(unlocks, /isPlayApp\(\)/);
  assert.match(unlocks, /isPlayBilledLabPlusActive/);
  assert.match(unlocks, /playBilled/);

  const hook = src("src/hooks/use-unlocks.ts");
  assert.match(hook, /playWrapAccountUnlocks/);
  assert.match(hook, /isPlayBilledLabPlusActive\(state\)/);

  const play = src("src/lib/play-app.ts");
  assert.match(play, /OpeningLabPlay/);
  assert.match(play, /export function playWrapAccountUnlocks/);
  assert.doesNotMatch(play, /sold on the website/i);
  assert.doesNotMatch(play, /stay on the website/i);
});

test("Play-wrap copy does not send users to buy packs on the website", () => {
  const files = [
    "src/lib/play-app.ts",
    "src/components/opening-lab/unlock-modal.tsx",
    "src/components/opening-lab/subscribe-modal.tsx",
    "src/components/opening-lab/pack-list.tsx",
    "src/routes/terms.tsx",
  ];
  for (const rel of files) {
    const text = src(rel);
    assert.doesNotMatch(text, /sold on the website/i, rel);
    assert.doesNotMatch(text, /buy on the website/i, rel);
    assert.doesNotMatch(text, /Find the crush/i, rel);
  }
});
