import type { ReactNode } from "react";

export function LegalPage({
  title,
  children,
  updated = "30 August 2026",
}: {
  title: string;
  children: ReactNode;
  updated?: string;
}) {
  return (
    <main className="relative z-10 min-h-dvh bg-bg px-4 py-8 text-fg">
      <article className="relative z-10 mx-auto max-w-[520px]">
        <a
          href="/"
          className="relative z-20 inline-flex min-h-11 items-center rounded-lg bg-bg-subtle px-3 text-sm font-semibold text-accent no-underline"
        >
          ← Home
        </a>
        <h1 className="mt-4 font-display text-[1.65rem] font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-[0.78rem] text-fg-subtle">
          Last updated {updated}
        </p>
        <div className="mt-6 space-y-5 text-[0.95rem] leading-relaxed text-fg-muted">
          {children}
        </div>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-fg">{title}</h2>
      <div className="mt-1.5 space-y-3">{children}</div>
    </section>
  );
}
