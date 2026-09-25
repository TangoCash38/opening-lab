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
 */
export function PackAboutModal({ onClose, onStart }: Props) {
  useEffect(() => {
    if (onStart) onStart();
    else onClose();
  }, [onClose, onStart]);

  return null;
}
