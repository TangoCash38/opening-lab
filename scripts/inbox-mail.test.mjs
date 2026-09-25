import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const landing = src("src/components/opening-lab/home-intro.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const form = src("src/components/opening-lab/feedback-view.tsx");
const inbox = src("src/lib/inbox.ts");
const email = src("src/lib/email.server.ts");
const route = src("src/routes/api/inbox.ts");
const copy = src("src/lib/voice-copy.ts");

test("Feedback sits next to Support on the home top bar", () => {
  const nav = landing.match(/<nav className="landing-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";
  assert.match(nav, /data-landing-support/);
  assert.match(nav, /data-landing-feedback/);
  assert.ok(
    nav.indexOf("data-landing-support") < nav.indexOf("data-landing-feedback"),
    "Feedback follows Support",
  );
  assert.match(nav, /t\("Support"\)/);
  assert.match(nav, /t\("Feedback"\)/);
  assert.doesNotMatch(nav, /Request a drill pack/);
  assert.match(landing, /onFeedback/);
  assert.match(shell, /onFeedback=\{openFeedback\}/);
  assert.match(shell, /setView\("feedback"\)/);
  assert.match(shell, /FeedbackView/);
});

test("drill request is a second tab on the Feedback page", () => {
  assert.match(form, /data-voice-tab="feedback"/);
  assert.match(form, /data-voice-tab="drill"/);
  assert.match(form, /t\("Request a drill pack"\)/);
  assert.match(form, /t\("Suggested next drills"\)/);
  assert.match(form, /e\.g\. King's Indian for White/);
  assert.match(form, /data-voice-thanks/);
  assert.match(form, /Thanks — we got it/);
  assert.doesNotMatch(form, /5 book \+ 5 punish/);
  assert.doesNotMatch(form, /Play on/);
});

test("both notes go to the support inbox through Resend, with a mailto fallback", () => {
  assert.match(inbox, /support@openinglab\.co\.uk/);
  assert.match(inbox, /\[Opening Lab Feedback\]/);
  assert.match(inbox, /\[Opening Lab Drill request\]/);
  assert.match(inbox, /mailto:/);
  assert.match(email, /sendSupportInboxEmail/);
  assert.match(email, /https:\/\/api\.resend\.com\/emails/);
  assert.match(email, /to: SUPPORT_INBOX/);
  assert.match(email, /INBOX_SUBJECT\[input\.kind\]/);
  assert.match(email, /replyTo: reply/);
  assert.match(email, /Time: \$\{at\}/);
  assert.match(route, /createFileRoute\("\/api\/inbox"\)/);
  assert.match(route, /sendSupportInboxEmail/);
  assert.match(form, /fetch\("\/api\/inbox"/);
  assert.match(form, /inboxMailto/);
  assert.match(form, /window\.location\.href = href/);
});

test("voice copy exists in every language", () => {
  for (const lang of ["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"]) {
    assert.match(copy, new RegExp(`${lang}:`));
  }
  assert.equal(copy.split('"Request a drill pack":').length - 1, 12);
  assert.equal(copy.split('"Thanks — we got it":').length - 1, 12);
  assert.doesNotMatch(copy, /5 book \+ 5 punish/);
  assert.doesNotMatch(copy, /£/);
});
