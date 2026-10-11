/**
 * Coach instructions. Facts live in the context block. The model is told
 * not to add chess that is not written there.
 */
import type { AskQuestion, CoachContext } from "@/lib/ask-coach-context";
import { withheldSans } from "@/lib/ask-coach-validate";

export const ASK_COACH_MODEL = "google/gemini-2.5-flash-lite";

export function formatWhiteEval(cp: number | null, mate: number | null): string {
  if (mate != null && Number.isFinite(mate)) {
    if (mate === 0) return "checkmate on the board";
    const side = mate > 0 ? "White" : "Black";
    return `${side} has mate in ${Math.abs(mate)}`;
  }
  if (cp == null || !Number.isFinite(cp)) return "no stored score";
  // Under 10 centipawns is noise at this depth. Do not call it a pawn edge.
  if (Math.abs(cp) < 10) return "about level";
  const pawns = Math.abs(cp) / 100;
  const body = pawns >= 10 ? pawns.toFixed(0) : pawns.toFixed(1);
  if (cp > 0) return `White ahead by ${body}`;
  return `Black ahead by ${body}`;
}

function materialLine(ctx: CoachContext): string {
  const w = ctx.material.white;
  const b = ctx.material.black;
  return `White ${w.Q} queens, ${w.R} rooks, ${w.B} bishops, ${w.N} knights, ${w.P} pawns (${ctx.material.whitePoints} points). Black ${b.Q} queens, ${b.R} rooks, ${b.B} bishops, ${b.N} knights, ${b.P} pawns (${ctx.material.blackPoints} points).`;
}

function engineBlock(ctx: CoachContext): string {
  if (!ctx.engine) {
    return "Engine: no stored evaluation for this ply. Do not invent an evaluation or a best move.";
  }
  const lines = ctx.engine.moves.map((move, i) => {
    const score = formatWhiteEval(move.whiteEvalCp, move.whiteMate);
    const pv = move.pv.slice(0, 4).join(" ");
    return `${i + 1}. ${move.san} (${score}). Continuation from here: ${pv}`;
  });
  const withheld = [...withheldSans(ctx)];
  const hide =
    withheld.length > 0
      ? `In Test, do not name these book moves: ${withheld.join(", ")}. That includes an engine move when it is the same SAN.`
      : "You may name the engine moves listed here.";
  return [
    `Engine: ${ctx.engine.name}, depth ${ctx.engine.depth}. Scores are from White's point of view, in pawns (centipawns divided by 100).`,
    `Position score: ${formatWhiteEval(ctx.engine.whiteEvalCp, ctx.engine.whiteMate)}.`,
    lines.length ? `Top moves from this position:\n${lines.join("\n")}` : "No legal engine move was stored.",
    "Only the first SAN of each top move is a legal move from this position. Later SANs in a continuation are the engine's line, not the book.",
    hide,
  ].join("\n");
}

export function coachInstructions(): string {
  return [
    "You are the Opening Lab coach for the Scotch Gambit.",
    "Friendly, plain UK English, short, like a coach beside the board.",
    "Write 2 to 4 sentences.",
    "Only state facts supported by the CONTEXT. Never invent moves, tactics, or evaluations.",
    "Name a move only if it is legal in the current position or it is written in the CONTEXT.",
    "Call the evaluation the engine. Do not say Stockfish, Lichess, or a cloud engine.",
    "Stick to this line. If asked about alternatives, briefly acknowledge them (for example, there are many moves here, but you're learning this line), explain that these 10 lines from Opening Lab give a strong grip on the Scotch, and steer back to the line.",
    "Refuse off-topic requests politely in one or two sentences, and invite a question about this position.",
    "Do not say Play on. Never say forever or lifetime.",
    "Do not use em dashes.",
    "In Test mode, do not name the next book move or any later book move, unless SHOW BOOK is yes. You may still talk about the move that has just been played.",
    "The end-of-line note describes the final position of the line. Use it as the current plan only when the marked ply is the end of the line.",
    "The pack intro is background. Do not treat it as the move list for this position.",
  ].join(" ");
}

function questionLine(question: AskQuestion, text: string): string {
  switch (question) {
    case "rundown":
      return "Question: give a short rundown of the CURRENT position. What just happened, what this line is aiming for, and what to look for next. 2 to 4 sentences.";
    case "plan":
      return "Question: What's the plan?";
    case "why":
      return "Question: Why this move? Explain the move that was just played. If no move has been played, say so.";
    case "alternative":
      return "Question: What if they play something else? Acknowledge that there are many moves, say that these 10 lines from Opening Lab give a strong grip on the Scotch, and steer back to this line.";
    case "free":
      return `Question from the student: ${text}`;
    default:
      return "Question: give a short rundown of the current position.";
  }
}

export function coachPrompt(ctx: CoachContext, question: AskQuestion, text: string): string {
  const modeLabel = ctx.mode === "test" ? "Test" : "Practice";
  const where = ctx.surface === "finish" ? "end-of-line card" : "during the line";
  return [
    "CONTEXT",
    `Pack: ${ctx.packName} (id ${ctx.packId}).`,
    `Line: ${ctx.lineName} (id ${ctx.lineId}).`,
    `Mode: ${modeLabel}. Surface: ${where}.`,
    `Ply: ${ctx.ply} of ${ctx.plyCount}. The marker [[ply]] sits at the current position in the book line.`,
    `SHOW BOOK: ${ctx.showBook ? "yes" : "no"}.`,
    `Side to move: ${ctx.sideToMove}.`,
    `FEN: ${ctx.fen}`,
    `Material: ${materialLine(ctx)}`,
    ctx.lastMove ? `Last move: ${ctx.lastMove.sentence}` : "Last move: none. This is the starting position.",
    `Book line (full SAN, current ply marked): ${ctx.sanMarked}`,
    `Legal moves now: ${ctx.legalSans.join(", ") || "(none)"}`,
    engineBlock(ctx),
    ctx.idea ? `Line idea: ${ctx.idea}` : "Line idea: none stored.",
    ctx.nextText ? `Line next-step text: ${ctx.nextText}` : "Line next-step text: none stored.",
    ctx.finishNote ? `End-of-line note: ${ctx.finishNote}` : "End-of-line note: none stored.",
    `Pack intro:\n${ctx.intro}`,
    questionLine(question, text),
  ].join("\n");
}
