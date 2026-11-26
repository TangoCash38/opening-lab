import { useT } from "@/lib/i18n";
import { MAKER_BADGE_LABEL } from "@/lib/maker-badge-copy";

/** Visible mark on first-party packs. Not passed through i18n. */
export const OPENING_LAB_MAKER = "Opening Lab";

type Props = {
  /** Creator display name. Omitted packs are first-party Opening Lab packs. */
  name?: string;
};

/**
 * Small gold authenticity mark. The visible text is the maker's name.
 * Screen readers hear a localised "Made by …" label.
 */
export function MakerBadge({ name = OPENING_LAB_MAKER }: Props) {
  const t = useT();
  const maker = name.trim() || OPENING_LAB_MAKER;
  const label = t(MAKER_BADGE_LABEL, { name: maker });
  return (
    <span className="maker-badge" data-maker-badge={maker} aria-label={label}>
      <svg className="maker-badge-seal" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" />
        <path
          d="M4.7 8.15 6.9 10.35 11.45 5.7"
          fill="none"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="maker-badge-name" aria-hidden="true" translate="no">
        {maker}
      </span>
    </span>
  );
}
