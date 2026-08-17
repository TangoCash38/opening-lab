import { useState, type FormEvent } from "react";
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
            <p className="text-sm text-fg-muted">Opening Lab</p>
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
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-fg">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-subtle focus:ring-2"
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
