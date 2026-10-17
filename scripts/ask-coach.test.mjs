import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
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
const slides = await vite.ssrLoadModule("/src/lib/coach-slides.ts");
const i18n = await vite.ssrLoadModule("/src/lib/i18n.ts");

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

test("flag is on for on-sale packs and can be switched off", () => {
  assert.equal(flag.askTheCoachEnabled("scotch", undefined), true);
  assert.equal(flag.askTheCoachEnabled("london", undefined), true);
  assert.equal(flag.askTheCoachEnabled("caro-kann-black", undefined), true);
  assert.equal(flag.askTheCoachEnabled("italian", undefined), false);
  assert.equal(flag.askTheCoachEnabled("english-white", undefined), false);
  assert.equal(flag.askTheCoachEnabled("london", "1"), true);
  assert.equal(flag.askTheCoachEnabled("scotch", "0"), false);
  assert.equal(flag.askTheCoachEnabled("london", "false"), false);
  assert.equal(flag.askTheCoachServerEnabled("Mozilla/5.0 Chrome"), true);
  assert.equal(flag.askTheCoachServerEnabled("Mozilla/5.0 OpeningLabPlay"), true);
  const src = readFileSync(join(root, "src/lib/ask-coach-flag.ts"), "utf8");
  assert.equal(src.includes("isPlayUserAgent"), false);
  assert.equal(src.includes("isPlayWrap"), false);
});

test("a finished pair does not pause the board and the reply stays at normal speed", () => {
  for (const ply of [0, 1, 2, 3, 4]) {
    assert.equal(slides.opponentAutoDelay(ply), slides.OPPONENT_REPLY_MS);
  }
  assert.equal(slides.OPPONENT_REPLY_MS, 420);
  assert.equal(slides.PAIR_READ_MS, undefined);
  const slidesSrc = readFileSync(join(root, "src/lib/coach-slides.ts"), "utf8");
  assert.doesNotMatch(slidesSrc, /PAIR_READ_MS|4500/);
  const train = readFileSync(join(root, "src/components/opening-lab/train-view.tsx"), "utf8");
  const panel = readFileSync(join(root, "src/components/opening-lab/ask-coach-panel.tsx"), "utf8");
  assert.match(train, /opponentAutoDelay\(idx\)/);
  assert.doesNotMatch(train, /pairHoldUntil|PAIR_READ_MS/);
  assert.match(panel, /followed\.current/);
  assert.match(panel, /data-coach-prev/);
  assert.doesNotMatch(panel, /data-ask-coach-practice/);
  assert.doesNotMatch(train, /data-ask-coach-practice/);
  const notice = readFileSync(join(root, "src/components/opening-lab/slav-pack-notice.tsx"), "utf8");
  assert.match(train, /SlavPackNotice/);
  assert.match(notice, /data-slav-start/);
  assert.match(notice, /Tap to practice/);
  assert.match(notice, /data-line-welcome/);
  assert.match(notice, /lineWelcome \?/);
  assert.match(notice, /\{copy\.lead\}/);
  assert.match(train, /lineWelcome=\{\{ n, pack: shortPack, line: line\.name \}\}/);
  assert.doesNotMatch(train, /!startNow &&/);
});

test("the line welcome names the line and is translated", () => {
  const welcome = "Welcome to Line {n} of the {pack} drills: {line}.";
  const practice =
    "In Practice you play your side on the board. The coach explains each pair, and you can swipe back to an earlier one. A green hint shows your next move. A wrong move flashes red and shows you the book move, so you can try again from there.";
  const exam =
    "Then Test yourself. The green hint stays off. Only the book move counts, and one wrong move means that Test does not pass. A clean Test turns the line green.";
  const english = i18n.translate("en", welcome, { n: 1, pack: "Scotch Gambit", line: "Line 1" });
  assert.equal(english, "Welcome to Line 1 of the Scotch Gambit drills: Line 1.");
  for (const lang of i18n.LANGS) {
    const text = i18n.translate(lang, welcome, { n: 4, pack: "Sicilian for Black", line: "Poisoned Pawn" });
    assert.match(text, /4/);
    assert.match(text, /Sicilian for Black/);
    assert.match(text, /Poisoned Pawn/);
    const how = i18n.translate(lang, practice);
    const testCopy = i18n.translate(lang, exam);
    assert.equal(how.includes("—") || how.includes("–"), false, lang);
    assert.equal(testCopy.includes("—") || testCopy.includes("–"), false, lang);
    assert.doesNotMatch(how, /engine|eval|centipawn/i);
    assert.doesNotMatch(testCopy, /engine|eval|centipawn/i);
    if (lang !== "en") {
      assert.notEqual(text, i18n.translate("en", welcome, { n: 4, pack: "Sicilian for Black", line: "Poisoned Pawn" }));
      assert.notEqual(how, practice);
      assert.notEqual(testCopy, exam);
    }
  }
});

test("coach slides are one move pair at a time", () => {
  const plies = ["e4", "e5", "Nf3", "Nc6", "d4"];
  assert.deepEqual(slides.coachSlides(0, false).map((s) => s.kind), ["intro"]);
  const one = slides.coachSlides(1, false);
  assert.equal(one.length, 2);
  assert.equal(one[1].blackPly, null);
  assert.equal(slides.coachPairHeading(plies, 1, null), "1. e4");
  const pair = slides.coachSlides(2, false);
  assert.equal(pair[1].blackPly, 2);
  assert.equal(slides.coachPairHeading(plies, 1, 2), "1. e4 e5");
  const next = slides.coachSlides(3, false);
  assert.equal(next.length, 3);
  assert.equal(slides.coachPairHeading(plies, 2, null), "2. Nf3");
  const done = slides.coachSlides(4, true);
  assert.deepEqual(done.map((s) => s.kind), ["intro", "pair", "pair", "end"]);
  assert.equal(slides.coachPairHeading(plies, 2, 4), "2. Nf3 Nc6");
});

test("Play coach stays inside the WebView", () => {
  const train = readFileSync(join(root, "src/components/opening-lab/train-view.tsx"), "utf8");
  const at = train.indexOf('className="train-coach-back"');
  const back = train.slice(at - 180, at + 160);
  assert.match(back, /onClick=\{onBack\}/);
  assert.match(back, /data-train-back/);
  assert.doesNotMatch(back, /history\.back/);
  const panel = readFileSync(join(root, "src/components/opening-lab/ask-coach-panel.tsx"), "utf8");
  assert.doesNotMatch(panel, /data-ask-coach-input|Any questions|\/api\/ask-coach|visualViewport|virtualKeyboard/);
  assert.match(panel, /data-ask-coach-intro/);
  assert.match(panel, /data-ask-coach-test/);
  assert.match(panel, /data-ask-coach-show/);
  assert.match(panel, /coachLineNote/);
  const server = readFileSync(join(root, "src/lib/ask-coach.server.ts"), "utf8");
  assert.doesNotMatch(server, /generateText/);
  assert.match(server, /status: 404/);
  const css = readFileSync(join(root, "src/styles.css"), "utf8");
  assert.doesNotMatch(css, /--coach-keyboard|ask-coach-input|data-coach-keyboard/);
  assert.match(css, /\[data-surface="play"\] \.train-layout--coach:not\(\.train-embedded\)/);
  assert.match(css, /\[data-surface="website"\] \.train-layout--coach:not\(\.train-embedded\)/);
  assert.match(css, /\.train-layout--coach \.train-board-anchor \{\s*width: 100%;/);
  assert.equal(css.includes("min(100%, 20rem)"), false);
  assert.equal(css.includes("min(100%, 9.5rem)"), false);
  const titleCss = css.slice(css.indexOf(".train-coach-title {"), css.indexOf(".train-coach-pack {"));
  assert.doesNotMatch(titleCss, /ellipsis/);
  assert.match(train, /train-coach-pack/);
  assert.match(train, /train-coach-line/);
  assert.match(panel, /data-coach-prev/);
  assert.match(panel, /data-coach-next/);
  assert.match(panel, /ArrowGlyph/);
  const arrowCss = css.slice(css.indexOf(".ask-coach-arrow {"), css.indexOf(".ask-coach-viewport {"));
  assert.match(arrowCss, /\.ask-coach-arrow \{[^}]*width: 32px/);
  assert.match(arrowCss, /\.ask-coach-arrow \{[^}]*height: 32px/);
  assert.match(arrowCss, /\.ask-coach-arrow::before \{[^}]*width: 44px/);
  assert.match(arrowCss, /\.ask-coach-arrow::before \{[^}]*height: 44px/);
  assert.match(arrowCss, /background: var\(--color-accent\)/);
  assert.match(arrowCss, /color: var\(--color-accent-fg\)/);
  assert.doesNotMatch(arrowCss, /opacity: 0\.35/);
  assert.match(arrowCss, /\.ask-coach-arrow:disabled \{[^}]*opacity: 1/);
  assert.match(panel, /onPointerDown/);
  assert.match(css, /\.slav-notice\[data-slav-notice\] \.slav-intro-board/);
  assert.match(css, /width: min\(100% - 1\.5rem, 14rem\)/);
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

test("coming-soon packs are rejected", () => {
  assert.throws(() => context.buildCoachContext(req({ packId: "english-white", lineId: "en1" })), /on sale/);
  assert.throws(() => context.buildCoachContext(req({ packId: "italian", lineId: "i1" })), /on sale/);
});

test("a live pack uses its own coach note and no engine file", () => {
  const ctx = context.buildCoachContext(req({ packId: "london", lineId: "lon1", ply: 1, mode: "practice", question: "move" }));
  assert.equal(ctx.packId, "london");
  assert.equal(ctx.engine, null);
  assert.match(ctx.coachNote, /^d4 /);
  assert.equal(validate.leaksEngineTalk(ctx.coachNote), false);
  assert.doesNotMatch(ctx.coachIntro, /—|–|level|engine/);
  const black = context.buildCoachContext(req({ packId: "caro-kann-black", lineId: "ckb1", ply: 2, question: "move" }));
  assert.match(black.coachNote, /^c6 /);
  assert.equal(black.engine, null);
  const fin = validate.finalizeCoachAnswer(mock.mockCoachAnswer(black, "move", ""), black, 1);
  assert.equal(fin.text, black.coachNote);
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
  const intro = mock.coachIntroText(
    "Trap · Legal's Mate",
    "Legal's Mate: White seems to give away the queen, but if Black grabs it, the bishop checks on f7 and a knight mates on d5.",
  );
  assert.equal(
    intro,
    "Legal's Mate: White seems to give away the queen, but if Black grabs it, the bishop checks on f7 and a knight mates on d5.",
  );
  assert.doesNotMatch(intro, /Trap ·|one of 10 lines|Tap Practice/);
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
  assert.equal(intro, notes.scotchCoachIntro("sg1"));
  assert.match(intro, /Bd2/);
  assert.doesNotMatch(intro, /10 lines from Opening Lab|Tap Practice/);
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
  assert.match(text, /Scotch Gambit \(White\) position/);
  assert.doesNotMatch(text, /poem/i);
});

test("every on-sale pack note matches the board", async () => {
  const catalog = await vite.ssrLoadModule("/src/lib/catalog.ts");
  const explains = await vite.ssrLoadModule("/src/data/line-explains.ts");
  const study = await vite.ssrLoadModule("/src/lib/study-pack-copy.ts");
  const coachNotes = await vite.ssrLoadModule("/src/data/coach-notes.ts");
  const out = [];
  for (const id of catalog.LIVE_PACK_IDS) {
    const pack = packs.PACKS.find((p) => p.id === id);
    assert.equal(pack.lines.length, 10, id);
    const row = study.STUDY_PACK_ROWS.find((r) => r.packId === id);
    out.push({
      id,
      name: pack.name,
      side: row?.side ?? null,
      tagline: row?.tagline ?? "",
      lead: row?.lead ?? "",
      lines: pack.lines.map((line) => ({
        id: line.id,
        name: line.name,
        idea: line.idea ?? "",
        explain: explains.lineFinishNote(line, pack.id) ?? "",
        plies: line.plies,
      })),
    });
    for (const line of pack.lines) {
      assert.equal(coachNotes.coachLineNote(id, line.id, 0), null);
      assert.ok(coachNotes.coachLineIntro(id, line.id), `${id} ${line.id} intro`);
      assert.equal(coachNotes.coachLineIntro(id, line.id).includes("—"), false);
      for (let ply = 1; ply <= line.plies.length; ply += 1) {
        const note = coachNotes.coachLineNote(id, line.id, ply);
        assert.ok(note, `${id} ${line.id} ${ply}`);
        assert.equal(validate.leaksEngineTalk(note), false, note);
        assert.equal(note.includes("—") || note.includes("–"), false, note);
      }
    }
  }
  writeFileSync("/tmp/live-lines.json", JSON.stringify(out));
  const py = spawnSync("python3", ["scripts/build-coach-notes.py", "verify"], { cwd: root, encoding: "utf8" });
  assert.equal(py.status, 0, `${py.stdout}\n${py.stderr}`);
  assert.match(py.stdout, /python-chess ok/);
});

test.after(async () => {
  await vite.close();
});
