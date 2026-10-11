/**
 * Deterministic coach used when the AI Gateway is not configured.
 * Every sentence is assembled from the context. It does not call a model.
 */
import type { AskQuestion, CoachContext } from "@/lib/ask-coach-context";
import { formatWhiteEval } from "@/lib/ask-coach-prompt";
import { capSentences, sanTokens, sentencesOf, withheldSans } from "@/lib/ask-coach-validate";

function one(text: string | null | undefined): string | null {
  const first = text ? sentencesOf(text)[0] : undefined;
  return first ? (/[.!?]$/.test(first) ? first : `${first}.`) : null;
}

function engineSentence(ctx: CoachContext): string | null {
  if (!ctx.engine) return null;
  const score = formatWhiteEval(ctx.engine.whiteEvalCp, ctx.engine.whiteMate);
  const denied = withheldSans(ctx);
  const names = ctx.engine.moves.map((m) => m.san).filter((san) => !denied.has(san));
  if (names.length === 0) return `The engine's main line is ${score}.`;
  const shown = names.slice(0, 3);
  const list =
    shown.length === 1
      ? shown[0]
      : shown.length === 2
        ? `${shown[0]} and ${shown[1]}`
        : `${shown[0]}, ${shown[1]} and ${shown[2]}`;
  return `The engine's main line is ${score}, and its top moves here include ${list}.`;
}

function materialSentence(ctx: CoachContext): string {
  if (ctx.material.whitePoints === ctx.material.blackPoints) {
    return `Material is level, ${ctx.material.whitePoints} points each.`;
  }
  return `Material is ${ctx.material.whitePoints} for White and ${ctx.material.blackPoints} for Black.`;
}

function aimSentence(ctx: CoachContext): string {
  const idea = one(ctx.idea);
  const plain = `This line is ${ctx.lineName} in the Scotch Gambit, one of 10 lines from Opening Lab.`;
  if (!idea) return plain;
  const denied = withheldSans(ctx);
  if (sanTokens(idea).some((san) => denied.has(san))) return plain;
  return idea;
}

function bookNextSentence(ctx: CoachContext): string | null {
  if (!ctx.nextBookSan) return null;
  if (ctx.mode === "test" && !ctx.showBook) return null;
  if (withheldSans(ctx).has(ctx.nextBookSan)) return null;
  return `The book move from here is ${ctx.nextBookSan}.`;
}

function lookNext(ctx: CoachContext): string {
  if (ctx.ply === ctx.plyCount) {
    const note = ctx.finishNote ?? "";
    const next = sentencesOf(note).find((s) => /^Next\b/i.test(s));
    if (next) return /[.!?]$/.test(next) ? next : `${next}.`;
    return "You are at the end of the book line.";
  }
  const book = bookNextSentence(ctx);
  if (book) return book;
  return "In Test, the next book move stays hidden until you tap Show me.";
}

function offTopic(text: string): boolean {
  const off =
    /\b(weather|poem|joke|python|javascript|recipe|president|football|song|lyrics|homework|crypto)\b/i;
  const chess =
    /\b(move|plan|pawn|knight|bishop|rook|queen|king|castle|castling|capture|line|scotch|gambit|white|black|check|mate|trade|develop|why|what)\b/i;
  return off.test(text) && !chess.test(text) && sanTokens(text).length === 0;
}

export function mockCoachAnswer(ctx: CoachContext, question: AskQuestion, text: string): string {
  const happened =
    ctx.lastMove?.sentence ??
    `This is the start of ${ctx.lineName}, before any book move has been played.`;
  const aim = aimSentence(ctx);
  const engine = engineSentence(ctx);
  const material = materialSentence(ctx);

  let parts: Array<string | null>;
  if (question === "free" && offTopic(text)) {
    parts = [
      "I can only help with this Scotch Gambit position.",
      "Ask me about the plan, this move, or what happens if they play something else.",
    ];
  } else if (question === "why") {
    parts = ctx.lastMove
      ? [happened, aim, engine ?? material]
      : [happened, `${ctx.sideToMove} to move.`, aim];
  } else if (question === "plan") {
    parts = [aim, lookNext(ctx), engine ?? material];
  } else if (question === "alternative") {
    const steer =
      bookNextSentence(ctx) ??
      "Stay with the book move you are drilling in this line.";
    parts = [
      "There are many moves here, but you're learning this line.",
      "These 10 lines from Opening Lab give a strong grip on the Scotch.",
      `It is ${ctx.sideToMove} to move, with ${ctx.legalSans.length} legal moves.`,
      steer,
    ];
  } else {
    parts = [happened, aim, engine, lookNext(ctx)];
  }

  return capSentences(parts.filter((p): p is string => Boolean(p)).join(" "));
}
