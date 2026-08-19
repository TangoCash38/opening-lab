/**
 * Transactional email (server-only). Prefer Resend; SMTP is an optional fallback.
 * Never import this from client code. Never log bodies, tokens, or passwords.
 */
import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";
import { PACKS } from "@/data/packs";
import { isPackFree } from "@/data/pricing";
import { getSql } from "@/lib/db";

export const SITE_URL = "https://www.openinglab.co.uk";
const DEFAULT_FROM = "Opening Lab <support@openinglab.co.uk>";
const REPLY_TO = "support@openinglab.co.uk";

type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

function fromAddress(): string {
  return env("EMAIL_FROM") ?? DEFAULT_FROM;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layoutHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f1ea;color:#1b1b1b;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;">
  <div style="max-width:32rem;margin:0 auto;padding:24px;background:#ffffff;border-radius:12px;">
    <p style="margin:0 0 16px;font-weight:700;">Opening Lab</p>
    <p style="margin:0 0 16px;">${bodyHtml}</p>
    <p style="margin:24px 0 0;">
      <a href="${SITE_URL}" style="display:inline-block;padding:10px 18px;background:#1b1b1b;color:#ffffff;text-decoration:none;border-radius:999px;">Open Opening Lab</a>
    </p>
  </div>
</body>
</html>`;
}

function layoutText(body: string): string {
  return `${body}\n\n${SITE_URL}\n`;
}

let warnedNoProvider = false;

function warnNoProviderOnce(): void {
  if (warnedNoProvider) return;
  warnedNoProvider = true;
  console.info(
    "[email] No RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS — transactional email is off.",
  );
}

function hasResend(): boolean {
  return Boolean(env("RESEND_API_KEY"));
}

function hasSmtp(): boolean {
  return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS"));
}

async function sendResend(mail: Mail): Promise<void> {
  const key = env("RESEND_API_KEY");
  if (!key) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [mail.to],
      reply_to: REPLY_TO,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });
  if (!res.ok) {
    console.error("[email] resend failed", res.status);
  }
}

class SmtpSession {
  private buf = "";
  private queue: string[] = [];
  private waiters: Array<(line: string) => void> = [];

  constructor(private socket: Socket | TLSSocket) {
    this.socket.on("data", (chunk: Buffer | string) => {
      this.buf += typeof chunk === "string" ? chunk : chunk.toString("utf8");
      this.buf = this.buf.replace(/\r\n/g, "\n");
      let idx = this.buf.indexOf("\n");
      while (idx !== -1) {
        const line = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + 1);
        // Consume only the final line of a multiline reply (`250-…` then `250 …`).
        if (/^\d{3}[ ]/.test(line) || /^\d{3}$/.test(line)) {
          const waiter = this.waiters.shift();
          if (waiter) waiter(line);
          else this.queue.push(line);
        }
        idx = this.buf.indexOf("\n");
      }
    });
  }

  wait(ms = 15_000): Promise<string> {
    if (this.queue.length) return Promise.resolve(this.queue.shift() as string);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("smtp timeout")),
        ms,
      );
      this.waiters.push((line) => {
        clearTimeout(timer);
        resolve(line);
      });
    });
  }

  async expect(code: number): Promise<string> {
    const line = await this.wait();
    if (!line.startsWith(String(code))) {
      throw new Error(`smtp wanted ${code}`);
    }
    return line;
  }

  write(command: string): void {
    this.socket.write(command.endsWith("\r\n") ? command : `${command}\r\n`);
  }

  async cmd(command: string, code: number): Promise<string> {
    this.write(command);
    return this.expect(code);
  }
}

function connectSocket(
  host: string,
  port: number,
  implicitTls: boolean,
): Promise<Socket | TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = implicitTls
      ? tlsConnect({ host, port, servername: host }, () => resolve(socket))
      : netConnect({ host, port }, () => resolve(socket));
    socket.once("error", reject);
  });
}

function wrapTls(socket: Socket, host: string): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const secure = tlsConnect({ socket, servername: host }, () => resolve(secure));
    secure.once("error", reject);
  });
}

async function sendSmtp(mail: Mail): Promise<void> {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  if (!host || !user || !pass) return;

  const port = Number(env("SMTP_PORT") || "587");
  const implicitTls = env("SMTP_SECURE") === "true" || port === 465;
  let socket: Socket | TLSSocket = await connectSocket(host, port, implicitTls);
  let session = new SmtpSession(socket);

  const from = fromAddress();
  const fromEmail = from.match(/<([^>]+)>/)?.[1] ?? from;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(mail.subject, "utf8").toString("base64")}?=`;
  const boundary = `ol${Date.now().toString(16)}`;
  const payload = [
    `From: ${from}`,
    `To: ${mail.to}`,
    `Reply-To: ${REPLY_TO}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    mail.text,
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    mail.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  try {
    await session.expect(220);
    await session.cmd("EHLO openinglab.co.uk", 250);
    if (!implicitTls) {
      await session.cmd("STARTTLS", 220);
      socket = await wrapTls(socket as Socket, host);
      session = new SmtpSession(socket);
      await session.cmd("EHLO openinglab.co.uk", 250);
    }
    await session.cmd("AUTH LOGIN", 334);
    await session.cmd(Buffer.from(user, "utf8").toString("base64"), 334);
    await session.cmd(Buffer.from(pass, "utf8").toString("base64"), 235);
    await session.cmd(`MAIL FROM:<${fromEmail}>`, 250);
    await session.cmd(`RCPT TO:<${mail.to}>`, 250);
    await session.cmd("DATA", 354);
    session.write(`${payload}\r\n.`);
    await session.expect(250);
    session.write("QUIT");
  } finally {
    socket.end();
  }
}

async function sendMail(mail: Mail): Promise<void> {
  try {
    if (!mail.to.includes("@")) return;
    if (hasResend()) {
      await sendResend(mail);
      return;
    }
    if (hasSmtp()) {
      await sendSmtp(mail);
      return;
    }
    warnNoProviderOnce();
  } catch {
    console.error("[email] send failed");
  }
}

export function welcomeMail(to: string): Mail {
  const text =
    "You’re in. Scotch Gambit is free. Tap a pack, tap a line, Practice (hints) then Test (no hints). A line stays red until a clean Test, then it goes green. Packs you buy stay on this account.";
  return {
    to,
    subject: "Welcome to Opening Lab",
    text: layoutText(text),
    html: layoutHtml(escapeHtml(text)),
  };
}

export function labPlusMail(to: string): Mail {
  const text =
    "Lab+ is on this account. Every pack is unlocked while it’s active. Same drill: Practice then Test. Cancel anytime; packs you already bought stay yours.";
  return {
    to,
    subject: "Welcome to Opening Lab+",
    text: layoutText(text),
    html: layoutHtml(escapeHtml(text)),
  };
}

export function packMail(to: string, packName: string): Mail {
  const text = `${packName} is unlocked on this account. Tap to see lines, then Practice and Test.`;
  return {
    to,
    subject: `Opening Lab: ${packName} is on your account`,
    text: layoutText(text),
    html: layoutHtml(
      `${escapeHtml(packName)} is unlocked on this account. Tap to see lines, then Practice and Test.`,
    ),
  };
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  await sendMail(welcomeMail(to));
}

export async function sendLabPlusEmail(to: string): Promise<void> {
  await sendMail(labPlusMail(to));
}

export async function sendPackEmail(to: string, packName: string): Promise<void> {
  await sendMail(packMail(to, packName));
}

function packDisplayName(packId: string): string | null {
  const pack = PACKS.find((item) => item.id === packId);
  if (!pack || isPackFree(pack)) return null;
  return pack.name;
}

async function userEmail(userId: string): Promise<string | null> {
  try {
    const sql = await getSql();
    const rows = await sql.query<{ email: string | null }>(
      `select email from "user" where id = $1`,
      [userId],
    );
    const email = rows[0]?.email?.trim();
    return email || null;
  } catch {
    return null;
  }
}

async function claimPackNotice(userId: string, packId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ user_id: string }>(
    `update purchases
        set emailed_packs = array_append(coalesce(emailed_packs, '{}'), $2)
      where user_id = $1
        and not ($2 = any(coalesce(emailed_packs, '{}')))
      returning user_id`,
    [userId, packId],
  );
  return rows.length > 0;
}

async function claimLabPlusNotice(userId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ user_id: string }>(
    `update purchases
        set labplus_emailed_at = now()
      where user_id = $1
        and labplus_emailed_at is null
      returning user_id`,
    [userId],
  );
  return rows.length > 0;
}


export async function sendLineFeedbackEmail(input: {
  packId: string;
  packName: string;
  lineId: string;
  lineName: string;
  message: string;
}): Promise<void> {
  const body =
    `Pack: ${input.packName} (${input.packId})\n` +
    `Line: ${input.lineName} (${input.lineId})\n\n` +
    input.message;
  await sendMail({
    to: REPLY_TO,
    subject: `Line comment: ${input.packName} · ${input.lineName}`,
    text: layoutText(body),
    html: layoutHtml(escapeHtml(body).replace(/\n/g, "<br>")),
  });
}

export async function notifyPaidUnlock(input: {
  userId: string;
  kind: "pack" | "monthly" | "yearly";
  packId?: string;
}): Promise<void> {
  try {
    if (input.kind === "pack") {
      const packId = input.packId?.trim();
      if (!packId) return;
      const packName = packDisplayName(packId);
      if (!packName) return;
      const claimed = await claimPackNotice(input.userId, packId);
      if (!claimed) return;
      const to = await userEmail(input.userId);
      if (!to) return;
      await sendPackEmail(to, packName);
      return;
    }
    if (input.kind === "monthly" || input.kind === "yearly") {
      const claimed = await claimLabPlusNotice(input.userId);
      if (!claimed) return;
      const to = await userEmail(input.userId);
      if (!to) return;
      await sendLabPlusEmail(to);
    }
  } catch {
    console.error("[email] purchase notice failed");
  }
}
