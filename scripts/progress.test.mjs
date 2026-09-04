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
