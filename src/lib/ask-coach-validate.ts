/**
 * Move tokens the coach is allowed to say, and a scrubber for the house style.
 * A SAN token stays only when it is legal now or it appears in the context.
 * Test mode also drops unplayed book moves unless the student tapped Show me.
 */
import type { CoachContext } from "@/lib/ask-coach-context";

const SAN_RE =
  /^(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8](?:=[QRBN])?[+#]?)$/;

export function normalizeSanToken(raw: string): string {
  let tok = raw.trim();
  tok = tok.replace(/^[("“]+|[)"”.,;:!?]+$/g, "");
  tok = tok.replace(/^\d+\.(?:\.\.)?/, "");
  tok = tok.replace(/^\.+/, "");
  return tok;
}

export function sanTokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\s,;:()[\]"'“”]+/)) {
    const tok = normalizeSanToken(raw);
    if (SAN_RE.test(tok)) out.push(tok);
  }
  return out;
}

export function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Drop house-style bans, then swap dashes for commas. */
export function scrubVoice(text: string): string {
  const kept = sentencesOf(text).filter(
    (s) => !/\b(?:forever|lifetime)\b/i.test(s) && !/\bPlay on\b/.test(s),
  );
  return kept
    .join(" ")
    .replaceAll("—", ", ")
    .replaceAll("–", ", ")
    .replace(/\s+,/g, ",")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\s+([.!?])/g, "$1")
    .trim();
}

export function capSentences(text: string, max = 4): string {
  const parts = sentencesOf(text).slice(0, max);
  return parts
    .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`))
    .join(" ")
    .trim();
}

/** Book moves the student must not hear in Test. */
export function withheldSans(ctx: CoachContext): Set<string> {
  const out = new Set<string>();
  if (ctx.mode !== "test") return out;
  const played = new Set(ctx.playedSans);
  const last = ctx.playedSans[ctx.playedSans.length - 1];
  const start = ctx.showBook ? 1 : 0;
  ctx.futureBookSans.forEach((san, index) => {
    if (index < start) return;
    if (san === last) return;
    if (index > 0 && played.has(san)) return;
    out.add(san);
  });
  return out;
}

export function allowedSans(ctx: CoachContext): Set<string> {
  const set = new Set<string>(ctx.legalSans);
  for (const san of ctx.playedSans) set.add(san);
  for (const san of ctx.futureBookSans) set.add(san);
  if (ctx.engine) {
    for (const move of ctx.engine.moves) {
      set.add(move.san);
      for (const san of move.pv) set.add(san);
    }
  }
  const prose = [ctx.idea, ctx.coachNote, ctx.coachIntro, ctx.finishNote, ctx.nextText, ctx.intro]
    .filter(Boolean)
    .join(" ");
  for (const san of sanTokens(prose)) set.add(san);
  return set;
}

export function stripDisallowedMoves(
  text: string,
  ctx: CoachContext,
): { text: string; removed: string[] } {
  const allowed = allowedSans(ctx);
  const denied = withheldSans(ctx);
  const removed: string[] = [];
  const parts = text.split(/(\s+)/);
  const next = parts.map((part) => {
    if (/^\s+$/.test(part)) return part;
    const tok = normalizeSanToken(part);
    if (!SAN_RE.test(tok)) return part;
    if (denied.has(tok) || !allowed.has(tok)) {
      removed.push(tok);
      return "";
    }
    return part;
  });
  const cleaned = capSentences(
    scrubVoice(next.join("").replace(/[ ]{2,}/g, " ").replace(/\s+([,.!?])/g, "$1")),
  );
  return { text: cleaned, removed };
}

const ENGINE_TALK =
  /\b(engine|stockfish|lichess|centipawns?|evaluation)\b/i;
const SCORE_TALK =
  /\b(ahead by|main line is|about level|about equal|roughly balanced)\b|\bchances are(?: about)? level\b|\b(?:is|are) (?:a little |clearly |much )?(?:better|worse|ahead|winning)\b/i;
const DECIMAL = /\b\d+\.\d+\b/;

/** Player-facing text must not quote a score or mention the computer. */
export function leaksEngineTalk(text: string): boolean {
  return ENGINE_TALK.test(text) || SCORE_TALK.test(text) || DECIMAL.test(text);
}

export function fallbackAnswer(ctx: CoachContext): string {
  if (ctx.coachNote && !leaksEngineTalk(ctx.coachNote)) return ctx.coachNote;
  return capSentences(`${ctx.sideToMove} to move. Stick to this Scotch Gambit line.`);
}

const PIECE_PLAYED = /\bplayed\b.+\bwith the (?:pawn|knight|bishop|rook|queen|king|piece)\b/i;

/** Drop sentences that leak a score or say "played with the pawn". If nothing remains, use the note. */
export function withoutEngineTalk(text: string, ctx: CoachContext): string {
  const kept = sentencesOf(text).filter(
    (sentence) => !leaksEngineTalk(sentence) && !PIECE_PLAYED.test(sentence),
  );
  const joined = capSentences(kept.join(" "));
  if (joined && !leaksEngineTalk(joined)) return joined;
  return fallbackAnswer(ctx);
}

export function finalizeCoachAnswer(
  raw: string,
  ctx: CoachContext,
  minSentences = 2,
): { text: string; removed: string[] } {
  const stripped = stripDisallowedMoves(raw, ctx);
  const count = sentencesOf(stripped.text).length;
  if (ctx.coachNote && stripped.text === ctx.coachNote) return stripped;
  if (count >= minSentences) return stripped;
  if (count === 0) return { text: fallbackAnswer(ctx), removed: stripped.removed };
  const text = capSentences(`${stripped.text} ${fallbackAnswer(ctx)}`.trim());
  return { text, removed: stripped.removed };
}
