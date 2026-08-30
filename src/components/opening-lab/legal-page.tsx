import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-bg px-4 py-8 text-fg">
      <article className="mx-auto max-w-[520px] select-text">
        <Link
          to="/"
          className="inline-block text-sm font-semibold text-accent no-underline"
        >
          ← Back to Opening Lab
        </Link>
        <h1 className="mt-4 font-display text-[1.65rem] font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-[0.78rem] text-fg-subtle">
          Last updated 30 August 2026
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
