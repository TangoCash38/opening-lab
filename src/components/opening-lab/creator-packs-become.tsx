import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { saveCreatorProfile } from "@/lib/creator-packs-client";
import { firstPurchaseLink } from "@/lib/creator-packs-text";
import { CreatorPromoteNote } from "./creator-packs-promote";

export function CreatorPacksBecome() {
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const blocked = firstPurchaseLink([name, bio]);
    if (blocked) {
      setError(blocked);
      return;
    }
    setBusy(true);
    setError(null);
    void saveCreatorProfile({ displayName: name, bio }).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setThanks(true);
    });
  };

  return (
    <div data-creator-packs-become>
      <p className="creator-packs-kicker">Become a creator</p>
      <h1 className="creator-packs-title">Create your own Opening Lab style drill</h1>
      <p className="creator-packs-lede">
        Build your pack on Opening Lab, put your name on it, and suggest a price. Opening Lab reviews it before other
        players can see it. Players buy on the website or in the app, and you keep 70% of every sale.
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
          <p>You suggest a price. Opening Lab reviews the pack and sets the final price before anyone is charged.</p>
        </li>
        <li>
          <h2>Drill or Walk-through</h2>
          <p>
            For each line, players either drill it in Practice and Test, or walk through the moves with your comment
            on each one.
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
          If a position, a line, or a price is unclear, send a note. It opens an email to Opening Lab. Nothing is
          stored here.
        </p>
        <Link to="/creator-packs/help" className="creator-packs-primary creator-packs-primary-link">
          Need help?
        </Link>
      </aside>

      {isPending ? <p className="creator-packs-note">Loading your account…</p> : null}

      {!isPending && !user ? (
        <section className="creator-packs-form" data-creator-apply>
          <h2 className="creator-packs-subhead">Sign in</h2>
          <p className="creator-packs-note">
            Use the same Opening Lab account you already have. Google and X are hosted sign-in. Opening Lab does not
            ask for a new password on this page, and it does not store bank details.
          </p>
          <div className="creator-editor-actions">
            {GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                className="creator-packs-primary"
                onClick={() => {
                  setError(null);
                  void signIn(provider.providerId, { callbackURL: "/creator-packs/become" }).catch(() => {
                    setError("That sign-in did not finish. You can also use your Opening Lab email on the sign-in page.");
                  });
                }}
              >
                Continue with {provider.label}
              </button>
            ))}
          </div>
          <p className="creator-packs-note">
            <a href="/login?next=/creator-packs/become">Sign in with email</a>
          </p>
          {error ? (
            <p className="creator-packs-error" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      ) : null}

      {!isPending && user && thanks ? (
        <div className="creator-packs-thanks" role="status" data-creator-thanks>
          <h2>Your name is saved</h2>
          <p>Your name is saved on your Opening Lab account. You can build a pack whenever you are ready.</p>
          <Link to="/creator-packs/editor" className="creator-packs-primary creator-packs-primary-link">
            Open the pack editor
          </Link>
        </div>
      ) : null}

      {!isPending && user && !thanks ? (
        <form className="creator-packs-form" onSubmit={submit} noValidate data-creator-apply>
          <h2 className="creator-packs-subhead">Your name on the packs</h2>
          <p className="creator-packs-note">
            Signed in as {user.primaryEmail || user.displayName || "your account"}. This name is what players see. It
            is not a password, and it is not sent to a bank.
          </p>
          <label className="creator-packs-field">
            <span>Your name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder={user.displayName || "Your name"}
              data-creator-field="name"
            />
          </label>
          <label className="creator-packs-field">
            <span>A short note about you</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              placeholder="Optional. Club coach, or the openings you enjoy."
              data-creator-field="note"
            />
          </label>
          {error ? (
            <p className="creator-packs-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="creator-packs-primary" disabled={busy}>
            {busy ? "Saving…" : "Save and continue"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
