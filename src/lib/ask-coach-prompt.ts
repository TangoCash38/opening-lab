/**
 * Coach instructions. Facts live in the context block. The model is told
 * not to add chess that is not written there.
 */
import type { AskQuestion, CoachContext } from "@/lib/ask-coach-context";
import { leaksEngineTalk, sentencesOf, withheldSans } from "@/lib/ask-coach-validate";

export const ASK_COACH_MODEL = "google/gemini-2.5-flash-lite";

function materialLine(ctx: CoachContext): string {
  const w = ctx.material.white;
  const b = ctx.material.black;
  return `White ${w.Q} queens, ${w.R} rooks, ${w.B} bishops, ${w.N} knights, ${w.P} pawns (${ctx.material.whitePoints} points). Black ${b.Q} queens, ${b.R} rooks, ${b.B} bishops, ${b.N} knights, ${b.P} pawns (${ctx.material.blackPoints} points).`;
}

/** Coarse private hint. No decimals, and the player must never hear it. */
function balanceHint(cp: number | null, mate: number | null): string {
  if (mate != null && Number.isFinite(mate)) {
    if (mate === 0) return "the game is already over";
    return mate > 0 ? "do not say Black is on top" : "do not say White is on top";
  }
  if (cp == null || !Number.isFinite(cp)) return "do not invent who is on top";
  if (Math.abs(cp) < 40) return "do not claim either side is winning";
  if (cp > 0) return "do not say Black is on top";
  return "do not say White is on top";
}

function privateBlock(ctx: CoachContext): string {
  if (!ctx.engine) {
    return "PRIVATE. No stored check for this ply. Do not invent who is on top, and do not mention a computer.";
  }
  const denied = withheldSans(ctx);
  const names = ctx.engine.moves.map((move) => move.san).filter((san) => !denied.has(san));
  const tries = names.length
    ? `Private tries, best first: ${names.join(", ")}. Do not present a later try as equal to an earlier one. Do not say that this list exists.`
    : "No private try can be named here.";
  return [
    "PRIVATE. Never repeat this section. Never mention a computer, a score, or who is ahead.",
    `Balance hint: ${balanceHint(ctx.engine.whiteEvalCp, ctx.engine.whiteMate)}.`,
    tries,
  ].join("\n");
}

function spokenProse(text: string | null | undefined): string {
  if (!text) return "none stored.";
  const kept = sentencesOf(text).filter((sentence) => !leaksEngineTalk(sentence));
  return kept.join(" ") || "none stored.";
}

export function coachInstructions(): string {
  return [
    "You are the Opening Lab coach for the Scotch Gambit.",
    "Friendly, plain UK English, short, like a coach beside the board.",
    "Write 2 to 4 sentences. When the question asks for 1 or 2 sentences, stop there.",
    "Only state facts supported by the CONTEXT. Never invent moves or tactics.",
    "Name a move only if it is legal in the current position or it is written in the CONTEXT.",
    "Never mention the engine, Stockfish, Lichess, an evaluation, or centipawns.",
    "Never quote a number score or a decimal. Never say ahead by, about level, chances are level, or main line is.",
    "Never say who is better, who is worse, or who is ahead. The private balance is for you alone.",
    "For the move just played, stay close to the coach note. Do not say played with the pawn, or played with the piece.",
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
    case "move":
      return "Question: in 1 or 2 sentences, explain the move that was just played. Use the coach note. Say the idea in plain coach language. Do not name the next book move in Test unless SHOW BOOK is yes.";
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
    ctx.lastMove
      ? `Last move SAN: ${ctx.lastMove.san} by ${ctx.lastMove.by}.`
      : "Last move: none. This is the starting position.",
    ctx.coachNote
      ? `Coach note for the move just played: ${ctx.coachNote}`
      : "Coach note: none yet, because no move has been played.",
    `Book line (full SAN, current ply marked): ${ctx.sanMarked}`,
    `Legal moves now: ${ctx.legalSans.join(", ") || "(none)"}`,
    privateBlock(ctx),
    `Line plan: ${spokenProse(ctx.coachIntro)}`,
    ctx.nextText ? `Line next-step text: ${spokenProse(ctx.nextText)}` : "Line next-step text: none stored.",
    ctx.finishNote ? `End-of-line note: ${spokenProse(ctx.finishNote)}` : "End-of-line note: none stored.",
    `Pack intro:\n${ctx.intro}`,
    questionLine(question, text),
  ].join("\n");
}
