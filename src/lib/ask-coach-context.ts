/**
 * Server-side facts for one Scotch ply. The model only sees this object.
 * Nothing here is guessed: chess.js for the board, the pack text for the
 * line, and the cached Stockfish file for the evaluation.
 */
import { Chess } from "chess.js";
import { PACKS, type OpeningLine } from "@/data/packs";
import { lineFinishNote } from "@/data/line-explains";
import engineFile from "@/data/scotch-coach-engine.json";
import { SCOTCH_CANAL_BEATS, SCOTCH_COACH_BEATS, SCOTCH_PACK_ID } from "@/lib/scotch-coach";
import { STUDY_PACK_ROWS } from "@/lib/study-pack-copy";

export const ASK_QUESTIONS = ["rundown", "plan", "why", "alternative", "free", "move"] as const;
export type AskQuestion = (typeof ASK_QUESTIONS)[number];
export type AskMode = "practice" | "test";
export type AskSurface = "line" | "finish";

export type AskRequest = {
  packId: string;
  lineId: string;
  ply: number;
  mode: AskMode;
  surface: AskSurface;
  question: AskQuestion;
  text: string;
  showBook: boolean;
};

export type MaterialBag = { P: number; N: number; B: number; R: number; Q: number };

export type CoachLastMove = {
  san: string;
  by: "White" | "Black";
  sentence: string;
};

export type CoachEngineMove = {
  san: string;
  whiteEvalCp: number | null;
  whiteMate: number | null;
  pv: string[];
};

export type CoachContext = {
  packId: typeof SCOTCH_PACK_ID;
  packName: string;
  lineId: string;
  lineName: string;
  ply: number;
  plyCount: number;
  mode: AskMode;
  surface: AskSurface;
  showBook: boolean;
  fen: string;
  sideToMove: "White" | "Black";
  legalSans: string[];
  material: {
    white: MaterialBag;
    black: MaterialBag;
    whitePoints: number;
    blackPoints: number;
  };
  sanMarked: string;
  playedSans: string[];
  futureBookSans: string[];
  nextBookSan: string | null;
  lastMove: CoachLastMove | null;
  idea: string | null;
  finishNote: string | null;
  nextText: string | null;
  intro: string;
  engine: null | {
    depth: number;
    name: string;
    whiteEvalCp: number | null;
    whiteMate: number | null;
    moves: CoachEngineMove[];
  };
};

type EngineMoveJson = {
  san: string;
  whiteEvalCp: number | null;
  whiteMate: number | null;
  pv: string[];
};

type EnginePlyJson = {
  fen: string;
  stm: "w" | "b";
  whiteEvalCp: number | null;
  whiteMate: number | null;
  moves: EngineMoveJson[];
};

type EngineFile = {
  engine: string;
  depth: number;
  lines: Record<string, Array<EnginePlyJson | null>>;
};

const PIECE: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const EMPTY_BAG = (): MaterialBag => ({ P: 0, N: 0, B: 0, R: 0, Q: 0 });

function scotchPack() {
  const pack = PACKS.find((p) => p.id === SCOTCH_PACK_ID);
  if (!pack) throw new Error("Scotch pack is missing");
  return pack;
}

function scotchLine(lineId: string): OpeningLine {
  const line = scotchPack().lines.find((l) => l.id === lineId);
  if (!line) throw new Error("Unknown Scotch line");
  return line;
}

export function markedBookSan(plies: readonly string[], ply: number): string {
  const bits: string[] = [];
  for (let i = 0; i < plies.length; i += 1) {
    if (i === ply) bits.push("[[ply]]");
    if (i % 2 === 0) bits.push(`${i / 2 + 1}.${plies[i]}`);
    else bits.push(plies[i] ?? "");
  }
  if (ply >= plies.length) bits.push("[[ply]]");
  return bits.join(" ");
}

function countMaterial(fen: string): CoachContext["material"] {
  const board = fen.split(" ")[0] ?? "";
  const white = EMPTY_BAG();
  const black = EMPTY_BAG();
  for (const ch of board) {
    if (ch === "/" || (ch >= "1" && ch <= "8")) continue;
    const bag = ch === ch.toUpperCase() ? white : black;
    const key = ch.toUpperCase() as keyof MaterialBag;
    if (key in bag) bag[key] += 1;
  }
  const points = (bag: MaterialBag) => bag.P + bag.N * 3 + bag.B * 3 + bag.R * 5 + bag.Q * 9;
  return { white, black, whitePoints: points(white), blackPoints: points(black) };
}

function describeMove(mv: {
  san: string;
  color: string;
  piece: string;
  from: string;
  to: string;
  captured?: string;
  promotion?: string;
  flags: string;
}): CoachLastMove {
  const by = mv.color === "w" ? "White" : "Black";
  const piece = PIECE[mv.piece] ?? "piece";
  let sentence: string;
  if (mv.flags.includes("k")) sentence = `${by} castled kingside with ${mv.san}.`;
  else if (mv.flags.includes("q")) sentence = `${by} castled queenside with ${mv.san}.`;
  else {
    const captured = mv.captured ? ` It captures a ${PIECE[mv.captured] ?? "piece"}.` : "";
    const promo = mv.promotion ? ` The pawn promotes to a ${PIECE[mv.promotion] ?? "piece"}.` : "";
    const check = mv.san.includes("#")
      ? " It is checkmate."
      : mv.san.includes("+")
        ? " It gives check."
        : "";
    // Squares like f1 look like pawn SAN, so the sentence names the piece and the SAN only.
    sentence = `${by} played ${mv.san} with the ${piece}.${captured}${promo}${check}`;
  }
  return { san: mv.san, by, sentence };
}

function packIntro(): string {
  const row = STUDY_PACK_ROWS.find((r) => r.packId === SCOTCH_PACK_ID);
  const parts = [
    row ? `${row.tagline} ${row.lead} ${row.rest}` : "",
    SCOTCH_COACH_BEATS.join(" "),
    SCOTCH_CANAL_BEATS.join(" "),
  ].filter(Boolean);
  return parts.join("\n\n");
}

function engineAt(lineId: string, ply: number, fen: string, legal: Set<string>): CoachContext["engine"] {
  const file = engineFile as EngineFile;
  const row = file.lines?.[lineId]?.[ply];
  if (!row || row.fen !== fen) return null;
  const moves = (row.moves ?? [])
    .filter((m) => typeof m.san === "string" && legal.has(m.san))
    .slice(0, 3)
    .map((m) => ({
      san: m.san,
      whiteEvalCp: typeof m.whiteEvalCp === "number" ? m.whiteEvalCp : null,
      whiteMate: typeof m.whiteMate === "number" ? m.whiteMate : null,
      pv: Array.isArray(m.pv) ? m.pv.filter((s) => typeof s === "string") : [m.san],
    }));
  return {
    depth: file.depth,
    name: file.engine,
    whiteEvalCp: typeof row.whiteEvalCp === "number" ? row.whiteEvalCp : null,
    whiteMate: typeof row.whiteMate === "number" ? row.whiteMate : null,
    moves,
  };
}

export function buildCoachContext(req: AskRequest): CoachContext {
  if (req.packId !== SCOTCH_PACK_ID) throw new Error("Ask the coach is only on the Scotch pack");
  const pack = scotchPack();
  const line = scotchLine(req.lineId);
  if (!Number.isInteger(req.ply) || req.ply < 0 || req.ply > line.plies.length) {
    throw new Error("Invalid ply");
  }
  const game = new Chess();
  let last: CoachLastMove | null = null;
  for (let i = 0; i < req.ply; i += 1) {
    const mv = game.move(line.plies[i] ?? "");
    if (!mv) throw new Error("Illegal book move");
    if (i === req.ply - 1) last = describeMove(mv);
  }
  const fen = game.fen();
  const legalSans = game.moves();
  return {
    packId: SCOTCH_PACK_ID,
    packName: pack.name,
    lineId: line.id,
    lineName: line.name,
    ply: req.ply,
    plyCount: line.plies.length,
    mode: req.mode,
    surface: req.surface,
    showBook: req.showBook,
    fen,
    sideToMove: game.turn() === "w" ? "White" : "Black",
    legalSans,
    material: countMaterial(fen),
    sanMarked: markedBookSan(line.plies, req.ply),
    playedSans: line.plies.slice(0, req.ply),
    futureBookSans: line.plies.slice(req.ply),
    nextBookSan: line.plies[req.ply] ?? null,
    lastMove: last,
    idea: line.idea?.trim() || null,
    finishNote: lineFinishNote(line, pack.id) ?? null,
    nextText: line.next?.trim() || null,
    intro: packIntro(),
    engine: engineAt(line.id, req.ply, fen, new Set(legalSans)),
  };
}

const QUESTION_SET = new Set<string>(ASK_QUESTIONS);

export function parseAskBody(body: unknown): { ok: true; value: AskRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request" };
  const rec = body as Record<string, unknown>;
  const packId = typeof rec.packId === "string" ? rec.packId.trim() : "";
  const lineId = typeof rec.lineId === "string" ? rec.lineId.trim() : "";
  const ply = typeof rec.ply === "number" && Number.isFinite(rec.ply) ? Math.trunc(rec.ply) : NaN;
  const mode = rec.mode === "practice" || rec.mode === "test" ? rec.mode : null;
  const surface = rec.surface === "line" || rec.surface === "finish" ? rec.surface : null;
  const question = typeof rec.question === "string" && QUESTION_SET.has(rec.question) ? (rec.question as AskQuestion) : null;
  const text = typeof rec.text === "string" ? rec.text.trim().slice(0, 240) : "";
  const showBook = rec.showBook === true;
  if (!packId || !lineId) return { ok: false, error: "Missing line" };
  if (!Number.isInteger(ply) || ply < 0) return { ok: false, error: "Invalid ply" };
  if (!mode || !surface || !question) return { ok: false, error: "Invalid request" };
  if (question === "free" && !text) return { ok: false, error: "Write a short question" };
  return {
    ok: true,
    value: { packId, lineId, ply, mode, surface, question, text, showBook },
  };
}
