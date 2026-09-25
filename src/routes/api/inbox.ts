import { createFileRoute } from "@tanstack/react-router";
import { sendSupportInboxEmail } from "@/lib/email.server";
import { inboxReplyTo, type InboxKind } from "@/lib/inbox";
import { signedInUser } from "@/lib/purchases.server";

const MAX: Record<InboxKind, number> = {
  feedback: 2000,
  drill: 240,
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function kindOf(value: unknown): InboxKind | null {
  return value === "feedback" || value === "drill" ? value : null;
}

async function inboxPost({ request }: { request: Request }): Promise<Response> {
  let body: { kind?: unknown; message?: unknown; email?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const kind = kindOf(body.kind);
  if (!kind) return json({ error: "Missing kind" }, 400);

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return json({ error: "Write a short note" }, 400);
  if (message.length > MAX[kind]) return json({ error: "Too long" }, 400);

  const typed = typeof body.email === "string" ? body.email : "";
  if (typed.trim() && !inboxReplyTo(typed)) {
    return json({ error: "Bad email" }, 400);
  }

  let accountEmail: string | null = null;
  try {
    const user = await signedInUser(request);
    accountEmail = inboxReplyTo(user?.email);
  } catch {
    accountEmail = null;
  }

  const replyTo = inboxReplyTo(typed) ?? accountEmail;

  try {
    const { sent } = await sendSupportInboxEmail({
      kind,
      message,
      replyTo,
      accountEmail,
    });
    return json({ ok: true, sent });
  } catch {
    return json({ ok: false, sent: false }, 500);
  }
}

export const Route = createFileRoute("/api/inbox")({
  server: {
    handlers: {
      POST: inboxPost,
    },
  },
});
