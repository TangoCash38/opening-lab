import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";

type Fields = {
  name: string;
  email: string;
  known: string;
  opening: string;
  note: string;
};

const EMPTY: Fields = { name: "", email: "", known: "", opening: "", note: "" };

export function CreatorPacksBecome() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof Fields) => (value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!fields.name.trim() || !fields.email.trim()) {
      setError("Add your name and an email, so a reply would know where to go.");
      return;
    }
    setError(null);
    setThanks(true);
  };

  return (
    <div data-creator-packs-become>
      <h1 className="creator-packs-title">Become a creator</h1>
      <p className="creator-packs-lede">
        A tool for the chess you want to teach. Build an opening pack, a puzzle, or any part of a game.
        Enter the moves on the board, or type them in SAN or coordinates. Opening Lab turns that into a learning pack under your name.
      </p>
      <p className="creator-packs-note">
        These splits are the proposal, so the numbers can be read here before anything goes live.
      </p>
      <ul className="creator-packs-points">
        <li>
          <h2>Your name on the pack</h2>
          <p>The card carries your name, a short note about you, and the lines you chose. You decide what goes in.</p>
        </li>
        <li>
          <h2>You keep 70%</h2>
          <p>On a sale inside Opening Lab, you keep 70% and Opening Lab keeps 30%.</p>
        </li>
        <li>
          <h2>A better split on your link</h2>
          <p>
            Share your own link. A sale that arrives that way pays you 85%, and Opening Lab keeps 15%.
          </p>
        </li>
        <li>
          <h2>Drill or Walk-through</h2>
          <p>
            For each line, players either drill it in Practice and Test, or walk through the moves with your comment on each one.
          </p>
        </li>
      </ul>

      {thanks ? (
        <div className="creator-packs-thanks" role="status" data-creator-thanks>
          <h2>Thank you</h2>
          <p>
            This preview has not sent or stored your application. When the programme opens, a person at Opening Lab will read each note.
          </p>
          <Link to="/creator-packs/editor" className="creator-packs-primary creator-packs-primary-link">
            Look at the pack editor
          </Link>
        </div>
      ) : (
        <form className="creator-packs-form" onSubmit={submit} noValidate data-creator-apply>
          <h2 className="creator-packs-subhead">Apply</h2>
          <p className="creator-packs-note">This form is only a preview. It stays on this screen.</p>
          <label className="creator-packs-field">
            <span>Your name</span>
            <input
              value={fields.name}
              onChange={(event) => set("name")(event.target.value)}
              autoComplete="name"
              data-creator-field="name"
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
              data-creator-field="email"
            />
          </label>
          <label className="creator-packs-field">
            <span>Where players know your chess</span>
            <input
              value={fields.known}
              onChange={(event) => set("known")(event.target.value)}
              data-creator-field="known"
            />
          </label>
          <label className="creator-packs-field">
            <span>What you would like to publish</span>
            <input
              value={fields.opening}
              onChange={(event) => set("opening")(event.target.value)}
              data-creator-field="opening"
            />
          </label>
          <label className="creator-packs-field">
            <span>A note for Opening Lab</span>
            <textarea
              value={fields.note}
              onChange={(event) => set("note")(event.target.value)}
              rows={4}
              data-creator-field="note"
            />
          </label>
          {error ? (
            <p className="creator-packs-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="creator-packs-primary">
            Send application
          </button>
        </form>
      )}
    </div>
  );
}
