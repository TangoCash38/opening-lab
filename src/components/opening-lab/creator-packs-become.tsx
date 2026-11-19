import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { firstPurchaseLink } from "@/lib/creator-packs-text";
import { CreatorPromoteNote } from "./creator-packs-promote";

type Fields = {
  name: string;
  email: string;
  opening: string;
  note: string;
};

const EMPTY: Fields = { name: "", email: "", opening: "", note: "" };

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
    const blocked = firstPurchaseLink([fields.name, fields.opening, fields.note]);
    if (blocked) {
      setError(blocked);
      return;
    }
    setError(null);
    setThanks(true);
  };

  return (
    <div data-creator-packs-become>
      <p className="creator-packs-kicker">Become a creator</p>
      <h1 className="creator-packs-title">Create your own Opening Lab style drill</h1>
      <p className="creator-packs-lede">
        Build your pack on Opening Lab, put your name on it, and suggest a price. Opening Lab reviews it before other players can see it. Players buy on the website or in the app, and you keep 70% of every sale.
      </p>
      <ul className="creator-packs-points">
        <li>
          <h2>Build it on Opening Lab</h2>
          <p>
            Set a starting position, play the moves, then turn them into a drill or a walk-through. You do not have to start from an opening. Place the pieces, or paste a FEN from the middle of a real game, then lock it in. A pack can hold several lines, and each line can start from its own position.
          </p>
        </li>
        <li>
          <h2>Your name on the pack</h2>
          <p>The card carries your name and the lines you wrote. You decide what goes in.</p>
        </li>
        <li>
          <h2>Suggest a price</h2>
          <p>
            You suggest a price. Opening Lab reviews the pack and sets the final price before anyone is charged.
          </p>
        </li>
        <li>
          <h2>Drill or Walk-through</h2>
          <p>
            For each line, players either drill it in Practice and Test, or walk through the moves with your comment on each one.
          </p>
        </li>
        <li>
          <h2>You keep 70%</h2>
          <p>
            Players buy on Opening Lab&apos;s website or in the app. You keep 70% of every sale. Opening Lab keeps 30%.
          </p>
        </li>
      </ul>
      <CreatorPromoteNote />

      <aside className="creator-packs-form" data-creator-help-link>
        <h2>Need help?</h2>
        <p className="creator-packs-note">
          If a position, a line, or a price is unclear, send a note. It opens an email to Opening Lab. Nothing is stored here.
        </p>
        <Link to="/creator-packs/help" className="creator-packs-primary creator-packs-primary-link">
          Need help?
        </Link>
      </aside>

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
