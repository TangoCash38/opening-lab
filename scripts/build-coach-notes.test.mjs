import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("purpose-square exemptions in the coach note checker", () => {
  const py = spawnSync("python3", ["scripts/build-coach-notes.test.py"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(py.status, 0, `${py.stdout}\n${py.stderr}`);
});
