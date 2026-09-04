import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { LANG_OPTIONS, useI18n } from "@/lib/i18n";

type Props = {
  /** Extra class on the outer wrap (e.g. splash-lang). */
  className?: string;
};

export function LangToggle({ className }: Props) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const backRef = useRef<HTMLButtonElement>(null);
  const current = LANG_OPTIONS.find((opt) => opt.id === lang) ?? LANG_OPTIONS[0];

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    backRef.current?.focus();
  }, [open]);

  const wrapClass = ["lang-toggle-wrap", className ?? ""].filter(Boolean).join(" ");

  return (
    <div className={wrapClass}>
      <button
        type="button"
        className="lang-toggle"
        aria-label={t("Language")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {current.short}
      </button>

      {open ? (
        <div
          className="lang-picker-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={close}
        >
          <div
            className="lang-picker-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lang-picker-header">
              <button
                ref={backRef}
                type="button"
                className="lang-picker-back"
                onClick={close}
              >
                {t("Back")}
              </button>
              <h2 id={titleId} className="lang-picker-title">
                {t("Language")}
              </h2>
              <button
                type="button"
                className="lang-picker-close"
                onClick={close}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="lang-picker-list" role="listbox" aria-label={t("Language")}>
              {LANG_OPTIONS.map((opt) => {
                const selected = opt.id === lang;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={
                        selected
                          ? "lang-picker-option lang-picker-option-selected"
                          : "lang-picker-option"
                      }
                      onClick={() => {
                        setLang(opt.id);
                        close();
                      }}
                    >
                      <span className="lang-picker-option-label">{opt.short}</span>
                      <span
                        className={
                          selected
                            ? "lang-picker-check lang-picker-check-on"
                            : "lang-picker-check"
                        }
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Alias for shared use from splash / shell. */
export function LangPicker(props: Props) {
  return <LangToggle {...props} />;
}
