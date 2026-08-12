import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[10px] bg-accent text-lg font-bold text-accent-fg">
            ♔
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Sign in</h1>
            <p className="text-sm text-fg-muted">Opening Lab</p>
          </div>
        </div>

        {authEnabled ? (
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="w-full rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm font-semibold text-fg shadow-sm transition hover:bg-bg-subtle active:scale-[0.98]"
              >
                Continue with {p.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-fg-muted">Sign-in is disabled.</p>
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
