/**
 * Ask the coach. Builds the Scotch context on the server, then asks the
 * Vercel AI Gateway. If the gateway is not configured, a mock coach answers
 * from the same facts so the sheet can still be tried.
 *
 * Sean, to use the real model on the opening-lab project:
 * 1. Enable AI Gateway for the Vercel project and add a payment method if
 *    the team still needs one for credits.
 * 2. Turn on OIDC (Project Settings, Security). Deployments then receive
 *    VERCEL_OIDC_TOKEN and the AI SDK uses it. No provider API key in the repo.
 * 3. For local runs, `vercel link` and `vercel env pull`, or set
 *    AI_GATEWAY_API_KEY from the AI Gateway API keys page. Do not commit it.
 * 4. Optional: ASK_COACH_MODEL, a provider/model id from
 *    https://ai-gateway.vercel.sh/v1/models
 *    Default is google/gemini-2.5-flash-lite.
 * 5. Hide the prototype with ASK_THE_COACH=0 and VITE_ASK_THE_COACH=0.
 */
import { generateText } from "ai";
import { hasDatabaseUrl, getSql } from "@/lib/db";
import { signedInOwnsPack } from "@/lib/purchases.server";
import { askTheCoachServerEnabled } from "@/lib/ask-coach-flag";
import {
  buildCoachContext,
  parseAskBody,
  type AskRequest,
  type CoachContext,
} from "@/lib/ask-coach-context";
import { mockCoachAnswer } from "@/lib/ask-coach-mock";
import { ASK_COACH_MODEL, coachInstructions, coachPrompt } from "@/lib/ask-coach-prompt";
import {
  sharedMemoryCountStore,
  takeQuestionSlot,
  utcDay,
  type CountStore,
  type CoachTier,
} from "@/lib/ask-coach-rate";
import { fallbackAnswer, finalizeCoachAnswer } from "@/lib/ask-coach-validate";

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

function gatewayConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim());
}

function clientIdentity(request: Request, userId: string | null): { kind: "user" | "ip"; id: string } {
  if (userId) return { kind: "user", id: userId };
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
  return { kind: "ip", id: ip };
}

async function countStore(): Promise<CountStore> {
  if (!hasDatabaseUrl && process.env.VERCEL) return sharedMemoryCountStore();
  try {
    const sql = await getSql();
    return {
      async incr(bucket, day, tier) {
        const rows = await sql.query<{ n: number | string }>(
          `insert into coach_ask_counts (bucket, day, tier, n)
           values ($1, $2, $3, 1)
           on conflict (bucket) do update set n = coach_ask_counts.n + 1
           returning n`,
          [bucket, day, tier],
        );
        return Number(rows[0]?.n ?? 1);
      },
    };
  } catch {
    return sharedMemoryCountStore();
  }
}

async function tierFor(request: Request): Promise<{ tier: CoachTier; userId: string | null }> {
  try {
    const owned = await signedInOwnsPack(request, "scotch");
    if (owned.owns) return { tier: "buyer", userId: owned.userId };
    return { tier: "visitor", userId: owned.userId };
  } catch {
    return { tier: "visitor", userId: null };
  }
}

async function gatewayText(instructions: string, prompt: string): Promise<string> {
  const model = process.env.ASK_COACH_MODEL?.trim() || ASK_COACH_MODEL;
  const { text } = await generateText({
    model,
    instructions,
    prompt,
    maxOutputTokens: 280,
    temperature: 0.2,
    reasoning: "none",
    maxRetries: 1,
    timeout: 20000,
  });
  return text;
}

async function composeAnswer(
  ctx: CoachContext,
  req: AskRequest,
): Promise<{ text: string; source: "gateway" | "mock" }> {
  const mock = () => finalizeCoachAnswer(mockCoachAnswer(ctx, req.question, req.text), ctx).text;
  if (!gatewayConfigured()) return { text: mock(), source: "mock" };

  const instructions = coachInstructions();
  const prompt = coachPrompt(ctx, req.question, req.text);
  try {
    let raw = await gatewayText(instructions, prompt);
    let fin = finalizeCoachAnswer(raw, ctx);
    if (fin.removed.length > 0) {
      raw = await gatewayText(
        instructions,
        `${prompt}\n\nYour previous answer used moves that are not allowed (${fin.removed.join(", ")}). Rewrite it without those moves. 2 to 4 sentences. Do not use an em dash. Do not say forever, lifetime, or Play on.`,
      );
      fin = finalizeCoachAnswer(raw, ctx);
    }
    const text = fin.text.trim() ? fin.text : fallbackAnswer(ctx);
    return { text, source: "gateway" };
  } catch (err) {
    console.info(
      JSON.stringify({
        event: "ask-coach-gateway-error",
        message: err instanceof Error ? err.message.slice(0, 180) : "error",
      }),
    );
    return { text: mock(), source: "mock" };
  }
}

function streamAnswer(text: string, source: string, remaining: number, tier: CoachTier): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const size = 32;
      for (let i = 0; i < text.length; i += size) {
        controller.enqueue(encoder.encode(text.slice(i, i + size)));
      }
      if (text.length === 0) controller.enqueue(encoder.encode(""));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-ask-coach-source": source,
      "x-ask-coach-remaining": String(remaining),
      "x-ask-coach-tier": tier,
    },
  });
}

export async function askCoachPost({ request }: { request: Request }): Promise<Response> {
  if (!askTheCoachServerEnabled(request.headers.get("user-agent"))) {
    return json({ error: "Ask the coach is off" }, 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const parsed = parseAskBody(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  let ctx: CoachContext;
  try {
    ctx = buildCoachContext(parsed.value);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid position";
    const status = message.includes("only on the Scotch") ? 404 : 400;
    return json({ error: message }, status);
  }

  const who = await tierFor(request);
  // Move notes are the lesson feed. They do not use the daily question cap.
  // The text box at the end of the line does.
  if (parsed.value.question === "move") {
    console.info(
      JSON.stringify({
        event: "ask-coach-note",
        day: utcDay(),
        tier: who.tier,
      }),
    );
    const answer = await composeAnswer(ctx, parsed.value);
    return streamAnswer(answer.text, answer.source, who.tier === "buyer" ? 50 : 5, who.tier);
  }

  const identity = clientIdentity(request, who.userId);
  const slot = await takeQuestionSlot(await countStore(), {
    day: utcDay(),
    tier: who.tier,
    kind: identity.kind,
    id: identity.id,
  });
  console.info(
    JSON.stringify({
      event: "ask-coach",
      day: slot.day,
      tier: slot.tier,
      count: slot.count,
      cap: slot.cap,
    }),
  );
  if (!slot.ok) {
    return json(
      { error: "Daily limit reached", tier: slot.tier, cap: slot.cap, remaining: 0 },
      429,
    );
  }

  const answer = await composeAnswer(ctx, parsed.value);
  return streamAnswer(answer.text, answer.source, slot.remaining, slot.tier);
}
