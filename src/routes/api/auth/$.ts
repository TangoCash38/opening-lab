import { createFileRoute } from "@tanstack/react-router";

/**
 * On Vercel without DATABASE_URL we must not import the full Better Auth server
 * stack (it would still try to attach PGLite). Session reads return null; other
 * auth actions return 503 until Neon (or any Postgres) is wired up.
 */
function vercelWithoutDb(): boolean {
  return Boolean(process.env.VERCEL) && !process.env.DATABASE_URL?.trim();
}

function safeAuthResponse(request: Request): Response {
  const path = new URL(request.url).pathname;
  // Better Auth get-session is polled by the client on every load.
  if (path.includes("get-session")) {
    return Response.json(null);
  }
  return Response.json(
    {
      error: "Authentication requires DATABASE_URL",
      message:
        "Set a Postgres connection string (e.g. Neon) on the Vercel project, then redeploy.",
    },
    { status: 503 },
  );
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (vercelWithoutDb()) return safeAuthResponse(request);
        const { auth } = await import("@/lib/auth/server");
        return auth.handler(request);
      },
      POST: async ({ request }) => {
        if (vercelWithoutDb()) return safeAuthResponse(request);
        const { auth } = await import("@/lib/auth/server");
        return auth.handler(request);
      },
    },
  },
});
