import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const email = readFileSync(join(root, "src/lib/email.server.ts"), "utf8");
const emailPassword = readFileSync(
  join(root, "src/lib/auth/email-password.ts"),
  "utf8",
);
const server = readFileSync(join(root, "src/lib/auth/server.ts"), "utf8");
const login = readFileSync(join(root, "src/routes/login.tsx"), "utf8");
const reset = readFileSync(join(root, "src/routes/reset-password.tsx"), "utf8");
const routeTree = readFileSync(join(root, "src/routeTree.gen.ts"), "utf8");

test("reset mail helper exists with subject, button, URL, and expiry", () => {
  assert.match(email, /export function resetPasswordMail/);
  assert.match(email, /export async function sendResetPasswordEmail/);
  assert.match(email, /Reset your Opening Lab password/);
  assert.match(email, /expires in about 1 hour/);
  assert.match(email, /label:\s*"Reset password"/);
  assert.match(email, /SITE_URL/);
});

test("emailAndPassword sends reset mail and revokes sessions", () => {
  assert.match(emailPassword, /sendResetPassword:\s*async/);
  assert.match(emailPassword, /sendResetPasswordEmail\(user\.email, url\)/);
  assert.match(emailPassword, /revokeSessionsOnPasswordReset:\s*true/);
  assert.match(emailPassword, /export const emailAndPasswordEnabled/);
});

test("server spreads full emailAndPassword config", () => {
  assert.match(
    server,
    /\.\.\.\(emailAndPasswordEnabled \? \{ emailAndPassword \} : \{\}\)/,
  );
  assert.doesNotMatch(
    server,
    /emailAndPassword:\s*\{\s*enabled:\s*true\s*\}/,
  );
});

test("login has Forgot password flow without email enumeration", () => {
  assert.match(login, /Forgot password\?/);
  assert.match(login, /type Mode = "signin" \| "signup" \| "forgot"/);
  assert.match(login, /authClient\.requestPasswordReset/);
  assert.match(login, /redirectTo: `\$\{window\.location\.origin\}\/reset-password`/);
  assert.match(
    login,
    /If that email has an account, we sent a reset link\./,
  );
  assert.match(login, /Back to sign in/);
  assert.doesNotMatch(login, /\bt\(/);
});

test("reset-password route is registered and reads token", () => {
  assert.match(reset, /createFileRoute\("\/reset-password"\)/);
  assert.match(reset, /authClient\.resetPassword/);
  assert.match(reset, /newPassword/);
  assert.match(reset, /INVALID_TOKEN/);
  assert.match(reset, /Password updated/);
  assert.match(reset, /minLength=\{8\}/);
  assert.match(routeTree, /from '\.\/routes\/reset-password'/);
  assert.match(routeTree, /path: '\/reset-password'/);
});

test("never logs tokens or passwords in reset paths", () => {
  for (const [name, src] of [
    ["email.server.ts", email],
    ["email-password.ts", emailPassword],
    ["login.tsx", login],
    ["reset-password.tsx", reset],
  ]) {
    assert.doesNotMatch(
      src,
      /console\.(log|info|debug|error|warn)\([^)]*(token|password|resetUrl)/i,
      name,
    );
  }
});
