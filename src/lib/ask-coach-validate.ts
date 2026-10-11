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
  const prose = [ctx.idea, ctx.finishNote, ctx.nextText, ctx.intro].filter(Boolean).join(" ");
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

export function fallbackAnswer(ctx: CoachContext): string {
  return capSentences(
    `${ctx.sideToMove} to move. Material is ${ctx.material.whitePoints} for White and ${ctx.material.blackPoints} for Black.`,
  );
}

export function finalizeCoachAnswer(
  raw: string,
  ctx: CoachContext,
): { text: string; removed: string[] } {
  const stripped = stripDisallowedMoves(raw, ctx);
  if (sentencesOf(stripped.text).length >= 2) return stripped;
  const extra = fallbackAnswer(ctx);
  const text = capSentences(`${stripped.text} ${extra}`.trim());
  return { text, removed: stripped.removed };
}
