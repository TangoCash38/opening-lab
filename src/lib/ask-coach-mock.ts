/**
 * Deterministic coach used when the AI Gateway is not configured.
 * Move notes are the hand-written Scotch notes. Nothing here quotes a score.
 */
import type { AskQuestion, CoachContext } from "@/lib/ask-coach-context";
import { capSentences, sanTokens, sentencesOf, withheldSans } from "@/lib/ask-coach-validate";

function one(text: string | null | undefined): string | null {
  const first = text ? sentencesOf(text)[0] : undefined;
  return first ? (/[.!?]$/.test(first) ? first : `${first}.`) : null;
}

function aimSentence(ctx: CoachContext): string {
  const idea = one(ctx.coachIntro ?? ctx.idea);
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

export function coachIntroText(lineName: string, idea: string | null | undefined): string {
  const about = `This is ${lineName}, one of 10 lines from Opening Lab.`;
  const plan = idea?.trim();
  const ready = "Tap Practice when you want to play the moves.";
  if (!plan) return `${about} ${ready}`;
  const tidy = /[.!?]$/.test(plan) ? plan : `${plan}.`;
  return `${about} ${tidy} ${ready}`;
}

function moveNote(ctx: CoachContext): string {
  if (ctx.coachNote) return ctx.coachNote;
  if (!ctx.lastMove) return capSentences(`${ctx.sideToMove} to move. ${aimSentence(ctx)}`, 2);
  return capSentences(`${ctx.lastMove.san} is the move just played. ${aimSentence(ctx)}`, 2);
}

function lookNext(ctx: CoachContext): string {
  if (ctx.ply === ctx.plyCount) {
    const note = ctx.finishNote ?? "";
    const next = sentencesOf(note).find((s) => /^Next\b/i.test(s) && !/\b(engine|ahead by|about level)\b/i.test(s));
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
  const aim = aimSentence(ctx);

  let parts: Array<string | null>;
  if (question === "move") {
    return moveNote(ctx);
  }
  if (question === "free" && offTopic(text)) {
    parts = [
      "I can only help with this Scotch Gambit position.",
      "Ask me about the plan, this move, or what happens if they play something else.",
    ];
  } else if (
    question === "free" &&
    /\b(what if|instead|another|alternative|something else|other move)\b/i.test(text)
  ) {
    parts = [
      "There are many moves here, but you're learning this line.",
      "These 10 lines from Opening Lab give a strong grip on the Scotch.",
      bookNextSentence(ctx) ?? "Stay with the book move you are drilling in this line.",
    ];
  } else if (question === "why") {
    parts = ctx.coachNote ? [ctx.coachNote, aim] : [`${ctx.sideToMove} to move.`, aim];
  } else if (question === "plan") {
    parts = [aim, lookNext(ctx)];
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
    parts = [ctx.coachNote, aim, lookNext(ctx)];
  }

  return capSentences(parts.filter((p): p is string => Boolean(p)).join(" "));
}
