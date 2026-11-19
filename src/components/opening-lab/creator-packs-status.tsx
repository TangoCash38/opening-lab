import type { PackReviewStatus } from "@/lib/creator-packs-review";

const LABELS: Record<PackReviewStatus, string> = {
  review: "In review",
  live: "Live",
  returned: "Sent back",
};

export function CreatorPackStatus({ status }: { status: PackReviewStatus }) {
  return (
    <span className={`creator-status creator-status--${status}`} data-creator-status={status}>
      {LABELS[status]}
    </span>
  );
}
