import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
const prompt = await vite.ssrLoadModule("/src/lib/ask-coach-prompt.ts");
const notes = await vite.ssrLoadModule("/src/data/scotch-coach-notes.ts");
const packs = await vite.ssrLoadModule("/src/data/packs.ts");
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
  assert.equal(flag.askTheCoachServerEnabled("Mozilla/5.0 Chrome"), true);
  assert.equal(flag.askTheCoachServerEnabled("Mozilla/5.0 OpeningLabPlay"), true);
  const src = readFileSync(join(root, "src/lib/ask-coach-flag.ts"), "utf8");
  assert.equal(src.includes("isPlayUserAgent"), false);
  assert.equal(src.includes("isPlayWrap"), false);
});

test("Play coach stays inside the WebView", () => {
  const train = readFileSync(join(root, "src/components/opening-lab/train-view.tsx"), "utf8");
  const at = train.indexOf('className="train-coach-back"');
  const back = train.slice(at - 180, at + 160);
  assert.match(back, /onClick=\{onBack\}/);
  assert.match(back, /data-train-back/);
  assert.doesNotMatch(back, /history\.back/);
  const panel = readFileSync(join(root, "src/components/opening-lab/ask-coach-panel.tsx"), "utf8");
  assert.match(panel, /visualViewport/);
  assert.doesNotMatch(panel, /virtualKeyboard/);
  const css = readFileSync(join(root, "src/styles.css"), "utf8");
  assert.match(css, /--coach-keyboard/);
  assert.match(css, /\[data-surface="play"\] \.train-layout--coach:not\(\.train-embedded\)/);
  assert.match(css, /\[data-surface="website"\] \.train-layout--coach:not\(\.train-embedded\)/);
  assert.match(css, /\.train-layout--coach \.train-board-anchor \{\s*width: 100%;/);
  assert.equal(css.includes("min(100%, 20rem)"), false);
  assert.equal(css.includes("min(100%, 9.5rem)"), false);
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
      assert.equal(validate.leaksEngineTalk(fin.text), false, fin.text);
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

test("intro and move notes stay on the line", () => {
  const intro = mock.coachIntroText("Line 1", "Main 5.c3 gambit: meet Bb4+ with Bd2, and castle.");
  assert.match(intro, /10 lines from Opening Lab/);
  assert.match(intro, /Practice/);
  assert.doesNotMatch(intro, /—|–|\bforever\b|\blifetime\b|\bPlay on\b/);

  const testCtx = context.buildCoachContext(req({ mode: "test", showBook: false }));
  const note = validate.finalizeCoachAnswer(mock.mockCoachAnswer(testCtx, "move", ""), testCtx);
  assert.equal(note.removed.length, 0, note.removed.join(","));
  assert.match(note.text, /Bc4/);
  assert.doesNotMatch(note.text, /\bBc5\b/);
  const n = validate.sentencesOf(note.text).length;
  assert.ok(n >= 1 && n <= 2, note.text);
  assert.equal(note.text, testCtx.coachNote);
  assert.equal(validate.leaksEngineTalk(note.text), false);

  const practice = context.buildCoachContext(req());
  const played = validate.finalizeCoachAnswer(mock.mockCoachAnswer(practice, "move", ""), practice, 1);
  assert.equal(played.text, "Bc4 aims at f7, Black's weak spot.");
  assert.doesNotMatch(played.text, /—|–|\bPlay on\b|\bforever\b|engine|ahead by/);
});

test("engine talk is replaced with the coach note", () => {
  const ctx = context.buildCoachContext(req());
  const dirty = "White played Bc4 with the bishop. The engine's main line is White ahead by 0.3.";
  assert.equal(validate.leaksEngineTalk(dirty), true);
  assert.equal(validate.leaksEngineTalk("Stockfish says 12 centipawns."), true);
  assert.equal(validate.leaksEngineTalk("The main 5.c3 gambit meets Bb4+ with Bd2."), false);
  const clean = validate.withoutEngineTalk(dirty, ctx);
  assert.equal(clean, ctx.coachNote);
  assert.equal(validate.leaksEngineTalk(clean), false);

  const instructions = prompt.coachInstructions();
  assert.doesNotMatch(instructions, /Call the evaluation the engine/);
  assert.match(instructions, /Never mention the engine/);
  const body = prompt.coachPrompt(ctx, "move", "");
  assert.match(body, /Bc4 aims at f7/);
  assert.match(body, /PRIVATE/);
  assert.doesNotMatch(body, /ahead by|Stockfish|main line is|centipawn/i);

  const intro = mock.coachIntroText("Line 1", notes.scotchCoachIntro("sg1"));
  assert.match(intro, /10 lines from Opening Lab/);
  assert.match(intro, /Bd2/);
  assert.doesNotMatch(intro, /level|engine|ahead|—|–/);
});

test("every Scotch ply has a verified coach note", () => {
  const pack = packs.PACKS.find((p) => p.id === "scotch");
  assert.ok(pack);
  for (const line of pack.lines) {
    assert.equal(notes.scotchCoachNote(line.id, 0), null);
    assert.ok(notes.scotchCoachIntro(line.id));
    for (let ply = 1; ply <= line.plies.length; ply += 1) {
      const ctx = context.buildCoachContext(req({ lineId: line.id, ply, mode: "test", showBook: false }));
      const note = notes.scotchCoachNote(line.id, ply);
      assert.equal(ctx.coachNote, note, `${line.id} ${ply}`);
      assert.equal(validate.leaksEngineTalk(note), false, note);
      const fin = validate.finalizeCoachAnswer(mock.mockCoachAnswer(ctx, "move", ""), ctx, 1);
      assert.equal(fin.removed.length, 0, `${line.id} ${ply} removed ${fin.removed}`);
      assert.equal(fin.text, note);
      const next = ctx.nextBookSan;
      const played = line.plies[ply - 1];
      if (next && next !== played) assert.equal(fin.text.includes(next), false, `${line.id} ${ply} ${fin.text}`);
    }
  }
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
