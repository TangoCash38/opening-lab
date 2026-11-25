/**
 * Shared checks for a creator pack. Safe to import from the editor and the server.
 * Website addresses stay refused. Chess moves must be legal from the line's FEN.
 */
import { Chess } from "chess.js";
import { labelToPence } from "./creator-packs-review.ts";
import { firstPurchaseLink } from "./creator-packs-text.ts";

export type CreatorLineDraft = {
  name: string;
  mode: "drill" | "walk";
  fen: string;
  plies: string[];
  comments: string[];
};

export type CreatorPackDraft = {
  name: string;
  blurb: string;
  suggestedPricePence: number;
  suggestedPriceLabel: string;
  lines: CreatorLineDraft[];
};

const MAX_NAME = 80;
const MAX_BLURB = 400;
const MAX_LINES = 24;
const MAX_PLIES = 80;
const MAX_COMMENT = 500;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > max) return null;
  return trimmed;
}

function replayError(fen: string, plies: readonly string[]): string | null {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return "That position is not a legal FEN.";
  }
  for (const san of plies) {
    let played = null;
    try {
      played = chess.move(san);
    } catch {
      played = null;
    }
    if (!played) return "One of the moves is not legal from that position.";
  }
  return null;
}

export function validateCreatorPack(
  input: unknown,
): { ok: true; pack: CreatorPackDraft } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "The pack could not be read." };
  }
  const body = input as {
    name?: unknown;
    blurb?: unknown;
    suggestedPrice?: unknown;
    lines?: unknown;
  };
  const name = clean(body.name, MAX_NAME);
  if (!name || name.length < 2) {
    return { ok: false, error: "Give the pack a name." };
  }
  const blurb = clean(body.blurb ?? "", MAX_BLURB);
  if (blurb === null) {
    return { ok: false, error: "Keep the note for players shorter." };
  }
  if (typeof body.suggestedPrice !== "string") {
    return { ok: false, error: "Choose Free, or add a price." };
  }
  const suggestedPricePence = labelToPence(body.suggestedPrice);
  if (suggestedPricePence === null) {
    return { ok: false, error: "Enter a price such as 2.50, or choose Free." };
  }
  const suggestedPriceLabel = suggestedPricePence === 0 ? "Free" : `£${(suggestedPricePence / 100).toFixed(2)}`;
  if (!Array.isArray(body.lines) || body.lines.length < 1) {
    return { ok: false, error: "Add at least one line." };
  }
  if (body.lines.length > MAX_LINES) {
    return { ok: false, error: "A pack can hold up to 24 lines." };
  }

  const lines: CreatorLineDraft[] = [];
  const texts = [name, blurb];
  for (const raw of body.lines) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "One of the lines could not be read." };
    }
    const line = raw as {
      name?: unknown;
      mode?: unknown;
      fen?: unknown;
      plies?: unknown;
      comments?: unknown;
    };
    const lineName = clean(line.name, MAX_NAME);
    if (!lineName) return { ok: false, error: "Give every line a name." };
    if (line.mode !== "drill" && line.mode !== "walk") {
      return { ok: false, error: "Each line is a drill or a walk-through." };
    }
    const fen = clean(line.fen, 120);
    if (!fen) return { ok: false, error: "Each line needs the position it starts from." };
    if (!Array.isArray(line.plies) || line.plies.length < 1 || line.plies.length > MAX_PLIES) {
      return { ok: false, error: "Each line needs at least one move." };
    }
    if (!Array.isArray(line.comments) || line.comments.length !== line.plies.length) {
      return { ok: false, error: "Each move needs its own comment, even if the comment is blank." };
    }
    const plies: string[] = [];
    const comments: string[] = [];
    for (let i = 0; i < line.plies.length; i += 1) {
      const san = clean(line.plies[i], 16);
      const comment = clean(line.comments[i], MAX_COMMENT);
      if (!san) return { ok: false, error: "One of the moves could not be read." };
      if (comment === null) return { ok: false, error: "Keep each comment under 500 characters." };
      plies.push(san);
      comments.push(comment);
      texts.push(comment);
    }
    const illegal = replayError(fen, plies);
    if (illegal) return { ok: false, error: illegal };
    let canonical = fen;
    try {
      canonical = new Chess(fen).fen();
    } catch {
      return { ok: false, error: "That position is not a legal FEN." };
    }
    texts.push(lineName);
    lines.push({ name: lineName, mode: line.mode, fen: canonical, plies, comments });
  }

  const blocked = firstPurchaseLink(texts);
  if (blocked) return { ok: false, error: blocked };
  return {
    ok: true,
    pack: { name, blurb, suggestedPricePence, suggestedPriceLabel, lines },
  };
}

export function validateCreatorProfile(input: unknown):
  | { ok: true; displayName: string; bio: string }
  | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Add the name you want on your packs." };
  }
  const body = input as { displayName?: unknown; bio?: unknown };
  const displayName = clean(body.displayName, 60);
  if (!displayName || displayName.length < 2) {
    return { ok: false, error: "Add the name you want on your packs." };
  }
  const bio = clean(body.bio ?? "", 280);
  if (bio === null) return { ok: false, error: "Keep the note about you shorter." };
  const blocked = firstPurchaseLink([displayName, bio]);
  if (blocked) return { ok: false, error: blocked };
  return { ok: true, displayName, bio };
}

/** Stripe Express country codes we pass through. We do not store the choice. */
export const CONNECT_COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "PT", name: "Portugal" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "CH", name: "Switzerland" },
  { code: "PL", name: "Poland" },
] as const;

export function connectCountry(code: unknown): string | null {
  if (typeof code !== "string") return null;
  const upper = code.trim().toUpperCase();
  return CONNECT_COUNTRIES.some((row) => row.code === upper) ? upper : null;
}
