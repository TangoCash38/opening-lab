import { createFileRoute } from "@tanstack/react-router";
import { sendLineFeedbackEmail } from "@/lib/email.server";

const MAX = 400;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

async function feedbackPost({ request }: { request: Request }): Promise<Response> {
  let body: {
    packId?: unknown;
    packName?: unknown;
    lineId?: unknown;
    lineName?: unknown;
    message?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return json({ error: "Write a short note" }, 400);
  if (message.length > MAX) return json({ error: "Too long" }, 400);

  const packId = typeof body.packId === "string" ? body.packId.trim().slice(0, 64) : "";
  const packName = typeof body.packName === "string" ? body.packName.trim().slice(0, 120) : "";
  const lineId = typeof body.lineId === "string" ? body.lineId.trim().slice(0, 64) : "";
  const lineName = typeof body.lineName === "string" ? body.lineName.trim().slice(0, 160) : "";
  if (!packId || !lineId) return json({ error: "Missing line" }, 400);

  try {
    await sendLineFeedbackEmail({
      packId,
      packName: packName || packId,
      lineId,
      lineName: lineName || lineId,
      message,
    });
    return json({ ok: true });
  } catch {
    return json({ error: "Could not send" }, 500);
  }
}

export const Route = createFileRoute("/api/feedback")({
  server: {
    handlers: {
      POST: feedbackPost,
    },
  },
});
