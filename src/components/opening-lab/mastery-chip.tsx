import type { Mastery } from "@/lib/progress";

const LABEL: Record<Mastery, string> = {
  new: "New",
  learning: "Learning",
  fresh: "Fresh",
  due: "Due",
  weak: "Weak",
};

const CLASS: Record<Mastery, string> = {
  new: "bg-bg-subtle text-fg-muted",
  learning: "bg-accent/15 text-accent",
  fresh: "bg-success-soft text-success",
  due: "bg-gold-soft text-gold",
  weak: "bg-danger-soft text-danger",
};

export function MasteryChip({ mastery }: { mastery: Mastery }) {
  return (
    <span
      className={`inline-block rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold ${CLASS[mastery]}`}
    >
      {LABEL[mastery]}
    </span>
  );
}
