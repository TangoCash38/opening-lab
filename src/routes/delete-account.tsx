import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/opening-lab/legal-page";
import { authClient, clearLocalSession } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  clearLocalUnlocksAfterAccountDelete,
  requestAccountDeletion,
} from "@/lib/account-delete";

export const Route = createFileRoute("/delete-account")({
  component: DeleteAccount,
});

function DeleteAccount() {
  return (
    <LegalPage title="Delete your Opening Lab account" updated={null}>
      <p>
        If you have an Opening Lab account, you can delete it here or in the
        app (Account → Delete account).
      </p>

      <LegalSection title="What we delete">
        <ul className="list-disc space-y-1 pl-5">
          <li>Your sign-in email</li>
          <li>Your account record</li>
          <li>Packs and Buy all unlocks stored on that account</li>
        </ul>
      </LegalSection>

      <LegalSection title="What we may keep">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            A payment record (Stripe, or Google Play if you ever paid there)
            for tax or legal reasons, without your card number
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="What we do not store on our servers">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Training progress. That stays on your device until you clear
            Opening Lab app or browser data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Google Play billing">
        <p>
          Deleting your account does not cancel a Google Play purchase on
          Google’s side. Paid packs and Buy all in the Play app are one-time
          Google Play purchases. There is no Lab+ subscription. Manage Play
          purchases in Google Play (Payments & subscriptions) as well.
        </p>
      </LegalSection>

      <LegalSection title="How to delete">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Sign in on this page, then tap Delete account, or</li>
          <li>In the app: Account → Delete account</li>
        </ol>
        <p>
          We delete the account when you confirm. This cannot be undone. Packs
          and Buy all on that account will not come back if you sign up again.
        </p>
        <p>
          If you cannot sign in, email{" "}
          <a href="mailto:support@openinglab.co.uk" className="text-accent">
            support@openinglab.co.uk
          </a>{" "}
          from the address on the account, subject: Delete my Opening Lab
          account. We will delete it after we check it is your account.
        </p>
        <p>
          Need help?{" "}
          <a href="mailto:support@openinglab.co.uk" className="text-accent">
            support@openinglab.co.uk
          </a>
        </p>
      </LegalSection>

      <DeleteAccountPanel />
    </LegalPage>
  );
}

function DeleteAccountPanel() {
  const { user, isPending } = useCurrentUserState();
  const [done, setDone] = useState(false);

  if (isPending) {
    return <p className="text-sm text-fg-muted">Loading…</p>;
  }

  if (done) {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-elevated px-4 py-4">
        <h2 className="font-display text-lg font-bold text-fg">
          Account deleted
        </h2>
        <p className="mt-1.5 text-fg-muted">
          Your Opening Lab account is gone. Packs and Buy all on that account
          will not come back if you sign up again. Training progress is still
          on this device until you clear Opening Lab app or browser data.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg no-underline"
        >
          ← Home
        </Link>
      </section>
    );
  }

  if (!user) {
    return <DeleteAccountSignIn />;
  }

  return (
    <DeleteAccountConfirm
      email={user.primaryEmail}
      onDeleted={() => setDone(true)}
    />
  );
}

function DeleteAccountSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: err } = await authClient.signIn.email({ email, password });
      if (err) {
        setError("Could not sign in. Check the email and password.");
        return;
      }
    } catch {
      setError(
        "Could not reach Opening Lab. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-bg-elevated px-4 py-4">
      <h2 className="font-display text-lg font-bold text-fg">Sign in</h2>
      <p className="mt-1.5 text-fg-muted">
        Sign in on this page, then tap Delete account.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSignIn}>
        <label className="block space-y-1">
          <span className="text-sm font-semibold text-fg">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-border bg-bg px-4 py-3 text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-subtle focus:ring-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold text-fg">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-border bg-bg px-4 py-3 text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-subtle focus:ring-2"
          />
        </label>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-fg shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Please wait…" : "Sign in"}
        </button>
      </form>
      <p className="mt-3 text-sm text-fg-muted">
        Need to create an account or reset a password?{" "}
        <a href="/login" className="font-semibold text-accent">
          Account
        </a>
        .
      </p>
    </section>
  );
}

function DeleteAccountConfirm({
  email,
  onDeleted,
}: {
  email: string | null;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = confirmText.trim().toUpperCase() === "DELETE";

  async function handleDelete() {
    if (!ready || busy) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Delete your Opening Lab account? This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await requestAccountDeletion();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clearLocalUnlocksAfterAccountDelete();
      await clearLocalSession();
      onDeleted();
    } catch {
      setError(
        "Could not reach Opening Lab. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-bg-elevated px-4 py-4">
      <h2 className="font-display text-lg font-bold text-fg">
        Delete account
      </h2>
      {email ? (
        <p className="mt-1.5 text-fg-muted">Signed in as {email}</p>
      ) : (
        <p className="mt-1.5 text-fg-muted">You are signed in.</p>
      )}
      <p className="mt-3 text-fg-muted">
        Type DELETE to confirm. This cannot be undone. Packs and Buy all on
        this account will not come back if you sign up again.
      </p>
      <label className="mt-3 block space-y-1">
        <span className="text-sm font-semibold text-fg">Type DELETE</span>
        <input
          type="text"
          name="confirm-delete"
          autoComplete="off"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full rounded-full border border-border bg-bg px-4 py-3 text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-subtle focus:ring-2"
        />
      </label>
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!ready || busy}
        onClick={() => void handleDelete()}
        className="mt-4 w-full rounded-full bg-danger px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? "Please wait…" : "Delete account"}
      </button>
    </section>
  );
}
