import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { LONDON_MEMORY_LINE } from "@/lib/square-memory-london";
import { SQUARE_MEMORY_LINE } from "@/lib/square-memory-line";
import { cleanScoreName, MAX_CLEAR_MS, minimumClearMs } from "@/lib/square-memory";

const LINES = {
  ruy: SQUARE_MEMORY_LINE.squares.length,
  london: LONDON_MEMORY_LINE.squares.length,
} as const;

type LineId = keyof typeof LINES;

type ScoreRow = { name: string; ms: number };

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function lineId(value: unknown): LineId | null {
  return value === "ruy" || value === "london" ? value : null;
}

async function readBoard(line: LineId): Promise<ScoreRow[]> {
  const sql = await getSql();
  const rows = await sql<ScoreRow>`
    select name, ms
    from square_memory_scores
    where line = ${line}
    order by ms asc, created_at asc
    limit 20
  `;
  return rows.map((row) => ({ name: String(row.name), ms: Number(row.ms) }));
}

async function scoresGet({ request }: { request: Request }): Promise<Response> {
  const line = lineId(new URL(request.url).searchParams.get("line"));
  if (!line) return json({ error: "Unknown line" }, 400);
  try {
    return json({ line, scores: await readBoard(line) });
  } catch (err) {
    console.error("[square-memory] board read failed", err);
    return json({ error: "The board is not available right now." }, 503);
  }
}

async function scoresPost({ request }: { request: Request }): Promise<Response> {
  let body: { line?: unknown; name?: unknown; ms?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const line = lineId(body.line);
  const name = cleanScoreName(body.name);
  const ms = typeof body.ms === "number" ? Math.round(body.ms) : NaN;
  if (!line) return json({ error: "Unknown line" }, 400);
  if (!name) return json({ error: "Use a short name" }, 400);
  if (!Number.isInteger(ms) || ms < minimumClearMs(LINES[line]) || ms > MAX_CLEAR_MS) {
    return json({ error: "That time is not a full clear" }, 400);
  }

  const nameKey = name.toLocaleLowerCase("en");
  try {
    const sql = await getSql();
    const saved = await sql<ScoreRow>`
      insert into square_memory_scores (line, name_key, name, ms)
      values (${line}, ${nameKey}, ${name}, ${ms})
      on conflict (line, name_key) do update set
        name = case
          when excluded.ms < square_memory_scores.ms then excluded.name
          else square_memory_scores.name
        end,
        created_at = case
          when excluded.ms < square_memory_scores.ms then now()
          else square_memory_scores.created_at
        end,
        ms = least(square_memory_scores.ms, excluded.ms)
      returning name, ms
    `;
    const row = saved[0];
    const scores = await readBoard(line);
    return json({
      ok: true,
      name: row ? String(row.name) : name,
      ms: row ? Number(row.ms) : ms,
      scores,
    });
  } catch (err) {
    console.error("[square-memory] board save failed", err);
    return json({ error: "The board is not available right now." }, 503);
  }
}

export const Route = createFileRoute("/api/square-memory-scores")({
  server: {
    handlers: {
      GET: scoresGet,
      POST: scoresPost,
    },
  },
});
