/** Shared by the feedback form and the server mailer. Safe to import from the client. */

export const SUPPORT_INBOX = "support@openinglab.co.uk";

export const INBOX_SUBJECT = {
  feedback: "[Opening Lab Feedback]",
  drill: "[Opening Lab Drill request]",
} as const;

export type InboxKind = keyof typeof INBOX_SUBJECT;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A single mailbox address, or null. Strips header-breaking whitespace. */
export function inboxReplyTo(value: string | null | undefined): string | null {
  const email = value?.replace(/[\r\n\t]/g, "").trim().slice(0, 254) ?? "";
  if (!email || !EMAIL_RE.test(email)) return null;
  return email;
}

/** Mailto fallback when the server cannot send. */
export function inboxMailto(input: {
  kind: InboxKind;
  message: string;
  replyTo?: string | null;
}): string {
  const at = new Date().toISOString();
  const reply = inboxReplyTo(input.replyTo) ?? "(none)";
  const label = input.kind === "drill" ? "Opening" : "Message";
  const body = `Time: ${at}\nReply-to: ${reply}\n\n${label}:\n${input.message}`;
  return `mailto:${SUPPORT_INBOX}?subject=${encodeURIComponent(INBOX_SUBJECT[input.kind])}&body=${encodeURIComponent(body)}`;
}
