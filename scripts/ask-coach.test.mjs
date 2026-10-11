import assert from "node:assert/strict";
import { createServer } from "vite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Chess } from "chess.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vite = await createServer({
  configFile: false,
  root,
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true },
  resolve: { alias: { "@": join(root, "src") } },
});

const flag = await vite.ssrLoadModule("/src/lib/ask-coach-flag.ts");
const context = await vite.ssrLoadModule("/src/lib/ask-coach-context.ts");
const validate = await vite.ssrLoadModule("/src/lib/ask-coach-validate.ts");
const mock = await vite.ssrLoadModule("/src/lib/ask-coach-mock.ts");
const rate = await vite.ssrLoadModule("/src/lib/ask-coach-rate.ts");

function req(over = {}) {
  return {
    packId: "scotch",
    lineId: "sg1",
    ply: 7,
    mode: "practice",
    surface: "line",
    question: "plan",
    text: "",
    showBook: false,
    ...over,
  };
}

test("flag is Scotch only and can be switched off", () => {
  assert.equal(flag.askTheCoachEnabled("scotch", undefined), true);
  assert.equal(flag.askTheCoachEnabled("italian", undefined), false);
  assert.equal(flag.askTheCoachEnabled("london", "1"), false);
  assert.equal(flag.askTheCoachEnabled("scotch", "0"), false);
  assert.equal(flag.askTheCoachEnabled("scotch", "false"), false);
});

test("context replays the book and matches chess.js", () => {
  const ctx = context.buildCoachContext(req());
  const game = new Chess();
  const plies = ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4"];
  for (const san of plies) game.move(san);
  assert.equal(ctx.fen, game.fen());
  assert.equal(ctx.sideToMove, "Black");
  assert.equal(ctx.lastMove.san, "Bc4");
  assert.ok(ctx.legalSans.includes("Bc5"));
  assert.equal(ctx.nextBookSan, "Bc5");
  assert.equal(ctx.material.whitePoints, 38);
  assert.equal(ctx.material.blackPoints, 39);
  assert.ok(ctx.sanMarked.includes("[[ply]]"));
  assert.ok(ctx.sanMarked.includes("4.Bc4"));
  assert.match(ctx.intro, /Scotch Gambit/);
  assert.ok(ctx.engine);
  assert.equal(ctx.engine.depth, 18);
  for (const move of ctx.engine.moves) {
    assert.ok(ctx.legalSans.includes(move.san), move.san);
  }
});

test("other packs are rejected", () => {
  assert.throws(() => context.buildCoachContext(req({ packId: "italian", lineId: "i1" })), /Scotch/);
});

test("test mode strips the next book move and illegal inventions", () => {
  const ctx = context.buildCoachContext(req({ mode: "test", showBook: false }));
  const raw = "Play Bc5 here. Also try Qh8, which is nonsense. The plan is the centre.";
  const fin = validate.finalizeCoachAnswer(raw, ctx);
  assert.equal(fin.removed.includes("Bc5"), true);
  assert.equal(fin.removed.includes("Qh8"), true);
  assert.doesNotMatch(fin.text, /\bBc5\b/);
  assert.doesNotMatch(fin.text, /\bQh8\b/);

  const shown = context.buildCoachContext(req({ mode: "test", showBook: true }));
  const kept = validate.stripDisallowedMoves("The book move from here is Bc5.", shown);
  assert.match(kept.text, /Bc5/);
});

test("mock answers stay short and inside the facts", () => {
  const spots = [
    req({ lineId: "sg1", ply: 7, mode: "test" }),
    req({ lineId: "sg3", ply: 11 }),
    req({ lineId: "sg7", ply: 11 }),
    req({ lineId: "sg10", ply: 24, surface: "finish" }),
  ];
  for (const spot of spots) {
    const ctx = context.buildCoachContext(spot);
    for (const question of ["plan", "why"]) {
      const text = mock.mockCoachAnswer(ctx, question, "");
      const fin = validate.finalizeCoachAnswer(text, ctx);
      assert.equal(fin.removed.length, 0, `${spot.lineId} ${question} removed ${fin.removed}`);
      const n = validate.sentencesOf(fin.text).length;
      assert.ok(n >= 2 && n <= 4, `${spot.lineId} ${question} sentences ${n}: ${fin.text}`);
      assert.doesNotMatch(fin.text, /—|–|\bforever\b|\blifetime\b|\bPlay on\b/i);
      if (spot.mode === "test" && ctx.nextBookSan) {
        const token = ctx.nextBookSan.replace(/[+#!?]/g, "");
        assert.equal(fin.text.includes(ctx.nextBookSan), false, fin.text);
        assert.equal(fin.text.includes(token), false, fin.text);
      }
    }
  }
});

test("visitor cap is 5 and the buyer cap is 50", async () => {
  const store = rate.memoryCountStore();
  const day = "2026-10-11";
  for (let i = 1; i <= 5; i += 1) {
    const slot = await rate.takeQuestionSlot(store, { day, tier: "visitor", kind: "ip", id: "a" });
    assert.equal(slot.ok, true);
    assert.equal(slot.remaining, 5 - i);
  }
  const blocked = await rate.takeQuestionSlot(store, { day, tier: "visitor", kind: "ip", id: "a" });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.remaining, 0);
  const other = await rate.takeQuestionSlot(store, { day, tier: "visitor", kind: "ip", id: "b" });
  assert.equal(other.ok, true);
  const buyer = rate.memoryCountStore();
  for (let i = 1; i <= 50; i += 1) {
    const slot = await rate.takeQuestionSlot(buyer, { day, tier: "buyer", kind: "user", id: "sean" });
    assert.equal(slot.ok, true);
  }
  const soft = await rate.takeQuestionSlot(buyer, { day, tier: "buyer", kind: "user", id: "sean" });
  assert.equal(soft.ok, false);
  assert.equal(soft.cap, 50);
});

test("off topic mock refuses", () => {
  const ctx = context.buildCoachContext(req());
  const text = mock.mockCoachAnswer(ctx, "free", "Write a poem about the weather");
  assert.match(text, /Scotch Gambit position/);
  assert.doesNotMatch(text, /poem/i);
});

test.after(async () => {
  await vite.close();
});
