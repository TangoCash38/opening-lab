import { useState, type FocusEvent, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: err } = await authClient.signIn.email({ email, password });
      if (err) {
        setError("Could not sign in. Check the email and password.");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Could not sign in. Check the email and password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateAccount() {
    setError(null);
    setBusy(true);
    try {
      const displayName = name.trim() || email.split("@")[0] || "Player";
      const { error: err } = await authClient.signUp.email({
        email,
        password,
        name: displayName,
      });
      if (err) {
        setError(
          "Could not create account. Try a different email or a longer password.",
        );
        return;
      }
      window.location.href = "/";
    } catch {
      setError(
        "Could not create account. Try a different email or a longer password.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[10px] bg-accent text-lg font-bold text-accent-fg">
            ♔
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">
              {user ? "Account" : "Sign in"}
            </h1>
            <p className="text-sm text-fg-muted">
              {user ? "Opening Lab" : "Sign in so this stays on your account."}
            </p>
          </div>
        </div>

        {isPending ? (
          <p className="text-sm text-fg-muted">Loading…</p>
        ) : user ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-bg-elevated px-4 py-3">
              <p className="font-semibold text-fg">
                {user.displayName || "Signed in"}
              </p>
              {user.primaryEmail ? (
                <p className="text-sm text-fg-muted">{user.primaryEmail}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void signOut("/")}
              className="w-full rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm font-semibold text-fg shadow-sm transition hover:bg-bg-subtle active:scale-[0.98]"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSignIn}>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-fg">Name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-subtle focus:ring-2"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-fg">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-subtle focus:ring-2"
              />
            </label>
            <PasswordField value={password} onChange={setPassword} />

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
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCreateAccount()}
              className="w-full rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm font-semibold text-fg shadow-sm transition hover:bg-bg-subtle active:scale-[0.98] disabled:opacity-60"
            >
              Create account
            </button>
          </form>
        )}

        <Link
          to="/"
          className="inline-block text-sm font-semibold text-accent no-underline"
        >
          ← Back to packs
        </Link>
      </div>
    </main>
  );
}

function hidePasswordIfLeavingGroup(
  event: FocusEvent<HTMLElement>,
  hide: () => void,
) {
  const next = event.relatedTarget;
  if (next instanceof Node && event.currentTarget.contains(next)) {
    return;
  }
  hide();
}

function PasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label
      className="block space-y-1"
      onBlur={(event) =>
        hidePasswordIfLeavingGroup(event, () => setVisible(false))
      }
    >
      <span className="text-sm font-semibold text-fg">Password</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-full border border-border bg-bg-elevated py-3 pl-4 pr-[5.75rem] text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-subtle focus:ring-2"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onPointerDown={(event) => {
            // Keep the field focused so a tap on the control does not race with blur.
            event.preventDefault();
          }}
          onClick={() => setVisible((open) => !open)}
          className="absolute inset-y-0 right-1 my-auto flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-fg-muted transition hover:bg-bg-subtle hover:text-fg active:bg-bg-subtle"
        >
          <PasswordEyeIcon off={visible} />
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}

function PasswordEyeIcon({ off }: { off: boolean }) {
  if (off) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.4 5.5A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a16.9 16.9 0 0 1-3.2 3.8" />
        <path d="M6.7 6.7C3.6 8.8 2 12 2 12s3 7 10 7a9.6 9.6 0 0 0 4.3-1" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
