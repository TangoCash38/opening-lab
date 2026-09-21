import { useT } from "@/lib/i18n";

const SUPPORT = "support@openinglab.co.uk";

type Props = {
  onBack: () => void;
};

/**
 * Support promise: a person checks the line, then we fix and refund.
 * A person checks the line. Not a store refund API.
 */
export function ReportLineView({ onBack }: Props) {
  const t = useT();
  const href = `mailto:support@openinglab.co.uk?subject=${encodeURIComponent("Incorrect line")}`;

  return (
    <section data-report-line>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
      >
        {t("← Back")}
      </button>
      <h1 className="mb-3 font-display text-[1.65rem] font-bold tracking-tight">
        {t("Report incorrect line")}
      </h1>
      <div className="space-y-3 rounded-[var(--radius-card)] border border-border bg-bg-elevated px-4 py-4 text-[0.95rem] leading-relaxed text-fg-muted">
        <p className="m-0 font-semibold text-fg">{t("Thanks for spotting it.")}</p>
        <p className="m-0">
          {t(
            "If a line is not a real book move, tell us. We'll check it, fix the line, and refund you.",
          )}
        </p>
        <p className="m-0">
          {t(
            "Email the pack and the move. A person checks it. This is not an automatic store refund.",
          )}
        </p>
        <a
          href={href}
          className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg no-underline active:scale-[0.99]"
        >
          {t("Email support")}
        </a>
        <p className="m-0 text-center text-[0.82rem]">
          <a href={`mailto:${SUPPORT}`} className="font-semibold text-accent">
            {SUPPORT}
          </a>
        </p>
      </div>
    </section>
  );
}
