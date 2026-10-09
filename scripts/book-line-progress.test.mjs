import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("changed book lines drop saved progress once and leave other lines", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
      const { migrateBookLineProgress, BOOK_LINE_PROGRESS_REVISION } = await import("./src/lib/progress.ts");
      const stale = {
        sg1: { testBestPly: 8, cleanPractice: false },
        sg2: { testBestPly: 4, cleanPractice: false },
        sg8: { testBestPly: 12, cleanPractice: true },
        peb2: { testBestPly: 8, cleanPractice: false },
        kidb2: { testBestPly: 13, cleanPractice: false },
        ckb7: { testBestPly: 9, cleanPractice: false },
        oib1: { testBestPly: 6, cleanPractice: false },
      };
      const wiped = migrateBookLineProgress(stale, 0);
      if (wiped.revision !== BOOK_LINE_PROGRESS_REVISION) throw new Error("revision");
      if (wiped.lines.sg8) throw new Error("changed line kept");
      if (!wiped.lines.sg1 || !wiped.lines.sg2 || !wiped.lines.peb2 || !wiped.lines.kidb2) {
        throw new Error("unchanged line dropped");
      }
      if (!wiped.lines.ckb7 || !wiped.lines.oib1) throw new Error("kept trap or line 1 dropped");
      const again = migrateBookLineProgress(
        { ...wiped.lines, sg8: { testBestPly: 2, cleanPractice: false } },
        wiped.revision,
      );
      if (!again.lines.sg8) throw new Error("new progress on a changed line was dropped");
      if (!again.lines.peb2) throw new Error("petroff line 2 dropped on the second pass");
      if (again.changed) throw new Error("second pass should be a no-op");
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
