/**
 * Better Auth after-hook: welcome email after email/password sign-up only.
 * Must never throw — sign-up stays good even if mail is off or fails.
 */
import { createAuthMiddleware } from "better-auth/api";
import { sendWelcomeEmail } from "@/lib/email.server";

export const afterSignUpWelcome = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/sign-up/email") return;
  // newSession is only set when the account was actually created.
  const session = ctx.context.newSession;
  if (!session) return;
  const fromSession = session.user?.email?.trim();
  const body = ctx.body as { email?: unknown } | undefined;
  const fromBody = typeof body?.email === "string" ? body.email.trim() : "";
  const to = fromSession || fromBody;
  if (!to) return;
  try {
    await sendWelcomeEmail(to);
  } catch {
    console.error("[email] welcome failed");
  }
});
