import { useState } from "react";
import { X } from "lucide-react";
import {
  GAME_INTRO,
  GAME_INTRO_TITLE,
  markPackIntroSeen,
  openingParagraphs,
} from "@/lib/pack-intro";

type Props = {
  title: string;
  about: string;
  packId?: string;
  startLabel?: string;
  onClose: () => void;
  onStart?: () => void;
};

export function PackAboutModal({
  title,
  about,
  packId,
  startLabel = "Train",
  onClose,
  onStart,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const opening = openingParagraphs(about, packId);
  const heading = step === 1 ? GAME_INTRO_TITLE : title;
  const paragraphs = step === 1 ? [GAME_INTRO] : opening;

  const close = () => {
    if (packId) markPackIntroSeen(packId);
    onClose();
  };

  const start = () => {
    if (packId) markPackIntroSeen(packId);
    if (onStart) onStart();
    else onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pack-about-title"
      data-intro-step={step}
      onClick={close}
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h2
            id="pack-about-title"
            className="m-0 pr-2 font-display text-lg font-bold leading-snug"
          >
            {heading}
          </h2>
          <button
            type="button"
            onClick={close}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-bg-subtle text-fg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-5">
          {paragraphs.map((para) => (
            <p
              key={para.slice(0, 48)}
              className="m-0 text-[0.92rem] leading-relaxed text-fg-muted"
            >
              {para}
            </p>
          ))}
        </div>
        <div className="border-t border-border px-5 py-4">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
            >
              {startLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
