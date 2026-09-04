import { useState, type FocusEvent, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token, error: urlError } = Route.useSearch();
  const invalid = urlError === "INVALID_TOKEN" || !token;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (err) {
        const rec = err as { code?: string; message?: string };
        const blob = `${rec.code ?? ""} ${rec.message ?? ""}`;
        if (/INVALID_TOKEN|expired|invalid/i.test(blob)) {
          setError("This reset link is expired or invalid.");
        } else if (/PASSWORD_TOO_SHORT|too short/i.test(blob)) {
          setError("Password must be at least 8 characters.");
        } else if (/PASSWORD_TOO_LONG|too long/i.test(blob)) {
          setError("Password is too long. Use 128 characters or fewer.");
        } else {
          setError("Could not update password. Try again.");
        }
        return;
      }
      setPassword("");
      setConfirm("");
      setDone(true);
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
              {done ? "Password updated" : "Set a new password"}
            </h1>
            <p className="text-sm text-fg-muted">Opening Lab</p>
          </div>
        </div>

        {invalid && !done ? (
          <div className="space-y-3">
            <p className="text-sm text-fg">
              This reset link is expired or invalid. Request a new one from Sign
              in.
            </p>
            <Link
              to="/login"
              search={{ forgot: true }}
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-fg no-underline shadow-sm transition hover:opacity-95 active:scale-[0.98]"
            >
              Forgot password?
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-3">
            <p className="text-sm text-fg">
              Password updated. Sign in with your new password.
            </p>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-fg no-underline shadow-sm transition hover:opacity-95 active:scale-[0.98]"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <PasswordField
              label="New password"
              name="new-password"
              value={password}
              onChange={setPassword}
            />
            <PasswordField
              label="Confirm password"
              name="confirm-password"
              value={confirm}
              onChange={setConfirm}
            />
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
              {busy ? "Please wait…" : "Update password"}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="inline-block text-sm font-semibold text-accent no-underline"
        >
          ← Back to sign in
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
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
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
      <span className="text-sm font-semibold text-fg">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          autoComplete="new-password"
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
