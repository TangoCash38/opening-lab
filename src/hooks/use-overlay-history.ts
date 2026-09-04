import { useEffect, useRef } from "react";
import { bindOverlayHistory } from "@/lib/overlay-history";

/**
 * While `open` is true, push a history entry so Android WebView / browser Back
 * closes this overlay (via `onClose`) instead of leaving the page.
 * When `open` flips false from in-sheet controls, the binding releases with
 * history.back() so the stack stays clean.
 */
export function useOverlayHistory(
  open: boolean,
  onClose: () => void,
  id = "overlay",
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    const binding = bindOverlayHistory(window, {
      id,
      onPop: () => onCloseRef.current(),
    });

    return () => binding.release();
  }, [open, id]);
}
