/**
 * Concurrent-session cap: household, stop password sharing.
 *
 * One buy must not be shareable with a crowd. After a session is created
 * (email sign-in, sign-up, or broker Google/X), keep this account on at
 * most two devices. The session that just signed in stays; older ones go.
 */
export const MAX_CONCURRENT_SESSIONS = 2;

export type CapSession = {
  id: string;
  createdAt?: Date | string | number | null;
  updatedAt?: Date | string | number | null;
};

function sessionAgeMs(session: CapSession): number {
  const raw = session.updatedAt ?? session.createdAt;
  if (raw == null) return 0;
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const t = Date.parse(String(raw));
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Given a user's sessions, keep the newest MAX (always keeping `keepId` —
 * the session that just signed in) and return the ids to revoke.
 *
 * `keepId` may be missing from `sessions` when an after-hook runs before
 * the new row is visible; we still reserve a slot for it.
 */
export function sessionIdsToRevoke(
  sessions: readonly CapSession[],
  keepId: string,
): string[] {
  const others = sessions.filter((s) => s.id !== keepId);
  const keepOthers = MAX_CONCURRENT_SESSIONS - 1;
  if (others.length <= keepOthers) return [];
  const oldestFirst = [...others].sort((a, b) => {
    const d = sessionAgeMs(a) - sessionAgeMs(b);
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });
  return oldestFirst.slice(0, others.length - keepOthers).map((s) => s.id);
}
