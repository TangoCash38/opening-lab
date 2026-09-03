import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const helperPath = join(root, "src/lib/auth/session-cap.ts");
const helperSrc = readFileSync(helperPath, "utf8");

function toRunnableJs(src) {
  return src
    .replace(/export type CapSession = \{[\s\S]*?\};\n/, "")
    .replace(/: readonly CapSession\[\]/g, "")
    .replace(/: CapSession/g, "")
    .replace(/: string\[\]/g, "")
    .replace(/: string/g, "")
    .replace(/: number/g, "");
}

const dir = mkdtempSync(join(tmpdir(), "session-cap-"));
const jsPath = join(dir, "session-cap.mjs");
writeFileSync(jsPath, toRunnableJs(helperSrc));
const { sessionIdsToRevoke, MAX_CONCURRENT_SESSIONS } = await import(
  pathToFileURL(jsPath).href
);

test("cap is two — household, stop password sharing", () => {
  assert.equal(MAX_CONCURRENT_SESSIONS, 2);
  assert.match(helperSrc, /household/i);
  assert.match(helperSrc, /password sharing/i);
});

test("one or two sessions: revoke none", () => {
  assert.deepEqual(sessionIdsToRevoke([{ id: "a", createdAt: 1 }], "a"), []);
  assert.deepEqual(
    sessionIdsToRevoke(
      [
        { id: "a", createdAt: 1 },
        { id: "b", createdAt: 2 },
      ],
      "b",
    ),
    [],
  );
});

test("three sessions: revoke the oldest, keep the one that just signed in", () => {
  const sessions = [
    { id: "old", createdAt: 1, updatedAt: 1 },
    { id: "mid", createdAt: 2, updatedAt: 2 },
    { id: "new", createdAt: 3, updatedAt: 3 },
  ];
  assert.deepEqual(sessionIdsToRevoke(sessions, "new"), ["old"]);
});

test("more than three: keep newest two including the new sign-in", () => {
  const sessions = [
    { id: "s1", createdAt: 10 },
    { id: "s2", createdAt: 20 },
    { id: "s3", createdAt: 30 },
    { id: "s4", createdAt: 40 },
  ];
  assert.deepEqual(sessionIdsToRevoke(sessions, "s4"), ["s1", "s2"]);
});

test("always keep the session that just signed in, even if it is older", () => {
  const sessions = [
    { id: "just", createdAt: 1 },
    { id: "newer", createdAt: 9 },
    { id: "newest", createdAt: 10 },
  ];
  assert.deepEqual(sessionIdsToRevoke(sessions, "just"), ["newer"]);
});

test("keepId not yet in the list still reserves a slot", () => {
  const listed = [
    { id: "old", createdAt: 1 },
    { id: "mid", createdAt: 2 },
  ];
  assert.deepEqual(sessionIdsToRevoke(listed, "brand-new"), ["old"]);
});

test("prefers updatedAt over createdAt when picking oldest", () => {
  const sessions = [
    { id: "stale", createdAt: 100, updatedAt: 1 },
    { id: "fresh", createdAt: 2, updatedAt: 50 },
    { id: "new", createdAt: 60, updatedAt: 60 },
  ];
  assert.deepEqual(sessionIdsToRevoke(sessions, "new"), ["stale"]);
});

test("accepts Date and ISO strings", () => {
  const sessions = [
    { id: "a", createdAt: new Date("2026-01-01T00:00:00Z") },
    { id: "b", createdAt: "2026-02-01T00:00:00Z" },
    { id: "c", createdAt: "2026-03-01T00:00:00Z" },
  ];
  assert.deepEqual(sessionIdsToRevoke(sessions, "c"), ["a"]);
});

const terms = readFileSync(join(root, "src/routes/terms.tsx"), "utf8");
const legal = readFileSync(
  join(root, "src/components/opening-lab/legal-page.tsx"),
  "utf8",
);
const server = readFileSync(join(root, "src/lib/auth/server.ts"), "utf8");
const privacy = readFileSync(join(root, "src/routes/privacy.tsx"), "utf8");

test("Terms has Your account above Cooling-off and the signed copy", () => {
  const account = terms.indexOf('title="Your account"');
  const cooling = terms.indexOf('title="Cooling-off (UK)"');
  assert.notEqual(account, -1);
  assert.notEqual(cooling, -1);
  assert.ok(account < cooling, "Your account must sit above Cooling-off");
  assert.match(
    terms,
    /Your account is for you\. You may stay signed in on up to two/,
  );
  assert.match(
    terms,
    /If you sign\s+in on a third device, we sign the oldest one out/,
  );
  assert.match(
    terms,
    /Training progress stays on each device, so\s+it does not move when you sign in somewhere else/,
  );
  assert.match(terms, /updated="3 September 2026"/);
  assert.match(legal, /30 August 2026/);
});

test("server wires the cap on every session create and does not cookie-cache", () => {
  assert.match(server, /sessionIdsToRevoke/);
  assert.match(server, /databaseHooks/);
  assert.match(server, /session:\s*\{[\s\S]*create:\s*\{[\s\S]*after:/);
  assert.match(server, /cookieCache:\s*\{\s*enabled:\s*false/);
  assert.match(server, /internalAdapter/);
});

test("Privacy does not state a device count", () => {
  assert.doesNotMatch(privacy, /two devices/i);
  assert.doesNotMatch(privacy, /two devices at once/i);
});
