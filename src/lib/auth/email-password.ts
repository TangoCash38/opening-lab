/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * `server.ts` spreads `emailAndPassword` when `emailAndPasswordEnabled`.
 * Reset mail and session revoke live here so that file stays a thin wire-up.
 */
import { sendResetPasswordEmail } from "@/lib/email.server";

export const emailAndPassword = {
  enabled: true,
  sendResetPassword: async ({
    user,
    url,
  }: {
    user: { email: string };
    url: string;
  }) => {
    await sendResetPasswordEmail(user.email, url);
  },
  revokeSessionsOnPasswordReset: true,
};

export const emailAndPasswordEnabled = emailAndPassword.enabled;
