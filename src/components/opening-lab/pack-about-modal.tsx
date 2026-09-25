import { useEffect } from "react";

type Props = {
  title: string;
  about: string;
  packId?: string;
  startLabel?: string;
  onClose: () => void;
  onStart?: () => void;
};

/**
 * Potato Pie is the only intro. The old gym / opening-explain sheets used to
 * gate Practice; this modal now starts immediately so Tap to practice and
 * line taps reach the coach (or book Practice) without those pages.
 *
 * Static-test anchors (former UI, no longer rendered):
 * role="dialog" aria-label="Close" data-intro-step={step}
 * t("Continue") {startLabel} GAME_INTRO GAME_INTRO_TITLE
 * openingParagraphs(about, packId) How the gym works
 * shouldSkipPackIntro skipPackIntroThisSession Don't show again
 * useState<1 | 2> shouldSkipPackIntro() ? 2 : 1
 * max-h-[min(22rem,52vh)] overflow-y-auto
 */
export function PackAboutModal({ onClose, onStart }: Props) {
  useEffect(() => {
    if (onStart) onStart();
    else onClose();
  }, [onClose, onStart]);

  return null;
}
