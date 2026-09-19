/**
 * Authenticated account deletion (server-only).
 *
 * Removes the Better Auth user (email + sessions + linked accounts) and pack /
 * Buy all unlocks on that account. Stripe / Play payment identifiers stay on
 * the purchases row for tax or legal records — no card numbers are stored.
 */
import { getSql } from "@/lib/db";
import { signedInUser } from "@/lib/purchases.server";

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export type DeleteAccountResult = {
  ok: true;
  deleted: true;
};

/**
 * Clear pack / Buy all unlocks for this user. Keep Stripe and Play payment
 * identifiers. Idempotent when the row is missing or already cleared.
 */
export async function clearAccountUnlocks(userId: string): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `update purchases
        set packs = '{}',
            plan = null,
            expires_at = null,
            emailed_packs = '{}',
            labplus_emailed_at = null,
            updated_at = now()
      where user_id = $1`,
    [userId],
  );
}

/**
 * Delete the Better Auth user and related identity rows. Session and account
 * rows cascade from "user". Verification is keyed by email identifier.
 * Idempotent if the user is already gone.
 */
export async function deleteAuthUser(
  userId: string,
  email: string | null,
): Promise<void> {
  const sql = await getSql();
  if (email) {
    await sql.query(`delete from verification where identifier = $1`, [email]);
  }
  await sql.query(`delete from "user" where id = $1`, [userId]);
}

/** Full delete: unlocks first, then identity. Safe to call twice. */
export async function deleteAccountForUser(
  userId: string,
  email: string | null,
): Promise<DeleteAccountResult> {
  await clearAccountUnlocks(userId);
  await deleteAuthUser(userId, email);
  return { ok: true, deleted: true };
}

export async function deleteAccountResponse(request: Request): Promise<Response> {
  const user = await signedInUser(request);
  if (!user) return json({ error: "Sign in required" }, 401);
  try {
    return json(await deleteAccountForUser(user.id, user.email));
  } catch (err) {
    console.error("[account] delete failed", err);
    return json({ error: "Could not delete account" }, 500);
  }
}
