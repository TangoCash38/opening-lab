import { X } from "lucide-react";

type Props = {
  title: string;
  about: string;
  onClose: () => void;
};

export function PackAboutModal({ title, about, onClose }: Props) {
  const paragraphs = about.split("\n\n").map((p) => p.trim()).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pack-about-title"
      onClick={onClose}
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
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
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
      </div>
    </div>
  );
}
