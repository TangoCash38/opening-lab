import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useT } from "@/lib/i18n";
import { inboxMailto, inboxReplyTo, type InboxKind } from "@/lib/inbox";

const MAX: Record<InboxKind, number> = {
  feedback: 2000,
  drill: 240,
};

type Panel = "form" | "thanks" | "mail";

type Props = {
  onBack: () => void;
};

/**
 * Feedback, plus a second tab to request the next drill pack.
 * Server send goes to support@openinglab.co.uk. Mailto opens only if that fails.
 */
export function FeedbackView({ onBack }: Props) {
  const t = useT();
  const [tab, setTab] = useState<InboxKind>("feedback");

  return (
    <section data-voice>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
      >
        {t("← Back")}
      </button>
      <h1 className="mb-3 font-display text-[1.65rem] font-bold tracking-tight">
        {tab === "feedback" ? t("Feedback") : t("Request a drill pack")}
      </h1>
      <div className="voice-tabs" role="tablist" aria-label={t("Feedback")}>
        <button
          type="button"
          role="tab"
          id="voice-tab-feedback"
          className="voice-tab"
          aria-selected={tab === "feedback"}
          aria-controls="voice-panel"
          data-voice-tab="feedback"
          onClick={() => setTab("feedback")}
        >
          {t("Feedback")}
        </button>
        <button
          type="button"
          role="tab"
          id="voice-tab-drill"
          className="voice-tab"
          aria-selected={tab === "drill"}
          aria-controls="voice-panel"
          data-voice-tab="drill"
          onClick={() => setTab("drill")}
        >
          {t("Request a drill pack")}
        </button>
      </div>
      <VoicePanel key={tab} kind={tab} />
    </section>
  );
}

function VoicePanel({ kind }: { kind: InboxKind }) {
  const t = useT();
  const { user } = useCurrentUserState();
  const accountEmail =
    user && !user.isDevFallback ? inboxReplyTo(user.primaryEmail) : null;
  const [text, setText] = useState("");
  const [email, setEmail] = useState(accountEmail ?? "");

  useEffect(() => {
    if (!accountEmail) return;
    setEmail((current) => (current.trim() ? current : accountEmail));
  }, [accountEmail]);
  const [panel, setPanel] = useState<Panel>("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const message = text.trim();
  const reply = inboxReplyTo(email);
  const emailInvalid = email.trim().length > 0 && !reply;

  const send = async () => {
    if (!message || message.length > MAX[kind] || emailInvalid || busy) return;
    setBusy(true);
    setError(null);
    const href = inboxMailto({ kind, message, replyTo: reply });
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message,
          email: reply ?? "",
        }),
      });
      const data = (await res.json().catch(() => null)) as { sent?: boolean } | null;
      if (res.ok && data?.sent) {
        setPanel("thanks");
        return;
      }
      if (res.status === 400) {
        setError(t("Could not send. Try again."));
        return;
      }
      window.location.href = href;
      setPanel("mail");
    } catch {
      window.location.href = href;
      setPanel("mail");
    } finally {
      setBusy(false);
    }
  };

  if (panel === "thanks") {
    return (
      <p
        id="voice-panel"
        className="voice-thanks"
        role="status"
        data-voice-thanks
      >
        {t("Thanks — we got it")}
      </p>
    );
  }

  if (panel === "mail") {
    const href = inboxMailto({ kind, message, replyTo: reply });
    return (
      <div id="voice-panel" className="voice-card" role="status" data-voice-mailto>
        <p className="m-0 text-[0.95rem] leading-relaxed text-fg">
          {t("Your mail app should open so you can send it.")}
        </p>
        <a href={href} className="voice-mail-link">
          support@openinglab.co.uk
        </a>
      </div>
    );
  }

  const heading =
    kind === "feedback" ? t("A short note for Opening Lab.") : t("Suggested next drills");
  const hint =
    kind === "feedback"
      ? t("What should we know?")
      : t("Name the opening you want next.");

  return (
    <form
      id="voice-panel"
      role="tabpanel"
      aria-labelledby={kind === "feedback" ? "voice-tab-feedback" : "voice-tab-drill"}
      className="voice-card"
      data-voice-panel={kind}
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <p className="m-0 text-[0.95rem] font-semibold text-fg">{heading}</p>
      <p className="m-0 text-[0.9rem] leading-relaxed text-fg-muted">{hint}</p>
      <label className="voice-field">
        <span>{kind === "feedback" ? t("Message") : t("Opening name")}</span>
        {kind === "feedback" ? (
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX.feedback))}
            rows={5}
            maxLength={MAX.feedback}
            required
            data-voice-message
            placeholder={t("What should we know?")}
          />
        ) : (
          <input
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX.drill))}
            maxLength={MAX.drill}
            required
            data-voice-opening
            placeholder={t("e.g. King's Indian for White")}
          />
        )}
      </label>
      <label className="voice-field">
        <span>{t("Your email, if you want a reply")}</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value.slice(0, 254))}
          data-voice-email
        />
      </label>
      {emailInvalid ? (
        <p className="m-0 text-[0.82rem] text-danger" role="alert">
          {t("That email does not look right.")}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 text-[0.82rem] text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="voice-send"
        data-voice-send
        disabled={busy || !message || emailInvalid}
      >
        {busy ? t("Sending…") : t("Send")}
      </button>
    </form>
  );
}
