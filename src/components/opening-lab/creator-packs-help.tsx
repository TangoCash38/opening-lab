import { useState, type FormEvent } from "react";
import { CREATOR_PACKS_HELP_EMAIL } from "@/lib/creator-packs-help";

type Fields = {
  name: string;
  email: string;
  message: string;
};

const EMPTY: Fields = { name: "", email: "", message: "" };

export function CreatorPacksHelp() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const set = (key: keyof Fields) => (value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setOpened(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!fields.name.trim() || !fields.email.trim() || !fields.message.trim()) {
      setError("Add your name, an email, and a short message.");
      return;
    }
    setError(null);
    const body = `Name: ${fields.name.trim()}\nEmail: ${fields.email.trim()}\n\n${fields.message.trim()}`;
    const href = `mailto:${CREATOR_PACKS_HELP_EMAIL}?subject=${encodeURIComponent("Creator packs help")}&body=${encodeURIComponent(body)}`;
    setOpened(true);
    window.location.href = href;
  };

  return (
    <div data-creator-packs-help>
      <p className="creator-packs-kicker">Need help?</p>
      <h1 className="creator-packs-title">Need help?</h1>
      <p className="creator-packs-lede">
        Send a note if you get stuck setting up a position, a line, or a price. This opens an email to Opening Lab.
        The site does not send or store it.
      </p>
      <form className="creator-packs-form" onSubmit={submit} noValidate data-creator-help-form>
        <label className="creator-packs-field">
          <span>Your name</span>
          <input
            value={fields.name}
            onChange={(event) => set("name")(event.target.value)}
            autoComplete="name"
            data-creator-help-field="name"
          />
        </label>
        <label className="creator-packs-field">
          <span>Email</span>
          <input
            type="email"
            value={fields.email}
            onChange={(event) => set("email")(event.target.value)}
            autoComplete="email"
            inputMode="email"
            data-creator-help-field="email"
          />
        </label>
        <label className="creator-packs-field">
          <span>Message</span>
          <textarea
            value={fields.message}
            onChange={(event) => set("message")(event.target.value)}
            rows={5}
            data-creator-help-field="message"
          />
        </label>
        {error ? (
          <p className="creator-packs-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="creator-packs-primary">
          Email Opening Lab
        </button>
        <p className="creator-packs-note">
          Goes to{" "}
          <a href={`mailto:${CREATOR_PACKS_HELP_EMAIL}`}>{CREATOR_PACKS_HELP_EMAIL}</a>
        </p>
        {opened ? (
          <p className="creator-packs-note" role="status" data-creator-help-opened>
            Your email app should open with this note. If it does not, write to {CREATOR_PACKS_HELP_EMAIL}.
          </p>
        ) : null}
      </form>
    </div>
  );
}
