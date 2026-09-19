import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
}

async function loadWarmup(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const raw = src("src/lib/london-warmup.ts")
    .replace(/from "@\/data\/packs"/, 'from "./packs-stub.mjs"')
    .replace(/from "@\/lib\/catalog"/, 'from "./catalog-stub.mjs"')
    .replace(/from "@\/lib\/progress"/, 'from "./progress-stub.mjs"');
  const js = ts.transpileModule(raw, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", ".generated-london-warmup");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "catalog-stub.mjs"),
    "export function isPackVisible() { return true; }\n",
  );
  writeFileSync(join(dir, "packs-stub.mjs"), "export {};\n");
  writeFileSync(join(dir, "progress-stub.mjs"), "export {};\n");
  const tmp = join(dir, "london-warmup.mjs");
  writeFileSync(tmp, js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(tmp).href);
}

function line(id, plies) {
  return { id, name: id, idea: "", plies, side: "b" };
}

function pack(lines) {
  return {
    id: "london-black",
    name: "Fight the London",
    lines,
  };
}

const empty = {
  cleanPractice: false,
  testBestPly: 0,
  lastTrainedAt: null,
  learned: false,
};

test("warmupEndPly caps at book length and never invents plies", async (t) => {
  const mod = await loadWarmup(t);
  if (!mod) return;
  assert.equal(mod.warmupEndPly(0, 20, 3), 3);
  assert.equal(mod.warmupEndPly(8, 10, 3), 10);
  assert.equal(mod.warmupEndPly(0, 2, 3), 2);
  assert.equal(mod.warmupEndPly(4, 4, 3), 4);
});

test("pickLondonWarmup uses alb1 at the start when there is no resume", async (t) => {
  const mod = await loadWarmup(t);
  if (!mod) return;
  const alb1 = line("alb1", ["d4", "d5", "Bf4", "c6", "e3", "Bf5"]);
  const alb2 = line("alb2", ["d4", "d5", "Bf4", "c6"]);
  const picked = mod.pickLondonWarmup(pack([alb1, alb2]), () => empty);
  assert.equal(picked.line.id, "alb1");
  assert.equal(picked.startPly, 0);
  assert.equal(picked.plyLimit, 3);
});

test("pickLondonWarmup resumes next 3 from last unfinished testBestPly", async (t) => {
  const mod = await loadWarmup(t);
  if (!mod) return;
  const alb1 = line("alb1", ["d4", "d5", "Bf4", "c6", "e3", "Bf5", "Nf3", "e6"]);
  const alb2 = line("alb2", ["d4", "d5", "Bf4", "c6"]);
  const progress = {
    alb1: { ...empty, lastTrainedAt: "2026-01-01T00:00:00.000Z", testBestPly: 4 },
    alb2: empty,
  };
  const picked = mod.pickLondonWarmup(pack([alb1, alb2]), (id) => progress[id]);
  assert.equal(picked.line.id, "alb1");
  assert.equal(picked.startPly, 4);
  assert.equal(mod.warmupEndPly(picked.startPly, alb1.plies.length, picked.plyLimit), 7);
});

test("pickLondonWarmup ignores other pack ids and empty packs", async (t) => {
  const mod = await loadWarmup(t);
  if (!mod) return;
  assert.equal(
    mod.pickLondonWarmup({ id: "caro-kann-black", lines: [line("ckb1", ["e4"])] }, () => empty),
    null,
  );
  assert.equal(mod.pickLondonWarmup(pack([]), () => empty), null);
});
