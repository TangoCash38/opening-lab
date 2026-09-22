import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const progressSrc = readFileSync(join(root, "src/lib/progress.ts"), "utf8");

function extractLineTestPercent(src) {
  const start = src.indexOf("export function lineTestPercent");
  assert.ok(start >= 0, "lineTestPercent missing");
  const end = src.indexOf("\nexport ", start + 1);
  const block = end < 0 ? src.slice(start) : src.slice(start, end);
  return block
    .replace(/^export /, "")
    .replace(/: LineProgress/g, "")
    .replace(/: number/g, "")
    .replace(/: number \| null/g, "")
    .replace(/\| null/g, "");
}

const dir = mkdtempSync(join(tmpdir(), "ol-progress-"));
const jsPath = join(dir, "line-test-percent.mjs");
writeFileSync(jsPath, extractLineTestPercent(progressSrc) + "\nexport { lineTestPercent };\n");
const { lineTestPercent } = await import(pathToFileURL(jsPath).href);

const base = {
  timesCompleted: 0,
  lastTrainedAt: null,
  currentStreak: 0,
  bestStreak: 0,
  interval: 0,
  dueAt: null,
  failCount: 0,
  recentFails: [],
  cleanPractice: false,
  learned: false,
  testBestPly: 0,
};

test("lineTestPercent is null until Test has started (testBestPly > 0)", () => {
  assert.equal(lineTestPercent({ ...base, testBestPly: 0 }, 10), null);
  assert.equal(lineTestPercent({ ...base, testBestPly: -1 }, 10), null);
  assert.equal(lineTestPercent({ ...base }, 0), null);
  assert.equal(lineTestPercent({ ...base, testBestPly: 5 }, 0), null);
});

test("lineTestPercent is 100 when cleanPractice even without testBestPly", () => {
  assert.equal(lineTestPercent({ ...base, cleanPractice: true, testBestPly: 0 }, 12), 100);
  assert.equal(lineTestPercent({ ...base, cleanPractice: true, testBestPly: 3 }, 12), 100);
});

test("lineTestPercent mid values round from testBestPly / bookLen; never 100 without cleanPractice", () => {
  assert.equal(lineTestPercent({ ...base, testBestPly: 5 }, 10), 50);
  assert.equal(lineTestPercent({ ...base, testBestPly: 1 }, 8), 13);
  assert.equal(lineTestPercent({ ...base, testBestPly: 8 }, 8), 99);
  assert.equal(lineTestPercent({ ...base, testBestPly: 20 }, 10), 99);
});

test("packCompletePercent is Test reality: 100 when clean, hide a fake 3%, show a real slice", () => {
  const start = progressSrc.indexOf("export function packCompletePercent");
  assert.ok(start >= 0, "packCompletePercent missing");
  const end = progressSrc.indexOf("\nexport ", start + 1);
  const block = progressSrc.slice(start, end < 0 ? undefined : end);
  assert.match(block, /if \(shown <= 0\) return null/);
  assert.match(block, /if \(allClean\) return 100/);
  const bodyAt = block.indexOf("): number | null {");
  assert.ok(bodyAt > 0, "packCompletePercent signature");
  const fn = new Function(
    `function packCompletePercent(lines, progressOf) ${block.slice(bodyAt + "): number | null ".length)}\nreturn packCompletePercent;`,
  )();
  const none = { cleanPractice: false, testBestPly: 0 };
  const clean = { cleanPractice: true, testBestPly: 0 };
  const four = ["a", "b", "c", "d"].map((id) => ({ id, bookLen: 10 }));
  assert.equal(fn([], () => clean), null);
  assert.equal(fn(four, () => none), null);
  assert.equal(fn(four, (id) => (id === "a" ? clean : none)), 25);
  assert.equal(fn(four, () => clean), 100);
  assert.equal(
    fn(four, (id) => (id === "c" ? none : clean)),
    75,
  );

  const scotch = Array.from({ length: 20 }, (_, i) => ({ id: `s${i}`, bookLen: 20 }));
  // One stray ply is 5% of one line, 0.25% of the pack — hide, do not show 3%.
  assert.equal(
    fn(scotch, (id) => (id === "s0" ? { cleanPractice: false, testBestPly: 1 } : none)),
    null,
  );
  // 12/20 plies = 60% of one line → 3% of the pack. Real slice, same number as the bar.
  assert.equal(
    fn(scotch, (id) => (id === "s0" ? { cleanPractice: false, testBestPly: 12 } : none)),
    3,
  );
  assert.equal(fn(scotch, () => clean), 100);

  const traps = Array.from({ length: 11 }, (_, i) => ({ id: `t${i}`, bookLen: 10 }));
  assert.equal(
    fn(traps, (id) => (id === "t0" || id === "t1" ? clean : none)),
    18,
  );
});

test("progress store persists testBestPly via markTestPly without cleanPractice", () => {
  assert.match(progressSrc, /testBestPly: number/);
  assert.match(progressSrc, /testBestPly: 0/);
  assert.match(progressSrc, /testBestPly: Math\.max\(0, Number\(raw\.testBestPly\) \|\| 0\)/);
  assert.match(progressSrc, /export function markTestPly\(lineId: string, plyIndex: number\)/);
  assert.match(
    progressSrc,
    /testBestPly: Math\.max\(prev\.testBestPly, nextPly\)/,
  );
  assert.doesNotMatch(
    progressSrc.slice(progressSrc.indexOf("export function markTestPly")),
    /cleanPractice:\s*true/,
  );
  const markFn = progressSrc.slice(
    progressSrc.indexOf("export function markTestPly"),
    progressSrc.indexOf("export function lineTestPercent"),
  );
  assert.doesNotMatch(markFn, /cleanPractice/);
});
