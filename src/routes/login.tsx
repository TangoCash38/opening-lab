import { useState, type FocusEvent, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: Login,
});

type Mode = "signin" | "signup";

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [offerCreate, setOfferCreate] = useState(false);
  const [offerSignIn, setOfferSignIn] = useState(false);
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setOfferCreate(false);
    setOfferSignIn(false);
  }

  async function handleSignIn(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setOfferCreate(false);
    setOfferSignIn(false);
    setBusy(true);
    try {
      const { error: err } = await authClient.signIn.email({ email, password });
      if (err) {
        const mapped = mapSignInError(err);
        setError(mapped.message);
        setOfferCreate(mapped.offerCreate);
        return;
      }
      window.location.href = "/";
    } catch {
      setError(
        "Could not reach Opening Lab. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateAccount(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setOfferCreate(false);
    setOfferSignIn(false);
    setBusy(true);
    try {
      const displayName = name.trim() || email.split("@")[0] || "Player";
      const { error: err } = await authClient.signUp.email({
        email,
        password,
        name: displayName,
      });
      if (err) {
        const mapped = mapCreateAccountError(err);
        setError(mapped.message);
        setOfferSignIn(mapped.offerSignIn);
        return;
      }
      window.location.href = "/";
    } catch {
      setError(
        "Could not reach Opening Lab. Check your connection and try again.",
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
              {user ? "Account" : mode === "signup" ? "Create account" : "Sign in"}
            </h1>
            <p className="text-sm text-fg-muted">
              {user
                ? "Opening Lab"
                : mode === "signup"
                  ? "New here? Create an account so this stays with you."
                  : "Sign in so this stays on your account."}
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
          <form
            className="space-y-3"
            onSubmit={mode === "signup" ? handleCreateAccount : handleSignIn}
          >
            {mode === "signup" ? (
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
            ) : null}
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
            <PasswordField
              value={password}
              onChange={setPassword}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />

            {error ? (
              <div className="space-y-2" role="alert">
                <p className="text-sm text-danger">{error}</p>
                {offerCreate ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => switchMode("signup")}
                    className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    No account for this email? Create account
                  </button>
                ) : null}
                {offerSignIn ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => switchMode("signin")}
                    className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                ) : null}
              </div>
            ) : null}

            {mode === "signin" ? (
              <>
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
                  onClick={() => switchMode("signup")}
                  className="w-full rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm font-semibold text-fg shadow-sm transition hover:bg-bg-subtle active:scale-[0.98] disabled:opacity-60"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-fg shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? "Please wait…" : "Create account"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => switchMode("signin")}
                  className="w-full rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm font-semibold text-fg shadow-sm transition hover:bg-bg-subtle active:scale-[0.98] disabled:opacity-60"
                >
                  Already have an account? Sign in
                </button>
              </>
            )}
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

type AuthErrorLike = {
  status?: number;
  statusText?: string;
  code?: string;
  message?: string;
};

function readAuthError(err: unknown): AuthErrorLike {
  if (!err || typeof err !== "object") return {};
  const rec = err as Record<string, unknown>;
  return {
    status: typeof rec.status === "number" ? rec.status : undefined,
    statusText: typeof rec.statusText === "string" ? rec.statusText : undefined,
    code: typeof rec.code === "string" ? rec.code : undefined,
    message: typeof rec.message === "string" ? rec.message : undefined,
  };
}

function errorBlob(err: AuthErrorLike): string {
  return `${err.code ?? ""} ${err.message ?? ""} ${err.statusText ?? ""}`;
}

function isUnavailable(err: AuthErrorLike): boolean {
  if (err.status === 503 || err.status === 502 || err.status === 500) return true;
  return /DATABASE_URL|unavailable|internal server/i.test(errorBlob(err));
}

function mapSignInError(err: unknown): { message: string; offerCreate: boolean } {
  const info = readAuthError(err);
  if (isUnavailable(info)) {
    return {
      message: "Sign-in is temporarily unavailable. Try again in a moment.",
      offerCreate: false,
    };
  }
  if (/invalid origin/i.test(errorBlob(info))) {
    return {
      message:
        "This page is on the wrong site. Open www.openinglab.co.uk and try again.",
      offerCreate: false,
    };
  }
  if (
    info.status === 403 ||
    /EMAIL_NOT_VERIFIED|not verified/i.test(errorBlob(info))
  ) {
    return {
      message:
        "This email is not verified yet. Check your inbox, then try again.",
      offerCreate: false,
    };
  }
  return {
    message: "Could not sign in. Check the email and password.",
    offerCreate: true,
  };
}

function mapCreateAccountError(err: unknown): {
  message: string;
  offerSignIn: boolean;
} {
  const info = readAuthError(err);
  if (isUnavailable(info)) {
    return {
      message:
        "Account creation is temporarily unavailable. Try again in a moment.",
      offerSignIn: false,
    };
  }
  const blob = errorBlob(info);
  if (/USER_ALREADY_EXISTS|already exists/i.test(blob)) {
    return {
      message: "An account with this email already exists.",
      offerSignIn: true,
    };
  }
  if (/PASSWORD_TOO_SHORT|too short/i.test(blob)) {
    return {
      message: "Password must be at least 8 characters.",
      offerSignIn: false,
    };
  }
  if (/PASSWORD_TOO_LONG|too long/i.test(blob)) {
    return {
      message: "Password is too long. Use 128 characters or fewer.",
      offerSignIn: false,
    };
  }
  return {
    message:
      "Could not create account. Try a different email or a longer password.",
    offerSignIn: false,
  };
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
  autoComplete,
}: {
  value: string;
  onChange: (next: string) => void;
  autoComplete: "current-password" | "new-password";
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
          autoComplete={autoComplete}
          required
          minLength={8}
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
