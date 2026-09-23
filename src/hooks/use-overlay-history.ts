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

    let binding: ReturnType<typeof bindOverlayHistory> | null = null;
    let cancelled = false;
    // Strict Mode runs setup → cleanup → setup synchronously. Binding
    // immediately would pushState and then history.back() before the pop
    // lands, so the next dismiss (Test yourself) leaves the page or jumps
    // to the top. Wait one microtask so the throwaway setup is cancelled.
    queueMicrotask(() => {
      if (cancelled) return;
      binding = bindOverlayHistory(window, {
        id,
        onPop: () => onCloseRef.current(),
      });
    });

    return () => {
      cancelled = true;
      if (binding) binding.release();
    };
  }, [open, id]);
}
